
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';
import { Search, Filter, Sparkles, Clock, MapPin, ArrowRightLeft } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchSwaps = useCallback(async () => {
    setLoading(true);
    try {
      const remoteOffers = await swapService.getAvailableSwaps(user.depot, user.id);
      const matched = await swapService.matchSwaps(preferences, remoteOffers);
      setSwaps(matched.map(m => ({...m, status: 'pending_colleague' as SwapStatus})));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [user.id, user.depot, preferences]);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  const handleInterest = async (swap: SwapOffer) => {
    try {
      await swapService.sendSwapRequest(swap.id, user);
      alert(`Votre proposition d'échange a été transmise à ${swap.user.firstName}.`);
    } catch (err: any) { alert(err.message); }
  };

  const filteredSwaps = filterType === 'all' 
    ? swaps 
    : swaps.filter(s => s.offeredDuty.type === filterType);

  return (
    <div className="space-y-10 animate-slide-up">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 heading-hero">Bourse aux Échanges</h2>
          <p className="text-slate-500 mt-2 font-medium">Découvrez les meilleures opportunités basées sur vos préférences IA.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
             <select 
               onChange={(e) => setFilterType(e.target.value)}
               className="appearance-none bg-white border border-slate-200 rounded-xl px-10 py-3 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-sncb-blue/20 transition-all apple-shadow"
             >
               <option value="all">Tous les types</option>
               <option value="IC">Trains IC</option>
               <option value="L">Omnibus (L)</option>
               <option value="S">RER (S)</option>
             </select>
             <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           </div>
           
           <button 
             onClick={fetchSwaps}
             className="bg-white border border-slate-200 p-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all apple-shadow"
             title="Rafraîchir"
           >
             <Clock size={18} />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-sncb-blue rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Analyse Intelligente</p>
            <p className="text-xs text-slate-400 mt-1">Comparaison de milliers de combinaisons...</p>
          </div>
        </div>
      ) : filteredSwaps.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] border border-slate-100 apple-shadow">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
            <Search size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Aucun résultat trouvé</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">Il n'y a pas d'offres correspondant à vos critères à {user.depot} actuellement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-20">
          {filteredSwaps.map((swap, idx) => (
            <div 
              key={swap.id} 
              className="bg-white rounded-[32px] overflow-hidden border border-slate-100 apple-shadow apple-shadow-hover transition-all flex flex-col group animate-fadeIn"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Card Header: Score & User */}
              <div className="p-8 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sncb-blue text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-sncb-blue/20">
                    {swap.user.firstName?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{swap.user.firstName} {swap.user.lastName}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       <MapPin size={12} className="text-slate-300" />
                       <span>Dépôt {user.depot}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
                     <Sparkles size={14} className="animate-pulse" />
                     <span className="text-sm font-bold">{swap.matchScore}% Match</span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Score de Pertinence IA</p>
                </div>
              </div>

              {/* Card Body: Duty Details */}
              <div className="p-8 space-y-8 flex-grow">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">{swap.offeredDuty.code}</span>
                      <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-100">{swap.offeredDuty.type}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horaire</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-900">{swap.offeredDuty.startTime}</span>
                      <span className="text-slate-200">→</span>
                      <span className="text-2xl font-bold text-slate-900">{swap.offeredDuty.endTime || '--:--'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pourquoi ce match ?</p>
                  <div className="flex flex-wrap gap-2">
                    {swap.matchReasons.map((reason, i) => (
                      <span key={i} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-sm">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Action */}
              <div className="p-8 pt-0 mt-auto">
                <button 
                  onClick={() => handleInterest(swap)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  <ArrowRightLeft size={18} />
                  Proposer un Échange
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
