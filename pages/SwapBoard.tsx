
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer } from '../types';
import { matchSwaps } from '../services/geminiService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GoogleGenAI, Modality } from "@google/genai";

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [newOfferAlert, setNewOfferAlert] = useState<{code: string, user: string} | null>(null);

  const fetchAndMatch = useCallback(async () => {
    setLoading(true);
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

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

      const matched = await matchSwaps(preferences, remoteOffers);
      setSwaps(matched);
    } catch (err) {
      console.error("Erreur sync DB:", err);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.depot, preferences]);

  useEffect(() => {
    fetchAndMatch();
    
    if (isSupabaseConfigured && supabase) {
      // Écoute en temps réel des nouveaux swaps
      const channel = supabase
        .channel('public:swap_offers')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'swap_offers',
          filter: `depot=eq.${user.depot}`
        }, (payload) => {
          if (payload.new.user_id !== user.id) {
            setNewOfferAlert({
              code: payload.new.duty_data.code,
              user: payload.new.user_name
            });
            setTimeout(() => setNewOfferAlert(null), 8000);
            fetchAndMatch();
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchAndMatch, user.depot, user.id]);

  const speakService = async (swap: SwapOffer) => {
    if (isSpeaking) return;
    setIsSpeaking(swap.id);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Génère une annonce vocale professionnelle et concise pour ce service ferroviaire :
      Service code ${swap.offeredDuty.code}, départ à ${swap.offeredDuty.startTime}, arrivée à ${swap.offeredDuty.endTime}. 
      Trajet desservant : ${swap.offeredDuty.destinations.join(', ')}.
      Termine par : "Match de ${swap.matchScore} pourcent avec votre profil."`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) view[i] = audioData.charCodeAt(i);

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(null);
        source.start();
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(null);
    }
  };

  const handleContact = (swap: SwapOffer) => {
    const subject = encodeURIComponent(`SWAP ACT : Service ${swap.offeredDuty.code}`);
    window.location.href = `mailto:${swap.user.sncbId}@sncb.be?subject=${subject}`;
  };

  const displayedSwaps = filter === 'urgent' ? swaps.filter(s => s.type === 'manual_request') : swaps;

  return (
    <div className="max-w-7xl mx-auto p-4 pb-32 animate-fadeIn space-y-12">
      {/* Toast de nouvelle offre */}
      {newOfferAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm animate-bounce-slow">
          <div className="bg-sncb-yellow border-2 border-slate-900 rounded-2xl p-4 shadow-2xl flex items-center space-x-4">
            <div className="text-2xl">🔔</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Nouveau Service Disponible</p>
              <p className="text-xs font-bold text-slate-700">L'agent <span className="font-black">{newOfferAlert.user}</span> propose le <span className="font-black">{newOfferAlert.code}</span></p>
            </div>
            <button onClick={() => setNewOfferAlert(null)} className="text-slate-500 hover:text-slate-900">✕</button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Bourse aux échanges</h2>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center shadow-sm border ${
              dbStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${dbStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              {dbStatus === 'online' ? '📡 LIVE SUPABASE' : 'Mode Local'}
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Secteur : {user.depot} • IA Matching Actif</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setFilter('all')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'all' ? 'bg-white text-sncb-blue shadow-lg' : 'text-slate-400'}`}>Toutes les offres</button>
          <button onClick={() => setFilter('urgent')} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${filter === 'urgent' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>🔥 Urgences</button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
          <div className="w-20 h-20 border-4 border-sncb-blue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em]">Analyse du Cloud IA...</p>
        </div>
      ) : displayedSwaps.length === 0 ? (
        <div className="bg-white rounded-[50px] p-24 text-center border-4 border-dashed border-slate-100">
          <div className="text-6xl mb-6 grayscale">☁️</div>
          <h3 className="text-2xl font-black text-slate-300 uppercase italic">Aucun échange en attente</h3>
          <p className="text-slate-400 text-xs font-bold mt-2">Soyez le premier à proposer un service !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedSwaps.map(swap => (
            <div key={swap.id} className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className={`${swap.type === 'manual_request' ? 'bg-red-600' : 'bg-slate-900'} p-8 text-white relative`}>
                <div className="absolute top-6 right-6 bg-sncb-yellow text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl transform rotate-3">
                  {swap.matchScore}% MATCH
                </div>
                <h3 className="text-5xl font-black italic tracking-tighter">{swap.offeredDuty.code}</h3>
                <div className="flex space-x-2 mt-4">
                  <button 
                    onClick={() => speakService(swap)}
                    className={`p-2 rounded-xl transition-all ${isSpeaking === swap.id ? 'bg-sncb-yellow text-slate-900 scale-110' : 'bg-white/10 hover:bg-white/20'}`}
                    title="Écouter le résumé vocal"
                  >
                    {isSpeaking === swap.id ? '🔊' : '🔈'}
                  </button>
                </div>
              </div>

              <div className="p-8 flex-grow space-y-6 flex flex-col">
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[24px]">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Départ</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.startTime}</p>
                  </div>
                  <div className="flex-grow flex flex-col items-center px-4">
                    <div className="w-full h-px bg-slate-200 relative">
                       <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-lg">🚆</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Arrivée</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{swap.offeredDuty.endTime}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-sncb-blue uppercase tracking-widest">Matching Intelligence</p>
                  <div className="flex flex-wrap gap-2">
                    {swap.matchReasons.map((reason, i) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-600 px-3 py-2 rounded-xl border border-slate-100 italic">{reason}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-10 h-10 bg-sncb-blue text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">{swap.user.firstName?.[0]}</div>
                    <div className="truncate">
                      <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-none">{swap.user.firstName} {swap.user.lastName}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Matricule: {swap.user.sncbId}</p>
                    </div>
                  </div>
                  <button onClick={() => handleContact(swap)} className="bg-sncb-blue text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-sncb-yellow hover:text-slate-900 transition-all flex items-center space-x-2">
                    <span>Email</span>
                    <span className="text-lg">✉️</span>
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
