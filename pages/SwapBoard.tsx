
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService, formatError } from '../lib/api';
import { getStationName } from '../lib/stationCodes';
import { Repeat, Plus, Loader2, Filter, AlertCircle, RefreshCw } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSwaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remoteOffers = await swapService.getAvailableSwaps(user.depot, user.id);
      // Pour le MVP, on filtre par dépôt pour limiter les erreurs de trajet
      const matched = await swapService.matchSwaps(preferences, remoteOffers);
      setSwaps(matched as SwapOffer[]);
    } catch (err) { 
      setError(formatError(err));
    } finally { 
      setLoading(false); 
    }
  }, [user.id, user.depot, preferences]);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#333333] uppercase italic tracking-tight">Bourse aux Permutes</h2>
          <p className="text-sm text-gray-500 font-medium">Offres disponibles au dépôt de {user.depot || 'Bruxelles-Midi'}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={fetchSwaps}
             className="p-3 border-2 border-gray-200 rounded-lg text-gray-400 hover:text-[#003399] hover:border-[#003399] transition-all"
           >
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
           <button className="btn-sncb-primary flex items-center gap-2 shadow-lg shadow-[#003399]/20">
              <Plus size={18} />
              Publier un service
           </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-xs font-bold uppercase">{error}</p>
        </div>
      )}

      <div className="sncb-card overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5">Collègue</th>
                  <th className="px-8 py-5">Prestation (PS - FS)</th>
                  <th className="px-8 py-5">Tour</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <Loader2 className="animate-spin text-[#003399] mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Chargement de la bourse...</p>
                    </td>
                  </tr>
                ) : swaps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <p className="text-gray-400 font-bold uppercase text-xs italic">Aucune permute disponible pour le moment</p>
                    </td>
                  </tr>
                ) : swaps.map((swap) => (
                  <tr key={swap.id} className="group hover:bg-blue-50/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-[#003399]/10 flex items-center justify-center font-black text-[#003399]">
                          {swap.user.firstName?.[0]}{swap.user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{swap.user.firstName} {swap.user.lastName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{swap.user.sncbId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-[#333333]">{swap.offeredDuty.startTime}</span>
                         <span className="text-gray-300">—</span>
                         <span className="text-sm font-black text-[#333333]">{swap.offeredDuty.endTime}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {new Date(swap.offeredDuty.date).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-black text-[#003399]">
                        {swap.offeredDuty.code}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="btn-sncb-outline flex items-center gap-2 ml-auto group-hover:bg-[#003399] group-hover:text-white transition-all">
                          <Repeat size={14} />
                          Demander
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
      
      <div className="p-6 bg-[#003399]/5 rounded-lg border border-[#003399]/10">
        <p className="text-[10px] text-[#003399] font-bold uppercase leading-relaxed">
          Attention : Tout échange de service doit être validé par votre Tableau de Service (TS) local après accord entre collègues via l'application.
        </p>
      </div>
    </div>
  );
};

export default SwapBoard;
