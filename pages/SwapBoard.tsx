
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';
import { getStationName } from '../lib/stationCodes';
import { Search, MapPin, Repeat, Sparkles, Filter, MoreHorizontal, User } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyMyDepot, setShowOnlyMyDepot] = useState(true);

  const fetchSwaps = useCallback(async () => {
    setLoading(true);
    try {
      const depotToFetch = showOnlyMyDepot ? user.depot : undefined;
      const remoteOffers = await swapService.getAvailableSwaps(depotToFetch, user.id);
      const matched = await swapService.matchSwaps(preferences, remoteOffers);
      setSwaps(matched.map(m => ({...m, status: 'pending_colleague' as SwapStatus})));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [user.id, user.depot, preferences, showOnlyMyDepot]);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">Tableau des Échanges</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {showOnlyMyDepot ? `Dépôt ${user.depot}` : "Réseau complet"}
          </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowOnlyMyDepot(!showOnlyMyDepot)}
             className="px-6 py-3 glass-card text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
           >
             {showOnlyMyDepot ? "Tout le réseau" : "Mon Dépôt"}
           </button>
           <button className="bg-accent-purple glow-purple px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
             Publier un Service
           </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-8">
           <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                  <th className="pb-8">Agent de bord</th>
                  <th className="pb-8">Service & Tour</th>
                  <th className="pb-8">Match Score</th>
                  <th className="pb-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-xs font-bold text-slate-500 animate-pulse">
                      Synchronisation avec le Cloud SNCB...
                    </td>
                  </tr>
                ) : swaps.map((swap) => (
                  <tr key={swap.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple font-black border border-accent-purple/20">
                          {swap.user.firstName?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-sm">{swap.user.firstName} {swap.user.lastName}</p>
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-black uppercase tracking-widest">
                            <MapPin size={10} /> {swap.offeredDuty.depot || user.depot}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black italic">{swap.offeredDuty.code} — {swap.offeredDuty.startTime} > {swap.offeredDuty.endTime}</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {getStationName(swap.offeredDuty.destinations?.[0] || 'TOUR')}
                        </p>
                      </div>
                    </td>
                    <td className="py-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple/10 rounded-full border border-accent-purple/20">
                          <Sparkles size={12} className="text-accent-purple" />
                          <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest">MATCH {swap.matchScore}%</span>
                       </div>
                    </td>
                    <td className="py-6 text-right">
                       <button className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white">
                          <Repeat size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default SwapBoard;
