
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-12 animate-fadeIn pb-40">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">Bourse <span className="text-sncb-blue">Act</span></h2>
        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.5em] opacity-80 italic">Optimisation par IA</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-10">
          <div className="w-16 h-16 border-[6px] border-sncb-blue/10 border-t-sncb-blue rounded-full animate-spin"></div>
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] animate-pulse">Analyse des compatibilités en cours...</p>
        </div>
      ) : swaps.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[60px] sncb-card border-none">
          <div className="text-7xl mb-8 opacity-20">🔄</div>
          <p className="text-slate-400 font-bold italic text-base">Aucun swap disponible à {user.depot} pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 pb-20">
          {swaps.map((swap, idx) => (
            <div 
              key={swap.id} 
              className="bg-white rounded-[56px] overflow-hidden sncb-card border-none animate-slideIn shadow-[0_30px_60px_-15px_rgba(0,51,153,0.08)]"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Header: User & Score Profile */}
              <div className="px-12 py-10 bg-slate-900 flex justify-between items-center text-white relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sncb-blue/30 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center font-black text-xl shadow-inner border border-white/5">
                    {swap.user.firstName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-widest leading-none mb-1">{swap.user.firstName} {swap.user.lastName}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Agent Série {swap.user.series}</p>
                  </div>
                </div>
                
                <div className="relative w-24 h-24 flex items-center justify-center z-10">
                  <svg className="absolute w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="48" cy="48" r="42" fill="none" stroke="#FFD200" strokeWidth="6" strokeDasharray="264" strokeDashoffset={264 - (264 * swap.matchScore / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="text-center">
                    <span className="text-2xl font-black text-sncb-yellow leading-none">{swap.matchScore}</span>
                    <span className="text-[8px] block font-black uppercase text-white/40 tracking-widest mt-0.5">Score</span>
                  </div>
                </div>
              </div>

              {/* Body: Service Details */}
              <div className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-3">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] block">Code Service</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-black text-sncb-blue tracking-tighter italic leading-none">{swap.offeredDuty.code}</span>
                      <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase border border-slate-100">{swap.offeredDuty.type}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] block">Horaires Prestation</span>
                    <div className="flex items-center gap-5">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">{swap.offeredDuty.startTime}</span>
                      <span className="text-slate-200 text-2xl font-light">➔</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">{swap.offeredDuty.endTime || '--:--'}</span>
                    </div>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="pt-10 border-t border-slate-50 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-px bg-sncb-yellow"></div>
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Analyse de compatibilité</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {swap.matchReasons.map((reason, i) => (
                      <span key={i} className="px-5 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-slate-100 shadow-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-sncb-blue rounded-full"></span>
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => handleInterest(swap)}
                  className="w-full py-7 font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl sncb-button-volume mt-4"
                >
                  Proposer un Échange ➔
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
