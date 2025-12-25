
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer } from '../types';
import { swapService, formatError } from '../lib/api';
import { getStationName } from '../lib/stationCodes';
import { Repeat, Plus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

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
    <div className="space-y-6 md:space-y-8 animate-slide-up max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-[#333333] uppercase italic tracking-tight">Permutes</h2>
          <p className="text-xs text-gray-500 font-medium">Dépôt de {user.depot || 'Bruxelles-Midi'}</p>
        </div>
        <div className="flex gap-2.5">
           <button 
             onClick={fetchSwaps}
             className="p-2.5 md:p-3 border-2 border-gray-200 rounded-lg text-gray-400 hover:text-[#003399] transition-all"
           >
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <button className="flex-grow md:flex-none bg-sncb-blue text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sncb-blue/20 active:scale-95 transition-all">
              <Plus size={16} />
              Publier
           </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-2 text-red-700 text-[10px] font-bold uppercase">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Loader2 className="animate-spin text-[#003399] mb-3" size={32} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calcul du matching...</p>
        </div>
      ) : swaps.length === 0 ? (
        <div className="py-20 text-center glass-card border-dashed bg-gray-50/50">
          <p className="text-gray-400 font-bold uppercase text-[10px] italic">Aucune offre disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="hidden lg:block glass-card overflow-hidden bg-white">
            <table className="w-full text-left">
               <thead>
                 <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
                   <th className="px-8 py-5">Collègue</th>
                   <th className="px-8 py-5">Prestation</th>
                   <th className="px-8 py-5">Tour</th>
                   <th className="px-8 py-5 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {swaps.map((swap) => (
                   <tr key={swap.id} className="group hover:bg-blue-50/30 transition-all">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-sncb-blue/10 flex items-center justify-center font-black text-sncb-blue border border-sncb-blue/5">
                           {swap.user.firstName?.[0]}{swap.user.lastName?.[0]}
                         </div>
                         <div>
                           <p className="font-bold text-gray-800 text-sm">{swap.user.firstName} {swap.user.lastName}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{swap.user.sncbId}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-800">{swap.offeredDuty.startTime}</span>
                          <span className="text-gray-300">—</span>
                          <span className="text-sm font-black text-gray-800">{swap.offeredDuty.endTime}</span>
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">
                         {new Date(swap.offeredDuty.date).toLocaleDateString('fr-BE')}
                       </p>
                     </td>
                     <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-black text-sncb-blue border border-gray-200">
                         {swap.offeredDuty.code}
                       </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <button className="bg-white border-2 border-sncb-blue text-sncb-blue px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-sncb-blue hover:text-white transition-all">
                           Demander
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>

          {/* Mobile Card View (Hidden on Desktop Large) */}
          <div className="lg:hidden space-y-4">
            {swaps.map((swap) => (
              <div key={swap.id} className="glass-card p-5 bg-white space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sncb-blue/10 flex items-center justify-center font-black text-sncb-blue">
                      {swap.user.firstName?.[0]}{swap.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-xs">{swap.user.firstName} {swap.user.lastName}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{swap.user.sncbId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-sncb-blue border border-gray-100">
                      T{swap.offeredDuty.code}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Prestation</p>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-gray-800">{swap.offeredDuty.startTime}</span>
                       <span className="text-gray-300">—</span>
                       <span className="text-sm font-black text-gray-800">{swap.offeredDuty.endTime}</span>
                    </div>
                    <p className="text-[9px] font-bold text-sncb-blue mt-1">
                      {new Date(swap.offeredDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button className="bg-sncb-blue text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all">
                    Demander
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-5 bg-[#003399]/5 rounded-xl border border-[#003399]/10">
        <p className="text-[9px] text-[#003399] font-bold uppercase leading-relaxed text-center md:text-left">
          L'échange doit être validé par le TS local.
        </p>
      </div>
    </div>
  );
};

export default SwapBoard;
