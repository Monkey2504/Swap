
import React, { useState, useMemo } from 'react';
import { UserPreference, PreferenceLevel } from '../types';
// Add Sparkles to resolve "Cannot find name" error.
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

  const neutrals = useMemo(() => 
    preferences.filter(p => p.level === PreferenceLevel.NEUTRAL && p.category === activeCategory),
    [preferences, activeCategory]
  );

  const movePriority = (id: string, delta: number) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, priority: Math.max(0, p.priority + delta) } : p));
  };

  const setLevel = (id: string, level: PreferenceLevel) => {
    setPreferences(preferences.map(p => p.id === id ? { ...p, level, priority: 1 } : p));
  };

  const PreferenceItem = ({ pref }: { pref: UserPreference }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 apple-shadow-hover transition-all flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          pref.level === PreferenceLevel.LIKE ? 'bg-emerald-50 text-emerald-600' : 
          pref.level === PreferenceLevel.DISLIKE ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
        }`}>
          {pref.category === 'content' ? <Train size={20} /> : <Clock size={20} />}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{pref.label}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pref.value}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
           <button onClick={() => movePriority(pref.id, 1)} className="text-slate-300 hover:text-slate-600"><ChevronUp size={14} /></button>
           <button onClick={() => movePriority(pref.id, -1)} className="text-slate-300 hover:text-slate-600"><ChevronDown size={14} /></button>
        </div>
        
        <div className="flex items-center bg-slate-50 p-1 rounded-xl">
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.LIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.LIKE ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <ThumbsUp size={16} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.NEUTRAL)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-slate-400 text-white shadow-lg' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={() => setLevel(pref.id, PreferenceLevel.DISLIKE)} 
            className={`p-2 rounded-lg transition-all ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-red-500'}`}
          >
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-slide-up pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 heading-hero">Hiérarchie des Goûts</h2>
          <p className="text-slate-500 mt-2 font-medium">L'IA utilise ces priorités pour classer vos offres de swap.</p>
        </div>
        
        <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setActiveCategory('content')} 
            className={`flex-grow md:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeCategory === 'content' ? 'bg-white text-sncb-blue apple-shadow' : 'text-slate-400'}`}
          >
            Services
          </button>
          <button 
            onClick={() => setActiveCategory('planning')} 
            className={`flex-grow md:flex-none px-8 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeCategory === 'planning' ? 'bg-white text-sncb-blue apple-shadow' : 'text-slate-400'}`}
          >
            Planning
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* TOP PRIORITIES */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
               <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest italic">Priorités (Voulues)</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{likes.length}</span>
          </div>
          
          <div className="space-y-4 min-h-[300px]">
            {likes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {likes.length === 0 && (
              <div className="h-40 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 text-sm italic">
                Aucune préférence positive définie.
              </div>
            )}
          </div>
        </div>

        {/* TO AVOID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-red-500 rounded-full"></div>
               <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest italic">À Éviter (Refusées)</h3>
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{dislikes.length}</span>
          </div>

          <div className="space-y-4 min-h-[300px]">
            {dislikes.map(p => <PreferenceItem key={p.id} pref={p} />)}
            {dislikes.length === 0 && (
              <div className="h-40 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 text-sm italic">
                Tout vous semble acceptable.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-10 left-0 right-0 md:left-72 z-40 px-6">
        <div className="max-w-4xl mx-auto glass p-6 rounded-[32px] apple-shadow border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-sncb-blue text-white rounded-2xl flex items-center justify-center animate-pulse">
               <Sparkles size={24} />
             </div>
             <div>
               <p className="text-sm font-bold text-slate-900">Matching Intelligent Actif</p>
               <p className="text-xs text-slate-400">Vos {preferences.filter(p => p.level !== 'NEUTRAL').length} critères sont synchronisés.</p>
             </div>
           </div>
           
           <button 
             onClick={onNext}
             className="w-full md:w-auto px-12 py-4 bg-sncb-blue text-white rounded-2xl font-bold shadow-xl shadow-sncb-blue/20 hover:bg-[#002a7a] transition-all"
           >
             Lancer la Recherche
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
