
import React, { useMemo } from 'react';
import { Duty, AppNotification } from '../types';
import { Train, Bell, Calendar, ChevronRight, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getStationName } from '../lib/stationCodes';

interface DashboardPageProps {
  duties: Duty[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties }) => {
  // Mock notifications pour la démo du passage à 20 utilisateurs
  const notifications: AppNotification[] = [
    { id: '1', title: 'Nouvelle Permute', message: 'Un collègue propose le Tour 112 (IC) au départ de Namur.', type: 'swap_request', read: false, createdAt: '10:45' },
    { id: '2', title: 'RGPS Validé', message: 'Votre planning de la semaine prochaine est conforme.', type: 'success', read: true, createdAt: 'Hier' }
  ];

  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dateA - dateB;
    });
  }, [duties]);

  const nextDuty = sortedDuties.find(d => new Date(`${d.date}T${d.startTime}`) >= new Date()) || sortedDuties[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-slide-up">
      {/* Header Statut */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-sncb-blue uppercase tracking-tight italic">Dashboard <span className="text-gray-400">Agent</span></h1>
          <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">SNCB Cloud Service • Connecté</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative p-3 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <Bell size={20} className="text-sncb-blue" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-grow md:flex-none flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
            <Calendar size={18} className="text-sncb-blue" />
            <p className="text-xs font-black text-gray-700 uppercase">
              {new Date().toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Notifications Panel */}
          <div className="glass-card bg-white overflow-hidden border-l-4 border-l-sncb-blue">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-[0.2em]">Dernières Alertes</h3>
               <span className="text-[9px] font-bold text-gray-400 uppercase">Voir tout</span>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                  <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    n.type === 'swap_request' ? 'bg-sncb-blue text-white' : 'bg-green-100 text-green-600'
                  }`}>
                    {n.type === 'swap_request' ? <Train size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-black text-gray-800 leading-none mb-1">{n.title}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{n.message}</p>
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 uppercase shrink-0">{n.createdAt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Mission */}
          <div className="glass-card overflow-hidden bg-white shadow-xl">
            <div className="bg-sncb-blue p-2 px-6 flex justify-between items-center">
               <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Prochaine Prestation</span>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-white/80 uppercase">Service Confirmé</span>
               </div>
            </div>
            
            <div className="p-6 md:p-10">
              {nextDuty ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 border-2 border-gray-100 rounded-3xl flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Tour</span>
                        <span className="text-2xl md:text-4xl font-black text-sncb-blue italic">{nextDuty.code}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sncb-blue mb-1">
                          <Train size={20} />
                          <span className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">{nextDuty.type}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="flex-1 md:w-32 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                        <p className="text-[9px] font-black text-sncb-blue/40 uppercase mb-1">Début (PS)</p>
                        <p className="text-2xl font-black text-sncb-blue">{nextDuty.startTime}</p>
                      </div>
                      <div className="flex-1 md:w-32 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Fin (FS)</p>
                        <p className="text-2xl font-black text-gray-800">{nextDuty.endTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-6 border-t border-gray-100 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase border border-green-100">
                      <ShieldCheck size={14} /> RGPS OK
                    </div>
                    {nextDuty.destinations?.map((dest, idx) => (
                      <React.Fragment key={idx}>
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 border border-gray-200">
                          {dest}
                        </div>
                        {idx < nextDuty.destinations.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <AlertCircle size={40} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Scannez votre roster pour commencer</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Panel Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-sncb-blue text-white shadow-xl shadow-blue-900/20">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
               <Train size={24} className="text-white" />
             </div>
             <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">Bourse aux échanges</h4>
             <p className="text-[11px] text-white/70 font-medium leading-relaxed mb-8">
               24 offres de permutes actives aujourd'hui dans votre dépôt. 
               Vos préférences filtrent les meilleures opportunités.
             </p>
             <button className="w-full py-4 bg-white text-sncb-blue rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95">
               Voir les permutes
             </button>
          </div>

          <div className="glass-card p-6 bg-white border border-gray-100">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4 italic">Récapitulatif Mensuel</h3>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                      <span className="text-gray-500">Heures de service</span>
                      <span className="text-sncb-blue">128h / 160h</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sncb-blue" style={{ width: '80%' }}></div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Nuits</p>
                      <p className="text-lg font-black text-sncb-blue">3 / 4</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Repos (R)</p>
                      <p className="text-lg font-black text-sncb-blue">6 Jours</p>
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
