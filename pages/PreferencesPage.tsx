
import React, { useState } from 'react';
import { UserPreference, PreferenceLevel } from '../types';

interface PreferencesPageProps {
  preferences: UserPreference[];
  setPreferences: React.Dispatch<React.SetStateAction<UserPreference[]>>;
  onNext: () => void;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ preferences, setPreferences, onNext }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'planning'>('content');

  const updatePreference = (id: string, level: PreferenceLevel) => {
    setPreferences(prev => prev.map(p => p.id === id ? { ...p, level } : p));
  };

  const updatePriority = (id: string, priority: number) => {
    setPreferences(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
  };

  const filteredPrefs = preferences.filter(p => p.category === activeTab);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn p-4 pb-32">
      <div className="space-y-2">
        <p className="text-sncb-blue font-black text-xs uppercase tracking-[0.3em]">Étape 02/03</p>
        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">Mes Préférences</h2>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* TABS NATIVE-LIKE */}
        <div className="flex p-2 bg-slate-50 m-6 rounded-3xl border border-slate-100">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-grow py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'content' ? 'bg-white text-sncb-blue shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Type de Service
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex-grow py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'planning' ? 'bg-white text-sncb-blue shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Planning & Temps
          </button>
        </div>

        <div className="p-8 pt-0 space-y-4">
          {filteredPrefs.sort((a,b) => b.priority - a.priority).map((pref) => (
            <div key={pref.id} className="group p-6 bg-white border border-slate-100 rounded-[32px] hover:border-sncb-blue hover:shadow-xl hover:shadow-sncb-blue/5 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-6 w-full md:w-auto">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                  {pref.category === 'content' ? '🚆' : '⏰'}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xl tracking-tight">{pref.label}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{pref.value}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-center">
                 <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.LIKE)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pref.level === PreferenceLevel.LIKE ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      J'aime
                    </button>
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.NEUTRAL)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-slate-300 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Bof
                    </button>
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.DISLIKE)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Pas top
                    </button>
                 </div>

                 <div className="h-12 w-px bg-slate-100 hidden md:block mx-2"></div>

                 <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase mb-1">Priorité</span>
                    <select
                      value={pref.priority}
                      onChange={(e) => updatePriority(pref.id, parseInt(e.target.value))}
                      className="text-xs font-black border-2 border-slate-100 rounded-xl p-2 bg-white outline-none focus:border-sncb-blue transition-all"
                    >
                      <option value={1}>★</option>
                      <option value={2}>★★</option>
                      <option value={3}>★★★</option>
                    </select>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
        <div className="bg-slate-900 p-6 rounded-[40px] shadow-2xl flex justify-between items-center text-white">
           <div className="hidden sm:block pl-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA Matching</p>
             <p className="text-xs font-bold text-slate-300">Vos critères affinent les résultats.</p>
           </div>
           <button
            onClick={onNext}
            className="bg-sncb-yellow text-slate-900 font-black px-10 py-5 rounded-[24px] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest italic text-sm shadow-xl shadow-sncb-yellow/10"
          >
            Lancer le Match ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
