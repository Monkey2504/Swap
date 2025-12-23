
import React, { useState, useMemo } from 'react';
import { UserPreference, PreferenceLevel } from '../types';

interface PreferencesPageProps {
  preferences: UserPreference[];
  setPreferences: (prefs: UserPreference[]) => void;
  onNext: () => void;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ preferences, setPreferences, onNext }) => {
  const [activeCategory, setActiveCategory] = useState<'content' | 'planning'>('content');

  // Séparation pour l'UX bi-colonne demandée
  const likes = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.LIKE && p.category === activeCategory)
      .sort((a, b) => b.priority - a.priority), 
    [preferences, activeCategory]
  );

  const neutrals = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.NEUTRAL && p.category === activeCategory),
    [preferences, activeCategory]
  );

  const dislikes = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.DISLIKE && p.category === activeCategory)
      .sort((a, b) => a.priority - b.priority),
    [preferences, activeCategory]
  );

  const moveUp = (id: string) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, priority: p.priority + 1 } : p));
  };

  const moveDown = (id: string) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, priority: Math.max(0, p.priority - 1) } : p));
  };

  const setLevel = (id: string, level: PreferenceLevel) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, level, priority: 1 } : p));
  };

  const RenderPreference = ({ pref, isTop }: { pref: UserPreference, isTop: boolean }) => (
    <div className={`p-5 mb-4 rounded-3xl border flex items-center justify-between transition-all bg-white group ${isTop ? 'border-green-100 hover:border-green-500' : 'border-red-100 hover:border-red-500'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isTop ? 'bg-green-50' : 'bg-red-50'}`}>
          {pref.category === 'content' ? '🚆' : '⏰'}
        </div>
        <div>
          <p className="font-black text-slate-900 text-sm">{pref.label}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pref.value}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <button onClick={() => moveUp(pref.id)} className="text-[10px] opacity-20 hover:opacity-100">▲</button>
          <button onClick={() => moveDown(pref.id)} className="text-[10px] opacity-20 hover:opacity-100">▼</button>
        </div>
        <div className="h-8 w-px bg-slate-100 mx-2"></div>
        <div className="flex gap-1">
          <button onClick={() => setLevel(pref.id, PreferenceLevel.LIKE)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${pref.level === PreferenceLevel.LIKE ? 'bg-green-500 text-white' : 'bg-slate-50'}`}>👍</button>
          <button onClick={() => setLevel(pref.id, PreferenceLevel.NEUTRAL)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-slate-300 text-white' : 'bg-slate-50'}`}>😐</button>
          <button onClick={() => setLevel(pref.id, PreferenceLevel.DISLIKE)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500 text-white' : 'bg-slate-50'}`}>👎</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-10 animate-fadeIn pb-40">
      <div className="space-y-1">
        <p className="text-sncb-blue font-black text-[10px] uppercase tracking-[0.5em]">Configuration IA</p>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Hiérarchie</h2>
      </div>

      <div className="flex p-2 bg-slate-100 rounded-3xl max-w-sm">
        <button onClick={() => setActiveCategory('content')} className={`flex-grow py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${activeCategory === 'content' ? 'bg-white shadow-lg text-sncb-blue' : 'text-slate-400'}`}>Services</button>
        <button onClick={() => setActiveCategory('planning')} className={`flex-grow py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${activeCategory === 'planning' ? 'bg-white shadow-lg text-sncb-blue' : 'text-slate-400'}`}>Planning</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LIKE COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs">✓</div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest italic">Priorités (Voulues)</h3>
          </div>
          <div className="bg-green-50/30 p-6 rounded-[40px] border border-green-100 min-h-[400px]">
            {likes.map(p => <RenderPreference key={p.id} pref={p} isTop={true} />)}
            {likes.length === 0 && <p className="text-center text-xs font-bold text-slate-400 py-20 italic">Aucune préférence positive.</p>}
          </div>
        </div>

        {/* DISLIKE COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs">✕</div>
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest italic">À Éviter (Refusées)</h3>
          </div>
          <div className="bg-red-50/30 p-6 rounded-[40px] border border-red-100 min-h-[400px]">
            {dislikes.map(p => <RenderPreference key={p.id} pref={p} isTop={false} />)}
            {dislikes.length === 0 && <p className="text-center text-xs font-bold text-slate-400 py-20 italic">Tout vous convient ?</p>}
          </div>
        </div>
      </div>

      {/* NEUTRALS / OTHERS */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 sncb-shadow">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Non classés</h4>
         <div className="flex flex-wrap gap-4">
           {neutrals.map(p => (
             <button key={p.id} onClick={() => setLevel(p.id, PreferenceLevel.LIKE)} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold transition-all">
               {p.label} <span className="ml-2 opacity-30">➔</span>
             </button>
           ))}
         </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
        <div className="bg-slate-900 p-6 rounded-[40px] sncb-shadow flex justify-between items-center text-white">
          <div className="pl-4">
            <p className="text-[10px] font-black text-sncb-yellow uppercase tracking-widest">Algorithme Sw'happy</p>
            <p className="text-xs font-bold text-slate-300">Matching bi-directionnel actif.</p>
          </div>
          <button onClick={onNext} className="bg-sncb-yellow text-slate-900 px-10 py-5 rounded-[25px] font-black uppercase italic text-sm hover:scale-105 transition-all">
            Lancer Recherche ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
