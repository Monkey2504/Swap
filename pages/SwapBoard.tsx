
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, SwapStatus } from '../types';
import { swapService } from '../lib/api';
import { getStationName } from '../lib/stationCodes';
import { Search, Filter, Sparkles, Clock, MapPin, ArrowRightLeft, User, Globe } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyMyDepot, setShowOnlyMyDepot] = useState<boolean>(true);

  const fetchSwaps = useCallback(async () => {
    setLoading(true);
    try {
      // On passe le dépôt si le filtre est actif, sinon on récupère tout
      const depotToFetch = showOnlyMyDepot ? user.depot : undefined;
      const remoteOffers = await swapService.getAvailableSwaps(depotToFetch, user.id);
      const matched = await swapService.matchSwaps(preferences, remoteOffers);
      setSwaps(matched.map(m => ({...m, status: 'pending_colleague' as SwapStatus})));
    } catch (err) { 
      console.error(err); 
    } 
    finally { 
      setLoading(false); 
    }
  }, [user.id, user.depot, preferences, showOnlyMyDepot]);

  useEffect(() => { 
    fetchSwaps(); 
  }, [fetchSwaps]);

  const handleInterest = async (swap: SwapOffer) => {
    try {
      await swapService.sendSwapRequest(swap.id, user);
      alert(`Votre proposition a été transmise à ${swap.user.firstName}.`);
    } catch (err: any) { 
      alert(err.message); 
    }
  };

  const filteredSwaps = filterType === 'all' 
    ? swaps 
    : swaps.filter(s => s.offeredDuty.type === filterType);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">Bourse aux Swaps</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
            {showOnlyMyDepot ? `Dépôt ${user.depot} Uniquement` : "Réseau SNCB Complet"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           {/* Filtre Dépôt Toggle */}
           <button 
             onClick={() => setShowOnlyMyDepot(!showOnlyMyDepot)}
             className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-black transition-all shadow-xl ${
               showOnlyMyDepot 
                 ? 'bg-sncb-blue text-white' 
                 : 'bg-white text-slate-500 hover:text-sncb-blue'
             }`}
           >
             {showOnlyMyDepot ? <MapPin size={18} /> : <Globe size={18} />}
             <span className="uppercase tracking-widest">
               {showOnlyMyDepot ? `Mon Dépôt` : "Tout le réseau"}
             </span>
           </button>

           {/* Filtre Type */}
           <div className="relative">
             <select 
               onChange={(e) => setFilterType(e.target.value)}
               className="appearance-none bg-white border-none rounded-2xl pl-12 pr-10 py-4 text-sm font-bold text-slate-600 shadow-xl focus:ring-2 focus:ring-sncb-blue/10 min-w-[160px]"
             >
               <option value="all">Tous types</option>
               <option value="IC">InterCity (IC)</option>
               <option value="L">Omnibus (L)</option>
               <option value="S">RER (S)</option>
               <option value="P">Heure de pointe (P)</option>
             </select>
             <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sncb-blue" />
           </div>
           
           <button 
             onClick={fetchSwaps} 
             disabled={loading}
             className="bg-white p-4 rounded-2xl text-slate-400 shadow-xl hover:text-sncb-blue transition-colors disabled:opacity-50"
           >
             <Clock size={20} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-10 h-10 border-[3px] border-slate-100 border-t-sncb-blue rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analyse IA des correspondances...</p>
        </div>
      ) : filteredSwaps.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] shadow-2xl border border-white">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Search size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 italic uppercase">Aucune offre trouvée</h3>
          <p className="text-slate-400 font-bold text-sm mt-3 px-10 leading-relaxed">
            {showOnlyMyDepot 
              ? `Il n'y a pas encore d'offres actives pour le dépôt de ${user.depot}.`
              : "Aucune offre de swap n'est disponible sur le réseau pour le moment."}
            <br/>Changez vos filtres ou réessayez plus tard !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredSwaps.map((swap) => (
            <div key={swap.id} className="bg-white rounded-[40px] p-8 shadow-2xl border border-white relative overflow-hidden group hover:scale-[1.01] transition-all">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-[20px] text-[10px] font-black tracking-widest flex items-center gap-2 uppercase">
                <Sparkles size={12} />
                {swap.matchScore}% de Match
              </div>

              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-sncb-blue/5 rounded-[24px] flex items-center justify-center text-sncb-blue border border-sncb-blue/5">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight text-slate-900">{swap.user.firstName}</h4>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    <MapPin size={10} className="text-sncb-blue/40" /> {swap.offeredDuty.depot || user.depot}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Tour de service</p>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.code}</p>
                  <p className="text-[9px] font-black text-sncb-blue bg-sncb-blue/10 inline-block px-2.5 py-1 rounded-full mt-2 uppercase tracking-widest">{swap.offeredDuty.type}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Horaire PS - FS</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{swap.offeredDuty.startTime} — {swap.offeredDuty.endTime}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                    {new Date(swap.offeredDuty.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              {/* Destination mapping display */}
              {swap.offeredDuty.destinations && swap.offeredDuty.destinations.length > 0 && (
                <div className="mb-8 px-5 py-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center gap-3">
                  <MapPin size={14} className="text-emerald-600" />
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest truncate">
                    {swap.offeredDuty.destinations.map(d => getStationName(d)).join(' • ')}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-8 min-h-[28px]">
                {swap.matchReasons.slice(0, 2).map((reason, i) => (
                  <span key={i} className="text-[9px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider border border-slate-200/50">
                    {reason}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => handleInterest(swap)}
                className="w-full py-5 bg-sncb-blue text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-sncb-blue/20 hover:bg-[#002a7a] transition-all active:scale-[0.98]"
              >
                <ArrowRightLeft size={18} />
                Proposer un Échange
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
