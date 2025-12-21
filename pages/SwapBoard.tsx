
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer } from '../types';
import { matchSwaps } from '../services/geminiService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');

  const fetchAndMatch = useCallback(async () => {
    setLoading(true);
    
    // Si Supabase n'est pas configuré, on reste en mode local/démo
    if (!isSupabaseConfigured || !supabase) {
      setDbStatus('offline');
      setLoading(false);
      return;
    }
    
    try {
      setDbStatus('connecting');
      const { data, error } = await supabase
        .from('swap_offers')
        .select('*')
        .eq('depot', user.depot)
        .neq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      setDbStatus('online');

      const remoteOffers: SwapOffer[] = (data || []).map(item => ({
        id: item.id,
        user: { 
          firstName: item.user_name.split(' ')[0], 
          lastName: item.user_name.split(' ')[1], 
          sncbId: item.user_sncb_id 
        },
        offeredDuty: item.duty_data,
        matchScore: 0,
        matchReasons: [],
        type: item.is_urgent ? 'manual_request' : 'suggested'
      }));

      // Appel à Gemini pour le matching intelligent
      const matched = await matchSwaps(preferences, remoteOffers);
      setSwaps(matched);
    } catch (err) {
      console.error("Erreur de synchronisation base de données:", err);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.depot, preferences]);

  useEffect(() => {
    fetchAndMatch();

    // ECOUTE TEMPS RÉEL (SUPABASE REALTIME)
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('swap_updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'swap_offers',
          filter: `depot=eq.${user.depot}` 
        }, () => {
          fetchAndMatch(); // Re-calculer le match dès qu'une offre change
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchAndMatch, user.depot]);

  const handleContact = (swap: SwapOffer) => {
    const subject = encodeURIComponent(`SWAP ACT : Intérêt pour votre service ${swap.offeredDuty.code}`);
    const body = encodeURIComponent(`Bonjour ${swap.user.firstName},\n\nJ'ai vu ton offre de service ${swap.offeredDuty.code} sur l'appli Swap.\n\nSerait-il possible d'échanger ?\n\nBien à toi,\n${user.firstName} ${user.lastName}`);
    window.location.href = `mailto:${swap.user.sncbId}@sncb.be?subject=${subject}&body=${body}`;
  };

  const displayedSwaps = filter === 'urgent' ? swaps.filter(s => s.type === 'manual_request') : swaps;

  return (
    <div className="max-w-7xl mx-auto p-4 pb-32 animate-fadeIn space-y-12">
      {/* HEADER AVEC STATUS CONNEXION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Bourse aux échanges</h2>
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center shadow-sm border ${
              dbStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' : 
              dbStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 
              'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dbStatus === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              {dbStatus === 'online' ? 'Live Database' : dbStatus === 'connecting' ? 'Synchronisation...' : 'Mode Local'}
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Secteur : {user.depot} • IA Matching Actif</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-sncb-blue shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Toutes les offres
          </button>
          <button 
            onClick={() => setFilter('urgent')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === 'urgent' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            🔥 Urgences
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-sncb-blue border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em] animate-pulse">Matching IA en cours...</p>
        </div>
      ) : displayedSwaps.length === 0 ? (
        <div className="bg-white rounded-[50px] p-24 text-center border-4 border-dashed border-slate-100 shadow-sm animate-fadeIn">
          <div className="text-7xl mb-8 opacity-10">🚉</div>
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Voie Libre</h3>
          <p className="text-slate-400 mt-3 font-bold text-sm uppercase tracking-widest">Aucune proposition d'échange pour le moment.</p>
          <button onClick={fetchAndMatch} className="mt-8 text-sncb-blue font-black text-[10px] uppercase border-b-2 border-sncb-blue pb-1 hover:opacity-70 transition-all">Actualiser la recherche</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedSwaps.map(swap => (
            <div key={swap.id} className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-sncb-blue/10 transition-all duration-500 hover:-translate-y-2 flex flex-col">
              {/* HEADER CARTE */}
              <div className={`${swap.type === 'manual_request' ? 'bg-red-600' : 'bg-slate-900'} p-8 text-white relative`}>
                <div className="absolute top-6 right-6 bg-sncb-yellow text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl shadow-black/20 transform rotate-3">
                  {swap.matchScore}% MATCH
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black opacity-50 uppercase tracking-[0.2em]">
                    {swap.type === 'manual_request' ? '📍 Demande Urgente' : '🤖 Recommandation IA'}
                  </p>
                  <h3 className="text-5xl font-black italic tracking-tighter">{swap.offeredDuty.code}</h3>
                  <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">{swap.offeredDuty.date}</p>
                </div>
              </div>

              {/* CONTENU CARTE */}
              <div className="p-8 flex-grow space-y-8 flex flex-col">
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Dép.</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.startTime}</p>
                  </div>
                  <div className="flex-grow flex flex-col items-center px-4">
                    <span className="text-xl mb-1">🚆</span>
                    <div className="h-0.5 bg-slate-200 w-full rounded-full relative">
                       <div className="absolute inset-0 bg-sncb-blue w-1/3 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Arr.</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.endTime}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-sncb-blue uppercase tracking-widest flex items-center">
                    <span className="w-5 h-5 bg-sncb-blue/10 rounded-lg flex items-center justify-center mr-2 text-[10px]">🧠</span>
                    Analyse du matching
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {swap.matchReasons.map((reason, i) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-600 px-3 py-2 rounded-xl border border-slate-100 italic transition-colors hover:bg-slate-100">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-sncb-blue text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg flex-shrink-0 group-hover:rotate-6 transition-transform">
                      {swap.user.firstName?.[0]}
                    </div>
                    <div className="truncate">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Posté par</p>
                      <p className="text-[11px] font-black text-slate-900 uppercase truncate">{swap.user.firstName} {swap.user.lastName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleContact(swap)}
                    className="bg-sncb-blue text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sncb-yellow hover:text-slate-900 transition-all shadow-lg active:scale-95 flex-shrink-0"
                  >
                    Contacter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
