
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

  const PreferenceItem = ({ pref }: { pref: UserPreference; key?: React.Key }) => (
    <div className="glass-card p-4 md:p-5 border border-gray-100 bg-white hover:border-sncb-blue/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between group relative overflow-hidden gap-4">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      <div className="flex items-center gap-3 md:gap-4 relative z-10">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border transition-colors ${
          pref.level === PreferenceLevel.LIKE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          pref.level === PreferenceLevel.DISLIKE ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-slate-400 border-gray-200'
        }`}>
          {pref.category === 'content' ? <Train size={18} /> : <Clock size={18} />}
        </div>
        <div>
          <h4 className="font-black text-gray-800 text-xs md:text-sm tracking-tight">{pref.label}</h4>
          <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{pref.value}</p>
        </div>
      </div>

      <div className="flex items-center justify-between w-full md:w-auto gap-4 relative z-10">
        <div className="flex items-center md:flex-col opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
           <button onClick={() => movePriority(pref.id, 1)} className="p-1 text-slate-400 hover:text-sncb-blue"><ChevronUp size={14} /></button>
           <button onClick={() => movePriority(pref.id, -1)} className="p-1 text-slate-400 hover:text-sncb-blue"><ChevronDown size={14} /></button>
        </div>
        
        <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.LIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.LIKE ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <ThumbsUp size={12} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.NEUTRAL)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-slate-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Minus size={12} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.DISLIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-red-500'}`}
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 pb-32 animate-slide-up max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-sncb-blue uppercase leading-tight">Mes Goûts <br className="hidden md:block"/> Service</h2>
          <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em]">IA de matching personnalisée</p>
        </div>
        
        <div className="flex p-1 bg-gray-100 rounded-xl md:rounded-2xl border border-gray-200 w-full lg:w-auto">
          <button 
            onClick={() => setActiveCategory('content')} 
            className={`flex-1 lg:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'content' ? 'bg-sncb-blue text-white shadow-md' : 'text-slate-500'}`}
          >
            Types
          </button>
          <button 
            onClick={() => setActiveCategory('planning')} 
            className={`flex-1 lg:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'planning' ? 'bg-sncb-blue text-white shadow-md' : 'text-slate-500'}`}
          >
            Horaires
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* TOP PRIORITIES */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
               <h3 className="font-black text-sncb-blue text-[9px] md:text-[11px] uppercase tracking-widest italic">Favoris</h3>
            </div>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{likes.length}</span>
          </div>
          
          <div className="space-y-3 md:space-y-4 min-h-[150px]">
            {likes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {likes.length === 0 && (
              <div className="h-24 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-slate-300 text-[9px] font-black uppercase italic">
                Vide
              </div>
            )}
          </div>
        </div>

        {/* TO AVOID */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
               <h3 className="font-black text-sncb-blue text-[9px] md:text-[11px] uppercase tracking-widest italic">À Éviter</h3>
            </div>
            <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{dislikes.length}</span>
          </div>

          <div className="space-y-3 md:space-y-4 min-h-[150px]">
            {dislikes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {dislikes.length === 0 && (
              <div className="h-24 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-slate-300 text-[9px] font-black uppercase italic">
                Vide
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 md:bottom-10 left-0 right-0 md:left-1/2 md:-translate-x-1/2 lg:left-[calc(50%+144px)] lg:right-auto z-40 px-4 py-4 md:px-6 md:py-0 w-full max-w-4xl bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-gray-100 md:border-none">
        <div className="glass-card p-4 md:p-6 bg-white border-gray-200 shadow-2xl flex flex-row items-center justify-between gap-4 md:gap-6">
           <div className="flex items-center gap-3 md:gap-5">
             <div className="w-10 h-10 md:w-14 md:h-14 bg-sncb-blue text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-sncb-blue/20">
               <Sparkles size={20} className="md:size-28" />
             </div>
             <div className="hidden sm:block">
               <p className="text-xs md:text-sm font-black text-sncb-blue uppercase tracking-tight">IA Synchronisée</p>
               <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-1">Matching optimisé</p>
             </div>
           </div>
           
           <button 
             onClick={onNext}
             className="flex-grow md:flex-none px-6 md:px-10 py-3.5 md:py-5 bg-sncb-blue text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
           >
             Analyser les offres
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
