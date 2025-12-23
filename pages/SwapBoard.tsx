
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';
import { Search, Filter, Sparkles, Clock, MapPin, ArrowRightLeft, User } from 'lucide-react';

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
      alert(`Votre proposition a été transmise à ${swap.user.firstName}.`);
    } catch (err: any) { alert(err.message); }
  };

  const filteredSwaps = filterType === 'all' 
    ? swaps 
    : swaps.filter(s => s.offeredDuty.type === filterType);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">Bourse aux Swaps</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Dépôt {user.depot}</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
             <select 
               onChange={(e) => setFilterType(e.target.value)}
               className="appearance-none bg-white border-none rounded-2xl pl-12 pr-10 py-4 text-sm font-bold text-slate-600 shadow-xl focus:ring-2 focus:ring-sncb-blue/10"
             >
               <option value="all">Tous types</option>
               <option value="IC">InterCity (IC)</option>
               <option value="L">Omnibus (L)</option>
               <option value="S">RER (S)</option>
             </select>
             <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sncb-blue" />
           </div>
           
           <button onClick={fetchSwaps} className="bg-white p-4 rounded-2xl text-slate-400 shadow-xl hover:text-sncb-blue transition-colors">
             <Clock size={20} />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-10 h-10 border-[3px] border-slate-100 border-t-sncb-blue rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analyse IA...</p>
        </div>
      ) : filteredSwaps.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] shadow-2xl">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Pas de swaps dispo</h3>
          <p className="text-slate-400 text-sm mt-2">Réessayez plus tard !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredSwaps.map((swap) => (
            <div key={swap.id} className="bg-white rounded-[40px] p-8 shadow-2xl border border-white relative overflow-hidden group hover:scale-[1.01] transition-all">
              {/* Score IA Badge */}
              <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-[20px] text-xs font-black tracking-widest flex items-center gap-2">
                <Sparkles size={12} />
                {swap.matchScore}% MATCH
              </div>

              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-sncb-blue/5 rounded-[24px] flex items-center justify-center text-sncb-blue">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight text-slate-900">{swap.user.firstName}</h4>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin size={10} /> {user.depot}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-50 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Service</p>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.code}</p>
                  <p className="text-[9px] font-bold text-sncb-blue bg-sncb-blue/5 inline-block px-2 py-0.5 rounded mt-1">{swap.offeredDuty.type}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[28px]">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Horaire</p>
                  <p className="text-2xl font-black text-slate-900">{swap.offeredDuty.startTime}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">PS - FS</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {swap.matchReasons.slice(0, 2).map((reason, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">
                    {reason}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => handleInterest(swap)}
                className="w-full py-5 bg-sncb-blue text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-sncb-blue/20 hover:bg-[#002a7a] transition-all active:scale-95"
              >
                <ArrowRightLeft size={18} />
                PROPOSER SWAP
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
