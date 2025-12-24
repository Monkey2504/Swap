
import React, { useState, useMemo } from 'react';
import { STATION_CODES } from '../lib/stationCodes';
import { Search, Info, Loader2 } from 'lucide-react';

const StationDictionary: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return STATION_CODES.slice(0, 50);
    return STATION_CODES.filter(s => 
      s.code.toLowerCase().includes(q) || 
      s.fr.toLowerCase().includes(q) || 
      s.nl.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [query]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-sncb-blue italic uppercase">Référentiel Gares</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Base de données télégraphique SNCB</p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-sncb-blue/5 blur-2xl group-focus-within:bg-sncb-blue/10 transition-colors"></div>
        <input 
          type="text" 
          placeholder="Rechercher un code (ex: FBMZ) ou une gare..." 
          className="relative w-full bg-white border border-gray-200 rounded-[32px] pl-16 pr-8 py-8 text-xl font-bold shadow-xl focus:outline-none focus:ring-4 focus:ring-sncb-blue/10 focus:border-sncb-blue transition-all text-gray-800 placeholder:text-slate-300"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sncb-blue transition-colors" size={28} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((s) => (
            <div key={s.code} className="glass-card p-6 border border-gray-100 bg-white hover:border-sncb-blue/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                  <span className="text-xl font-black text-sncb-blue leading-none">{s.code}</span>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1.5">CODE</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-gray-800 leading-tight uppercase tracking-tight group-hover:text-sncb-blue transition-colors">{s.fr}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{s.nl}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center glass-card bg-white border border-dashed border-gray-200 rounded-3xl">
             <p className="text-slate-300 font-bold italic">Aucune gare trouvée pour "{query}"</p>
          </div>
        )}
      </div>

      <div className="p-8 glass-card bg-blue-50 border-blue-100 flex items-start gap-5">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sncb-blue shrink-0 shadow-sm">
            <Info size={20} />
         </div>
         <div className="space-y-2">
            <h5 className="font-black text-sncb-blue text-[10px] uppercase tracking-[0.2em] italic">Note de Service</h5>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ces codes sont extraits de la liste officielle des installations. Ils sont indispensables au matching IA pour traduire vos captures d'écran en itinéraires valides.
            </p>
         </div>
      </div>
    </div>
  );
};

export default StationDictionary;
