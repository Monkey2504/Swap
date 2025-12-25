
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer } from '../types';
import { swapService, formatError } from '../lib/api';
import { LEGAL_DISCLAIMER } from '../constants';
import { Repeat, Plus, Loader2, RefreshCw, AlertCircle, Phone, MessageSquare, CheckCircle2, TrendingUp, Train, Calendar, Info } from 'lucide-react';

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
      setSwaps(matched as SwapOffer[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user.id, user.depot, preferences]);

  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);

  return (
    <div className="space-y-10 animate-slide-up max-w-6xl mx-auto pb-40">
      <div className="p-6 bg-sncb-blue/5 border border-sncb-blue/10 rounded-3xl flex items-start gap-4">
        <Info className="text-sncb-blue shrink-0" size={20} />
        <p className="text-[10px] font-bold text-sncb-blue/70 uppercase leading-relaxed tracking-wider">
          {LEGAL_DISCLAIMER}
        </p>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Bourse aux <span className="text-sncb-blue">Échanges</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{user.depot} • Secteur Actif</p>
        </div>
        <button className="bg-sncb-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-3">
          <Plus size={18} /> Publier un service
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <Loader2 className="animate-spin text-sncb-blue mb-4" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase">Synchronisation Cloud...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {swaps.map(swap => (
            <div key={swap.id} className="glass-card bg-white p-8 border-gray-100 hover:border-sncb-blue/30 transition-all group shadow-lg">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-sncb-blue/10 rounded-xl flex items-center justify-center font-black text-sncb-blue uppercase shadow-inner">
                     {swap.user.firstName?.[0]}
                   </div>
                   <div>
                     <h4 className="font-black text-slate-900 text-lg">{swap.user.firstName} {swap.user.lastName}</h4>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Matricule {swap.user.sncbId}</p>
                   </div>
                 </div>
                 <div className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    MATCH {swap.matchScore}%
                 </div>
               </div>

               <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-900">{swap.offeredDuty.startTime}</span>
                      <Repeat size={16} className="text-slate-300" />
                      <span className="text-2xl font-black text-slate-900">{swap.offeredDuty.endTime}</span>
                    </div>
                    <span className="text-[10px] font-black text-sncb-blue bg-white px-3 py-1 rounded-lg shadow-sm">
                      TOUR {swap.offeredDuty.code}
                    </span>
                 </div>
                 <p className="text-[11px] font-bold text-slate-400 uppercase mt-4">
                   {new Date(swap.offeredDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </p>
               </div>

               <div className="flex gap-3">
                 <button className="flex-grow py-4 bg-sncb-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10 active:scale-95 transition-all">
                    Demander l'échange
                 </button>
                 <a href={`tel:${swap.user.phone}`} className="p-4 bg-gray-100 text-slate-400 rounded-xl hover:text-sncb-blue transition-all">
                   <Phone size={20} />
                 </a>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
