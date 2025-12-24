
import React, { useMemo } from 'react';
import { Duty } from '../types';
import { Train, Clock, Calendar, ChevronRight, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getStationName } from '../lib/stationCodes';

interface DashboardPageProps {
  duties: Duty[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties }) => {
  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dateA - dateB;
    });
  }, [duties]);

  const nextDuty = sortedDuties.find(d => new Date(`${d.date}T${d.startTime}`) >= new Date()) || sortedDuties[0];
  const upcomingAgenda = sortedDuties.filter(d => d.id !== nextDuty?.id).slice(0, 5);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "N/A";
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Header Institutionnel */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-sncb-blue uppercase tracking-tight italic">Espace Personnel <span className="text-gray-400">Agent</span></h1>
          <p className="text-sm text-gray-500 font-medium">Gestion du planning et des échanges de services</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm">
          <Calendar size={18} className="text-sncb-blue" />
          <p className="text-sm font-bold text-gray-700">
            {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Duty Card */}
          <div className="glass-card overflow-hidden">
            <div className="bg-sncb-blue p-1 flex justify-between px-6">
               <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">SNCB Personnel de Bord</span>
               <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Système SwapACT v2.5</span>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Conformité RGPS validée</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut Mission</p>
                  <p className="text-xs font-bold text-sncb-blue uppercase">Prochaine Vacation</p>
                </div>
              </div>

              {nextDuty ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Tour</span>
                        <span className="text-3xl font-black text-sncb-blue italic">{nextDuty.code}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sncb-blue mb-1">
                          <Train size={20} />
                          <span className="text-xl font-black uppercase italic">Service {nextDuty.type}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-500">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-32 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Prise (PS)</p>
                        <p className="text-2xl font-black text-sncb-blue">{nextDuty.startTime}</p>
                      </div>
                      <div className="flex-1 md:w-32 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Fin (FS)</p>
                        <p className="text-2xl font-black text-sncb-blue">{nextDuty.endTime}</p>
                      </div>
                    </div>
                  </div>

                  {nextDuty.destinations && nextDuty.destinations.length > 0 && (
                    <div className="pt-6 border-t border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Itinéraire du service</p>
                       <div className="flex items-center gap-3 flex-wrap">
                          {nextDuty.destinations.map((dest, idx) => (
                            <React.Fragment key={idx}>
                              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-black text-gray-700 shadow-sm">
                                {dest} <span className="text-gray-400 ml-1 font-bold">{getStationName(dest)}</span>
                              </div>
                              {idx < nextDuty.destinations.length - 1 && <ArrowRight size={14} className="text-gray-300" />}
                            </React.Fragment>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-xs">Aucun service détecté dans votre planning</p>
                  <button className="mt-4 text-sncb-blue font-black text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-sncb-blue-light transition-colors">Charger mon Roster PDF/Photo</button>
                </div>
              )}
            </div>
          </div>

          {/* Agenda List */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Agenda à venir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAgenda.length > 0 ? upcomingAgenda.map((duty) => (
                <div key={duty.id} className="glass-card p-5 flex items-center justify-between border border-gray-200 group hover:border-sncb-blue/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[8px] font-black text-gray-400 uppercase">{new Date(duty.date).toLocaleDateString('fr-BE', { weekday: 'short' })}</span>
                      <span className="text-sm font-black text-sncb-blue">{new Date(duty.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 uppercase">Tour {duty.code}</p>
                      <p className="text-[10px] font-bold text-gray-400">{duty.startTime} — {duty.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Durée</p>
                    <p className="text-xs font-bold text-gray-600">{calculateDuration(duty.startTime, duty.endTime)}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-10 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs font-bold text-gray-300 uppercase">Pas d'autres services programmés</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">Statistiques RGPS</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Heures Mensuelles</span>
                  <span className="text-sncb-blue">142h / 160h</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sncb-blue rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase">Repos (R)</span>
                  <span className="text-sm font-black text-sncb-blue">4 Jours</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase">Nuits (7j)</span>
                  <span className="text-sm font-black text-sncb-blue">2 / 3</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sncb-blue rounded-2xl p-6 text-white space-y-4 shadow-lg shadow-sncb-blue/20">
             <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
               <Clock size={24} className="text-white" />
             </div>
             <div className="space-y-1">
               <h4 className="text-lg font-black uppercase italic tracking-tight">Sync. Roster</h4>
               <p className="text-[10px] font-medium text-white/70 leading-relaxed uppercase tracking-wider">
                 Votre planning est synchronisé avec le terminal agent local.
               </p>
             </div>
             <button className="w-full py-3 bg-white text-sncb-blue rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">
               Mettre à jour (PS/FS)
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
