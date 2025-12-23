
import React, { useState } from 'react';
import { STATION_CODES } from '../lib/stationCodes';
import { Search, Info, MapPin, Hash } from 'lucide-react';

const StationDictionary: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = STATION_CODES.filter(s => 
    s.code.toLowerCase().includes(query.toLowerCase()) || 
    s.fr.toLowerCase().includes(query.toLowerCase()) || 
    s.nl.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 italic">Dictionnaire Télégraphique</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Référentiel des Installations Ferroviaires</p>
        </div>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Rechercher un code (ex: FBMZ) ou une gare..." 
          className="w-full bg-white border-none rounded-[32px] pl-16 pr-8 py-6 text-lg font-bold shadow-2xl focus:ring-4 focus:ring-sncb-blue/5 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-sncb-blue" size={24} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.slice(0, 50).map((s) => (
            <div key={s.code} className="bg-white p-6 rounded-[32px] shadow-xl border border-white hover:border-sncb-blue/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex flex-col items-center justify-center border border-slate-100 group-hover:bg-sncb-blue/5 transition-colors">
                  <span className="text-xl font-black text-sncb-blue leading-none">{s.code}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">CODE</span>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 leading-tight">{s.fr}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{s.nl}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] shadow-2xl border border-dashed border-slate-200">
             <Info size={40} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold italic">Aucune correspondance trouvée pour "{query}"</p>
          </div>
        )}
      </div>

      {filtered.length > 50 && (
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Affichage des 50 premiers résultats sur {filtered.length}
        </p>
      )}

      <div className="p-8 bg-sncb-blue/5 rounded-[40px] border border-sncb-blue/10 flex items-start gap-4">
         <Info className="text-sncb-blue shrink-0 mt-1" size={20} />
         <div className="space-y-2">
            <h5 className="font-black text-sncb-blue text-sm italic">Pourquoi ce dictionnaire ?</h5>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Chaque gare SNCB possède un code télégraphique unique utilisé dans les plannings (Rosters). 
              Swap Premium utilise cette base de données pour "traduire" automatiquement vos horaires PDF et photos en informations claires.
            </p>
         </div>
      </div>
    </div>
  );
};

export default StationDictionary;
