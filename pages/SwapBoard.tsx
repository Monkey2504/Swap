
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';
import { getStationName } from '../lib/stationCodes';
import { Search, MapPin, Repeat, Sparkles, Filter, MoreHorizontal, User, Loader2, Plus } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSwaps = useCallback(async () => {
    setLoading(true);
    try {
      const remoteOffers = await swapService.getAvailableSwaps(undefined, user.id);
      const matched = await swapService.matchSwaps(preferences, remoteOffers);
      setSwaps(matched.map(m => ({...m, status: 'pending_colleague' as SwapStatus})));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [user.id, preferences]);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tight uppercase">Bourse aux Échanges</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Réseau National SNCB</p>
        </div>
        <div className="flex gap-3">
           <button className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white/60 hover:text-white transition-colors">
              <Filter size={20} />
           </button>
           <button className="fab-create px-6 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest">
              <Plus size={18} />
              Publier
           </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-0">
           <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 bg-white/[0.01]">
                  <th className="px-8 py-6">Agent</th>
                  <th className="px-8 py-6">Service & Tour</th>
                  <th className="px-8 py-6">Match</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr><td colSpan={4} className="py-32 text-center"><Loader2 className="animate-spin text-purple-500 mx-auto" /></td></tr>
                ) : swaps.map((swap, idx) => (
                  <tr key={swap.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/20">
                          <img src={`https://i.pravatar.cc/150?u=${swap.id}`} alt="Agent" />
                        </div>
                        <div>
                          <p className="font-black text-sm italic tracking-tight">{swap.user.firstName} {swap.user.lastName}</p>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{swap.user.depot || 'Bruxelles'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black italic">{swap.offeredDuty.code} — {swap.offeredDuty.startTime} > {swap.offeredDuty.endTime}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase">
                          {getStationName(swap.offeredDuty.destinations?.[0] || 'TOUR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/30 inline-block">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">Match: {swap.matchScore}%</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all">
                          <Repeat size={18} className="text-white/40 group-hover:text-purple-400" />
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
