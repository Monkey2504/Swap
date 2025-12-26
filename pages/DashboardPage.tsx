import React, { useMemo } from 'react';
import { Duty, AppNotification } from '../types';
import { Train, Bell, Calendar, ArrowRight, ShieldCheck, CheckCircle2, Repeat } from 'lucide-react';

interface DashboardPageProps {
  duties: Duty[];
  onNavigate: (page: 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary' | 'studio') => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties, onNavigate }) => {
  // Sécurisation forcée : si duties n'est pas un tableau, on utilise un tableau vide
  const safeDuties = Array.isArray(duties) ? duties : [];

  const notifications: AppNotification[] = [
    { id: '1', title: 'Bourse Active', message: 'Des collègues cherchent à échanger des services ce weekend.', type: 'swap_request', read: false, createdAt: '10:45' },
    { id: '2', title: 'Sécurité RGPS', message: 'Votre planning respecte les temps de repos réglementaires.', type: 'success', read: true, createdAt: 'Hier' }
  ];

  const sortedDuties = useMemo(() => {
    return [...safeDuties].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`).getTime();
      const dateB = new Date(`${b.date}T${b.start_time}`).getTime();
      return dateA - dateB;
    });
  }, [safeDuties]);

  const nextDuty = sortedDuties.find(d => {
    try {
      return new Date(`${d.date}T${d.start_time}`) >= new Date();
    } catch (e) {
      return false;
    }
  });

  /**
   * UTILITAIRE ANTI-CRASH : 
   * Garantit qu'on ne rend jamais un objet dans le JSX.
   */
  const renderText = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    return "[Donnée non textuelle]";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-sncb-blue uppercase tracking-tight italic">
            Tableau <span className="text-slate-400">Agent</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Connecté au Cloud SNCB</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-grow md:flex-none flex items-center gap-4 bg-white px-6 py-3.5 rounded-2xl border border-slate-100 shadow-sm">
            <Calendar size={20} className="text-sncb-blue" />
            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">
              {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card overflow-hidden bg-white shadow-2xl rounded-[32px] border-slate-100 group">
            <div className="bg-sncb-blue p-3 px-8 flex justify-between items-center text-white">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Prochain Départ</span>
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase">Opérationnel</span>
               </div>
            </div>
            
            <div className="p-8 md:p-12">
              {nextDuty ? (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col items-center justify-center shadow-inner group-hover:bg-blue-50 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Tour</span>
                        <span className="text-4xl font-black text-sncb-blue italic leading-none">{renderText(nextDuty.code)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sncb-blue">
                          <Train size={24} />
                          <span className="text-2xl font-black uppercase italic tracking-tighter">{renderText(nextDuty.type)}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-36 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
                        <p className="text-[10px] font-black text-sncb-blue/40 uppercase mb-2">PS</p>
                        <p className="text-3xl font-black text-sncb-blue tabular-nums leading-none">{renderText(nextDuty.start_time)}</p>
                      </div>
                      <div className="flex-1 md:w-36 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">FS</p>
                        <p className="text-3xl font-black text-sncb-blue tabular-nums leading-none">{renderText(nextDuty.end_time)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-8 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                      <ShieldCheck size={16} /> RGPS Validé
                    </div>
                    {Array.isArray(nextDuty.destinations) && nextDuty.destinations.map((dest, idx) => (
                      <React.Fragment key={idx}>
                        <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 border border-slate-200">
                          {renderText(dest)}
                        </div>
                        {idx < nextDuty.destinations.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 italic">Aucune prestation</h4>
                  <button onClick={() => onNavigate('profile')} className="px-8 py-4 bg-sncb-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Importer Roster</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;