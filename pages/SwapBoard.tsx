
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

  const fetchAndMatch = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('swap_offers')
        .select('*')
        .eq('depot', user.depot)
        .neq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

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

      const matched = await matchSwaps(preferences, remoteOffers);
      setSwaps(matched);
    } catch (err) {
      console.error("Match error", err);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.depot, preferences]);

  useEffect(() => {
    fetchAndMatch();

    // REALTIME: Écouter les changements dans la base pour mettre à jour instantanément
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('public:swap_offers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_offers' }, () => {
          fetchAndMatch();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchAndMatch]);

  const handleContact = (swap: SwapOffer) => {
    const subject = encodeURIComponent(`SWAP ACT : Intérêt pour votre service ${swap.offeredDuty.code}`);
    const body = encodeURIComponent(`Bonjour ${swap.user.firstName},\n\nJ'ai vu ton offre de service ${swap.offeredDuty.code} du ${swap.offeredDuty.date} sur l'appli Swap.\n\nEs-tu disponible pour en discuter ?\n\nBien à toi,\n${user.firstName} ${user.lastName}`);
    window.location.href = `mailto:${swap.user.sncbId}@sncb.be?subject=${subject}&body=${body}`;
  };

  const displayedSwaps = filter === 'urgent' ? swaps.filter(s => s.type === 'manual_request') : swaps;

  return (
    <div className="max-w-7xl mx-auto p-6 pb-24 animate-fadeIn">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-sncb-blue italic tracking-tighter">Bourse aux Services</h2>
          <div className="flex items-center space-x-2 mt-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Live : Dépôt {user.depot}</p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-inner border">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'all' ? 'bg-sncb-blue text-white shadow-md' : 'text-gray-400'}`}
          >
            Tous les services
          </button>
          <button 
            onClick={() => setFilter('urgent')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'urgent' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
          >
            🔥 Demandes Urgentes
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-16 h-16 border-4 border-sncb-blue border-t-sncb-yellow rounded-full animate-spin"></div>
          <p className="font-black text-sncb-blue uppercase text-xs tracking-widest animate-pulse">Consultation du pool SNCB...</p>
        </div>
      ) : displayedSwaps.length === 0 ? (
        <div className="bg-white rounded-[50px] p-24 text-center border-4 border-dashed border-gray-100 shadow-sm">
          <div className="text-6xl mb-6 opacity-20">🚉</div>
          <h3 className="text-2xl font-black text-gray-300 uppercase italic">Voie Libre</h3>
          <p className="text-gray-400 mt-2 font-medium">Aucun échange disponible pour le moment dans votre secteur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayedSwaps.map(swap => (
            <div key={swap.id} className={`bg-white rounded-[40px] border-4 ${swap.type === 'manual_request' ? 'border-red-100 shadow-red-50' : 'border-gray-50'} overflow-hidden shadow-2xl hover:shadow-sncb-blue/10 transition-all duration-500 hover:-translate-y-2 group flex flex-col`}>
              <div className={`${swap.type === 'manual_request' ? 'bg-red-600' : 'bg-sncb-blue'} p-8 text-white relative`}>
                <div className="absolute top-4 right-4 bg-sncb-yellow text-sncb-blue text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                  {swap.matchScore}% MATCH
                </div>
                <p className="text-[10px] font-black opacity-60 uppercase mb-1 tracking-widest">
                  {swap.type === 'manual_request' ? '📍 Demande Ponctuelle' : '🔄 Suggestion IA'}
                </p>
                <h3 className="text-4xl font-black italic">{swap.offeredDuty.code}</h3>
                <p className="text-xs font-bold mt-1 opacity-80">{swap.offeredDuty.date}</p>
              </div>

              <div className="p-8 flex-grow space-y-8">
                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-3xl border border-gray-100">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Départ</p>
                    <p className="text-xl font-black text-sncb-blue">{swap.offeredDuty.startTime}</p>
                  </div>
                  <div className="flex-grow flex items-center justify-center px-4">
                    <div className="h-px bg-gray-200 w-full relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">🚆</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Arrivée</p>
                    <p className="text-xl font-black text-sncb-blue">{swap.offeredDuty.endTime}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-sncb-blue uppercase tracking-widest flex items-center">
                    <span className="mr-2">🧠</span> Pourquoi ce match ?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {swap.matchReasons.map((reason, i) => (
                      <span key={i} className="text-[10px] font-bold bg-blue-50 text-sncb-blue px-3 py-1.5 rounded-xl border border-blue-100 italic">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sncb-yellow rounded-2xl flex items-center justify-center font-black text-sncb-blue shadow-inner rotate-3">
                      {swap.user.firstName?.[0]}
                    