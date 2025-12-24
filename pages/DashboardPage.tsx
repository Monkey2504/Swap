
import React, { useMemo } from 'react';
import { Duty } from '../types';
import { Train, Clock, Calendar, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';
import { getStationName } from '../lib/stationCodes';

interface DashboardPageProps {
  duties: Duty[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties }) => {
  // Tri des services par date et heure
  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dateA - dateB;
    });
  }, [duties]);

  const nextDuty = sortedDuties[0];
  const upcomingAgenda = sortedDuties.slice(1, 5);

  // Fonction utilitaire pour calculer la durée d'un service
  const calculateDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // Gestion des services de nuit
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-inter">
      {/* En-tête Institutionnel */}
      <div className="flex justify-between items-end pb-4 border-b-2 border-[#003399]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#333333] tracking-tight">Terminal Agent de Bord</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestion des prestations et bourses d'échange</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold uppercase text-gray-400">Date de consultation</p>
          <p className="text-lg font-bold text-[#003399]">
            {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Principale : Prestation Immédiate & Agenda */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Service Immédiat */}
          <div className="sncb-card border-l-4 border-l-[#003399]">
            <div className="sncb-card-header bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#003399]" />
                <h3>Prochaine Prestation</h3>
              </div>
              <span className="badge-sncb badge-success">Validé RGPS</span>
            </div>
            <div className="sncb-card-content">
              {nextDuty ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-[#003399] rounded flex flex-col items-center justify-center text-white shadow-lg">
                        <span className="text-[10px] font-bold uppercase opacity-70">Série</span>
                        <span className="text-3xl font-black">{nextDuty.code}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[#003399] mb-1">
                          <Train size={18} />
                          <span className="text-lg font-extrabold uppercase tracking-tight">
                            Service {nextDuty.type}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-600">
                          {new Date(nextDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-32 p-4 bg-gray-50 rounded border border-gray-100 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">PS (Prise)</p>
                        <p className="text-2xl font-black text-[#333333]">{nextDuty.startTime}</p>
                      </div>
                      <div className="flex-1 md:w-32 p-4 bg-gray-50 rounded border border-gray-100 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">FS (Fin)</p>
                        <p className="text-2xl font-black text-[#333333]">{nextDuty.endTime}</p>
                      </div>
                    </div>
                  </div>

                  {nextDuty.destinations && nextDuty.destinations.length > 0 && (
                    <div className="pt-6 border-t border-gray-100">
                       <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Itinéraire Télégraphique</p>
                       <div className="flex items-center gap-3 flex-wrap">
                          {nextDuty.destinations.map((dest, idx) => (
                            <React.Fragment key={idx}>
                              <div className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-[#333333]">
                                {dest} <span className="text-[9px] text-gray-400 ml-1">({getStationName(dest)})</span>
                              </div>
                              {idx < nextDuty.destinations.length - 1 && <ArrowRight size={14} className="text-gray-300" />}
                            </React.Fragment>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded">
                  <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 font-bold text-sm uppercase">Aucune prestation chargée</p>
                  <button className="mt-4 text-[#003399] font-bold text-xs uppercase underline">Scanner mon Roster PDF</button>
                </div>
              )}
            </div>
          </div>

          {/* Agenda des jours suivants */}
          <div className="sncb-card">
            <div className="sncb-card-header">
              <h3>Agenda des Prestations</h3>
              <Calendar size={18} className="text-gray-400" />
            </div>
            <div className="sncb-card-content p-0">
              {upcomingAgenda.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {upcomingAgenda.map((duty) => (
                    <div key={duty.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(duty.date).toLocaleDateString('fr-BE', { weekday: 'short' })}
                          </p>
                          <p className="text-xl font-black text-[#003399]">
                            {new Date(duty.date).getDate()}
                          </p>
                        </div>
                        <div className="h-10 w-[2px] bg-gray-100"></div>
                        <div>
                          <p className="text-sm font-black text-[#333333]">Tour {duty.code}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                             Série {duty.type} • {duty.startTime} — {duty.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center gap-6 w-full md:w-auto justify-between">
                         <div className="text-right">
                           <p className="text-[9px] font-bold text-gray-400 uppercase">Durée</p>
                           <p className="text-sm font-bold text-[#333333]">{calculateDuration(duty.startTime, duty.endTime)}</p>
                         </div>
                         <button className="p-2 text-gray-400 hover:text-[#003399] transition-colors">
                           <ChevronRight size={20} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-gray-400 italic text-sm">
                  Fin du Roster importé.
                </div>
              )}
            </div>
            {sortedDuties.length > 5 && (
              <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                 <button className="text-[11px] font-bold text-[#003399] uppercase tracking-widest">
                   Afficher tout mon Roster
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Latérale : Statistiques Opérationnelles */}
        <div className="space-y-8">
          <div className="sncb-card">
            <div className="sncb-card-header">
              <h3>Statut Réglementaire</h3>
            </div>
            <div className="sncb-card-content space-y-6">
              <div className="p-4 bg-blue-50 rounded border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-blue-800 uppercase">Vacation Mensuelle</span>
                  <span className="text-xs font-black text-blue-900">142h / 160h</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-[#003399]" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase">Repos compensatoires (R)</span>
                  <span className="text-sm font-black text-[#333333]">4 jours</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase">Services de nuit</span>
                  <span className="text-sm font-black text-[#333333]">2 / 7j</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-500 uppercase">Dépôt d'attache</span>
                  <span className="text-sm font-black text-[#003399]">{sortedDuties[0]?.depot || 'Midi (FBMZ)'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sncb-card bg-[#003399] border-none shadow-xl">
             <div className="sncb-card-content text-white p-8">
                <Calendar size={32} className="mb-4 opacity-50" />
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Mise à jour Roster</h4>
                <p className="text-[11px] text-white/70 leading-relaxed mb-6">
                  Assurez-vous de scanner votre feuille de route après chaque modification du Tableau de Service (TS).
                </p>
                <button className="w-full py-4 bg-white text-[#003399] font-black text-[11px] uppercase tracking-widest rounded hover:bg-gray-100 transition-colors">
                  Importer Prestations
                </button>
             </div>
          </div>

          <div className="p-4 flex items-center gap-3 text-amber-600 bg-amber-50 rounded border border-amber-100">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[10px] font-bold leading-tight uppercase">
              Vérifiez toujours vos horaires de PS sur le terminal officiel avant votre prise de service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
