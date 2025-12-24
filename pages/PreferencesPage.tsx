
import React, { useState, useMemo } from 'react';
import { UserPreference, PreferenceLevel } from '../types';
import { Train, Clock, ThumbsUp, ThumbsDown, Minus, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface PreferencesPageProps {
  preferences: UserPreference[];
  setPreferences: (prefs: UserPreference[]) => void;
  onNext: () => void;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ preferences, setPreferences, onNext }) => {
  const [activeCategory, setActiveCategory] = useState<'content' | 'planning'| 'location'>('content');

  const likes = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.LIKE && p.category === activeCategory)
      .sort((a, b) => b.priority - a.priority), 
    [preferences, activeCategory]
  );

  const dislikes = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.DISLIKE && p.category === activeCategory)
      .sort((a, b) => a.priority - b.priority),
    [preferences, activeCategory]
  );

  const movePriority = (id: string, delta: number) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, priority: Math.max(0, p.priority + delta) } : p));
  };

  const setLevel = (id: string, level: PreferenceLevel) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, level, priority: 1 } : p));
  };

  const PreferenceItem = ({ pref }: { pref: UserPreference }) => (
    <div className="glass-card p-5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
          pref.level === PreferenceLevel.LIKE ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-slate-400 border-white/10'
        }`}>
          {pref.category === 'content' ? <Train size={20} /> : <Clock size={20} />}
        </div>
        <div>
          <h4 className="font-black text-white text-sm tracking-tight">{pref.label}</h4>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{pref.value}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
           <button onClick={() => movePriority(pref.id, 1)} className="text-slate-500 hover:text-white"><ChevronUp size={14} /></button>
           <button onClick={() => movePriority(pref.id, -1)} className="text-slate-500 hover:text-white"><ChevronDown size={14} /></button>
        </div>
        
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.LIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.LIKE ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-emerald-500'}`}
          >
            <ThumbsUp size={14} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.NEUTRAL)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-slate-400 text-white' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.DISLIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Intelligence<br/>des Goûts</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Profilage du matching algorithmique</p>
        </div>
        
        <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 w-full lg:w-auto">
          <button 
            onClick={() => setActiveCategory('content')} 
            className={`flex-grow lg:flex-none px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'content' ? 'bg-accent-purple text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Types Service
          </button>
          <button 
            onClick={() => setActiveCategory('planning')} 
            className={`flex-grow lg:flex-none px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'planning' ? 'bg-accent-purple text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Horaires
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* TOP PRIORITIES */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
               <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] italic">Priorités (Voulues)</h3>
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">{likes.length}</span>
          </div>
          
          <div className="space-y-4 min-h-[300px]">
            {likes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {likes.length === 0 && (
              <div className="h-40 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-600 text-sm italic font-bold uppercase tracking-widest text-[10px]">
                Aucun critère positif
              </div>
            )}
          </div>
        </div>

        {/* TO AVOID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"></div>
               <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] italic">À Éviter (Refusées)</h3>
            </div>
            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">{dislikes.length}</span>
          </div>

          <div className="space-y-4 min-h-[300px]">
            {dislikes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {dislikes.length === 0 && (
              <div className="h-40 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-600 text-sm italic font-bold uppercase tracking-widest text-[10px]">
                Aucun critère négatif
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 lg:left-[calc(50%+144px)] lg:right-auto z-40 px-6 w-full max-w-4xl">
        <div className="glass-card p-6 bg-slate-900/80 backdrop-blur-2xl border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent-purple/20 animate-pulse">
               <Sparkles size={28} />
             </div>
             <div>
               <p className="text-sm font-black text-white uppercase tracking-tight">IA de Matching Synchronisée</p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vos critères influencent le classement</p>
             </div>
           </div>
           
           <button 
             onClick={onNext}
             className="w-full md:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
           >
             Analyser les offres
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
