import React, { useMemo } from 'react';
import { Duty, AppNotification } from '../types';
import { Train, Bell, Calendar, ChevronRight, ArrowRight, ShieldCheck, CheckCircle2, Repeat } from 'lucide-react';

interface DashboardPageProps {
  duties: Duty[];
  onNavigate: (page: 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary' | 'studio') => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties, onNavigate }) => {
  const notifications: AppNotification[] = [
    { id: '1', title: 'Bourse Active', message: 'Des collègues cherchent à échanger des services ce weekend.', type: 'swap_request', read: false, createdAt: '10:45' },
    { id: '2', title: 'Sécurité RGPS', message: 'Votre planning respecte les temps de repos réglementaires.', type: 'success', read: true, createdAt: 'Hier' }
  ];

  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`).getTime();
      const dateB = new Date(`${b.date}T${b.start_time}`).getTime();
      return dateA - dateB;
    });
  }, [duties]);

  const nextDuty = sortedDuties.find(d => {
    try {
      return new Date(`${d.date}T${d.start_time}`) >= new Date();
    } catch (e) {
      return false;
    }
  });

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
          <div className="relative p-4 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <Bell size={22} className="text-sncb-blue" />
            <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
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
          {/* PROCHAINE PRESTATION */}
          <div className="glass-card overflow-hidden bg-white shadow-2xl rounded-[32px] border-slate-100 group">
            <div className="bg-sncb-blue p-3 px-8 flex justify-between items-center">
               <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Prochain Départ</span>
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-white/80 uppercase">Opérationnel</span>
               </div>
            </div>
            
            <div className="p-8 md:p-12">
              {nextDuty ? (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col items-center justify-center shadow-inner group-hover:bg-blue-50 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Tour</span>
                        <span className="text-3xl md:text-5xl font-black text-sncb-blue italic leading-none">{String(nextDuty.code || '')}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sncb-blue">
                          <Train size={24} />
                          <span className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">{String(nextDuty.type || 'SNCB')}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-36 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
                        <p className="text-[10px] font-black text-sncb-blue/40 uppercase mb-2">Prise (PS)</p>
                        <p className="text-3xl font-black text-sncb-blue tabular-nums leading-none">{String(nextDuty.start_time || '')}</p>
                      </div>
                      <div className="flex-1 md:w-36 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Fin (FS)</p>
                        <p className="text-3xl font-black text-sncb-blue tabular-nums leading-none">{String(nextDuty.end_time || '')}</p>
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
                          {typeof dest === 'string' ? dest : 'Gare'}
                        </div>
                        {idx < nextDuty.destinations.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
                    <Calendar size={40} />
                  </div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Aucune prestation chargée</h4>
                  <button 
                    onClick={() => onNavigate('profile')} 
                    className="px-8 py-4 bg-sncb-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Scanner mon roster
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card bg-white rounded-[32px] overflow-hidden border-slate-100">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-[0.2em] italic">Dernières Activités</h3>
               <button className="text-[9px] font-bold text-slate-400 uppercase hover:text-sncb-blue">Tout marquer comme lu</button>
            </div>
            <div className="divide-y divide-slate-50">
              {notifications.map(n => (
                <div key={n.id} className={`p-6 flex items-start gap-5 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/20' : ''}`}>
                  <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    n.type === 'swap_request' ? 'bg-sncb-blue text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {n.type === 'swap_request' ? <Repeat size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black text-slate-800 mb-1 leading-none">{String(n.title || '')}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{String(n.message || '')}</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase shrink-0">{String(n.createdAt || '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 bg-sncb-blue text-white shadow-2xl rounded-[32px] relative overflow-hidden group">
             <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
               <Repeat size={28} className="text-white" />
             </div>
             <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-3 leading-none">Bourse Active</h4>
             <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest leading-relaxed mb-10">
               20 collègues sont en ligne <br/> dans votre dépôt.
             </p>
             <button 
                onClick={() => onNavigate('swaps')}
                className="w-full py-5 bg-white text-sncb-blue rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-xl active:scale-95"
             >
               Voir les échanges
             </button>
          </div>

          <div className="glass-card p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-5 italic">Statistiques Mensuelles</h3>
             <div className="space-y-8">
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Heures de service</span>
                      <span className="text-sncb-blue">128h / 160h</span>
                   </div>
                   <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sncb-blue shadow-lg" style={{ width: '80%' }}></div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center group hover:bg-blue-50 transition-colors">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Nuits</p>
                      <p className="text-2xl font-black text-sncb-blue tabular-nums">3 / 4</p>
                   </div>
                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center group hover:bg-blue-50 transition-colors">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Échanges</p>
                      <p className="text-2xl font-black text-sncb-blue tabular-nums">2</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;