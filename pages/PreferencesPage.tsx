
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
          <span className="mr-2">🎯</span> Mes Préférences de Service
        </h2>

        <div className="flex space-x-2 mb-8 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-grow py-3 rounded-lg font-bold transition ${activeTab === 'content' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Contenu de Service
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex-grow py-3 rounded-lg font-bold transition ${activeTab === 'planning' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Planning
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {filteredPrefs.sort((a,b) => b.priority - a.priority).map((pref) => (
            <div key={pref.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition">
              <div className="mb-4 md:mb-0">
                <p className="font-bold text-gray-800 text-lg">{pref.label}</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest">{pref.value}</p>
              </div>

              <div className="flex items-center space-x-6 w-full md:w-auto">
                 <div className="flex bg-gray-50 p-1 rounded-lg border">
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.LIKE)}
                      className={`p-2 px-4 rounded-md text-sm font-bold ${pref.level === PreferenceLevel.LIKE ? 'bg-green-100 text-green-700 border border-green-200' : 'text-gray-400'}`}
                    >
                      J'aime
                    </button>
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.NEUTRAL)}
                      className={`p-2 px-4 rounded-md text-sm font-bold ${pref.level === PreferenceLevel.NEUTRAL ? 'bg-gray-200 text-gray-700' : 'text-gray-400'}`}
                    >
                      Sans avis
                    </button>
                    <button
                      onClick={() => updatePreference(pref.id, PreferenceLevel.DISLIKE)}
                      className={`p-2 px-4 rounded-md text-sm font-bold ${pref.level === PreferenceLevel.DISLIKE ? 'bg-red-100 text-red-700 border border-red-200' : 'text-gray-400'}`}
                    >
                      J'aime pas
                    </button>
                 </div>

                 <div className="hidden md:flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Priorité</span>
                    <select
                      value={pref.priority}
                      onChange={(e) => updatePriority(pref.id, parseInt(e.target.value))}
                      className="text-sm font-bold border rounded p-1 bg-white"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
           <p className="text-sm text-gray-400 italic">L'IA utilisera ces données pour vos suggestions de SWAP.</p>
           <button
            onClick={onNext}
            className="bg-yellow-400 text-blue-900 font-bold py-3 px-8 rounded-xl hover:bg-yellow-300 shadow-md transition"
          >
            Voir les SWAP disponibles
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
