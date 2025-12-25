
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
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-slide-up">
      {/* Header Institutionnel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-sncb-blue uppercase tracking-tight italic">Espace <span className="text-gray-400">Agent</span></h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium">Gestion du planning SNCB</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto justify-center">
          <Calendar size={16} className="text-sncb-blue" />
          <p className="text-xs md:text-sm font-bold text-gray-700">
            {new Date().toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Main Duty Card */}
          <div className="glass-card overflow-hidden">
            <div className="bg-sncb-blue p-1 flex justify-between px-4 md:px-6">
               <span className="text-[8px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">SNCB Personnel</span>
               <span className="text-[8px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">v2.5</span>
            </div>
            
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                  <ShieldCheck size={12} />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">RGPS OK</span>
                </div>
                <div className="text-right">
                  <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Mission</p>
                  <p className="text-xs font-bold text-sncb-blue uppercase">Prochaine</p>
                </div>
              </div>

              {nextDuty ? (
                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">Tour</span>
                        <span className="text-xl md:text-3xl font-black text-sncb-blue italic">{nextDuty.code}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sncb-blue mb-0.5">
                          <Train size={16} />
                          <span className="text-sm md:text-xl font-black uppercase italic">Service {nextDuty.type}</span>
                        </div>
                        <p className="text-[10px] md:text-sm font-bold text-gray-500">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 w-full md:w-auto">
                      <div className="flex-1 md:w-32 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-0.5">PS</p>
                        <p className="text-lg md:text-2xl font-black text-sncb-blue">{nextDuty.startTime}</p>
                      </div>
                      <div className="flex-1 md:w-32 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-0.5">FS</p>
                        <p className="text-lg md:text-2xl font-black text-sncb-blue">{nextDuty.endTime}</p>
                      </div>
                    </div>
                  </div>

                  {nextDuty.destinations && nextDuty.destinations.length > 0 && (
                    <div className="pt-4 md:pt-6 border-t border-gray-100">
                       <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4">Itinéraire</p>
                       <div className="flex items-center gap-2 flex-wrap">
                          {nextDuty.destinations.map((dest, idx) => (
                            <React.Fragment key={idx}>
                              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] md:text-[11px] font-black text-gray-700 shadow-sm">
                                {dest} <span className="text-gray-400 ml-1 font-bold md:inline hidden">{getStationName(dest)}</span>
                              </div>
                              {idx < nextDuty.destinations.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
                            </React.Fragment>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 md:py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Aucun service détecté</p>
                </div>
              )}
            </div>
          </div>

          {/* Agenda List */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Agenda à venir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {upcomingAgenda.length > 0 ? upcomingAgenda.map((duty) => (
                <div key={duty.id} className="glass-card p-4 md:p-5 flex items-center justify-between border border-gray-200 group hover:border-sncb-blue/30">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">{new Date(duty.date).toLocaleDateString('fr-BE', { weekday: 'short' })}</span>
                      <span className="text-xs md:text-sm font-black text-sncb-blue">{new Date(duty.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-gray-800 uppercase">Tour {duty.code}</p>
                      <p className="text-[8px] md:text-[10px] font-bold text-gray-400">{duty.startTime} — {duty.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase">Durée</p>
                    <p className="text-[10px] md:text-xs font-bold text-gray-600">{calculateDuration(duty.startTime, duty.endTime)}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-6 md:py-10 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-300 uppercase">Pas d'autres services</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="glass-card p-4 md:p-6 space-y-6">
            <h3 className="text-[9px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">RGPS Mensuel</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[8px] md:text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Heures cumulées</span>
                  <span className="text-sncb-blue">142h / 160h</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sncb-blue rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                  <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">Repos (R)</span>
                  <span className="text-xs md:text-sm font-black text-sncb-blue">4 Jours</span>
                </div>
                <div className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                  <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">Nuits</span>
                  <span className="text-xs md:text-sm font-black text-sncb-blue">2 / 3</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sncb-blue rounded-2xl p-4 md:p-6 text-white space-y-4 shadow-lg shadow-sncb-blue/20">
             <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center">
               <Clock size={20} className="text-white" />
             </div>
             <div className="space-y-1">
               <h4 className="text-base md:text-lg font-black uppercase italic tracking-tight">Sync. Roster</h4>
               <p className="text-[9px] md:text-[10px] font-medium text-white/70 leading-relaxed uppercase tracking-wider">
                 Plan synchronisé avec terminal.
               </p>
             </div>
             <button className="w-full py-2.5 bg-white text-sncb-blue rounded-lg font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">
               Mettre à jour
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
