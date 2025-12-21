
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SNCB_DEPOTS, MOCK_STAFF_LIST, generateId } from '../constants';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';

interface ProfilePageProps {
  onNext: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNext }) => {
  const { user, updateUserProfile, publishDutyForSwap, rgpdConsent, setRgpdConsent, setError, isSaving } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [previewDuties, setPreviewDuties] = useState<Duty[]>([]);

  if (!user) return null;

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fullName = e.target.value;
    setSelectedStaff(fullName);
    const staff = MOCK_STAFF_LIST.find(s => `${s.firstName} ${s.lastName}` === fullName);
    if (staff) {
      updateUserProfile({ 
        firstName: staff.firstName, 
        lastName: staff.lastName,
        series: staff.series,
        position: staff.position,
        sncbId: staff.sncbId,
        depot: staff.depot
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rgpdConsent) {
      setError("Vous devez accepter les conditions RGPD pour utiliser le scanner IA.");
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const services = await parseRosterDocument(base64String, file.type);
        
        if (services && services.length > 0) {
          const extracted: Duty[] = services.map(s => ({
            id: generateId('duty'),
            code: s.code,
            type: 'IC',
            relations: [],
            compositions: [],
            destinations: Array.from(new Set(s.tasks.map(t => t.location))),
            startTime: s.startTime,
            endTime: s.endTime,
            date: new Date().toISOString().split('T')[0]
          }));
          setPreviewDuties(extracted);
        } else {
          setError("L'IA n'a détecté aucun service valide sur ce document.");
        }
      } catch (err) {
        setError("Erreur lors de l'analyse du document. Vérifiez le format (PDF/Image).");
      } finally {
        setIsUploading(false);
        e.target.value = ''; 
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmPreview = () => {
    updateUserProfile({ currentDuties: [...user.currentDuties, ...previewDuties] });
    setPreviewDuties([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn p-4 pb-32">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sncb-blue font-black text-xs uppercase tracking-[0.3em]">Étape 01/03</p>
          <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">Configuration Profil</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLONNE GAUCHE: IDENTITÉ & SCANNER */}
        <div className="lg:col-span-4 space-y-8">
          {/* CARTE IDENTITÉ */}
          <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <h3 className="text-sm font-black text-sncb-blue uppercase tracking-widest mb-6 flex items-center">
              <span className="w-6 h-6 bg-sncb-blue text-white rounded-lg flex items-center justify-center text-[10px] mr-3">ID</span>
              Identification
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sélectionner dans le cadre</label>
                <select
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-sncb-blue outline-none font-bold text-slate-700 transition-all text-sm"
                  value={selectedStaff}
                  onChange={handleStaffSelect}
                >
                  <option value="">Chercher mon nom...</option>
                  {MOCK_STAFF_LIST.map(s => (
                    <option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.lastName.toUpperCase()} {s.firstName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Dépôt</span>
                  <p className="font-black text-slate-900">{user.depot || '--'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Série</span>
                  <p className="font-black text-slate-900">{user.series || '--'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CARTE SCANNER */}
          <div className="bg-slate-900 rounded-[32px] shadow-2xl p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <span className="text-8xl">🚆</span>
             </div>
             <h3 className="text-sm font-black text-sncb-yellow uppercase tracking-widest mb-6 relative z-10">Import Intelligent</h3>
             
             <div className="space-y-6 relative z-10">
                <div className="flex items-start space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <input 
                    type="checkbox" 
                    id="rgpd" 
                    checked={rgpdConsent} 
                    onChange={(e) => setRgpdConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-sncb-yellow"
                  />
                  <label htmlFor="rgpd" className="text-[10px] font-medium text-slate-300 leading-snug cursor-pointer">
                    J'autorise l'IA à analyser mon planning. Données confidentielles & professionnelles uniquement.
                  </label>
                </div>

                <div className={`transition-all duration-500 ${rgpdConsent ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" id="roster-upload" disabled={!rgpdConsent || isUploading} />
                  <label 
                    htmlFor="roster-upload" 
                    className={`flex items-center justify-center space-x-3 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${isUploading ? 'bg-slate-700 animate-pulse' : 'bg-sncb-yellow text-slate-900 hover:scale-[1.02] active:scale-95 shadow-lg shadow-sncb-yellow/20'}`}
                  >
                    <span>{isUploading ? 'Analyse...' : '📄 Scanner Roster'}</span>
                  </label>
                </div>
             </div>
          </div>
        </div>

        {/* COLONNE DROITE: SERVICES ENREGISTRÉS */}
        <div className="lg:col-span-8 space-y-8">
          {/* FENÊTRE PREVIEW IA (STABLE) */}
          {previewDuties.length > 0 && (
            <div className="bg-white rounded-[32px] border-4 border-sncb-yellow p-8 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 uppercase">Aperçu de l'import</h4>
                  <p className="text-xs font-bold text-slate-400">Cliquez sur confirmer pour ajouter à votre profil</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setPreviewDuties([])} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 border hover:bg-slate-50 transition-all">Ignorer</button>
                  <button onClick={confirmPreview} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase bg-sncb-blue text-white shadow-xl hover:bg-slate-800 transition-all">Confirmer ({previewDuties.length})</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {previewDuties.map((d, i) => (
                  <div key={i} className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <span className="font-black text-sncb-blue italic">{d.code}</span>
                    <span className="w-px h-4 bg-slate-200"></span>
                    <span className="text-[10px] font-bold text-slate-500">{d.startTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTE DES SERVICES */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mes services enregistrés</h3>
            
            {user.currentDuties.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center">
                <p className="text-slate-400 font-bold italic">Aucun service importé pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.currentDuties.map(duty => (
                  <div key={duty.id} className="bg-white rounded-[32px] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:border-sncb-blue transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-4xl font-black text-sncb-blue italic tracking-tighter">{duty.code}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Service {duty.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900 tracking-tighter">{duty.startTime} <span className="text-slate-300">➔</span> {duty.endTime}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Aujourd'hui</p>
                        </div>
                      </div>
                      
                      <div className="ticket-divider"></div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                          {duty.destinations.slice(0, 3).map((dest, idx) => (
                            <div key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black border-2 border-white shadow-sm">
                              {dest}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => publishDutyForSwap(duty.id)}
                          disabled={isSaving}
                          className={`bg-sncb-blue text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sncb-yellow hover:text-slate-900 transition-all active:scale-95 shadow-md flex items-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="mr-2">🔄</span> Proposer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* NAVIGATION FLOTTANTE */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4 z-30">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-[40px] shadow-2xl flex justify-between items-center">
           <div className="hidden md:block pl-6">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression</p>
             <div className="flex space-x-1 mt-1">
               <div className="w-8 h-1.5 bg-sncb-blue rounded-full"></div>
               <div className="w-8 h-1.5 bg-slate-100 rounded-full"></div>
               <div className="w-8 h-1.5 bg-slate-100 rounded-full"></div>
             </div>
           </div>
           <button 
            onClick={onNext} 
            disabled={user.currentDuties.length === 0}
            className={`font-black px-12 py-5 rounded-[28px] transition-all uppercase tracking-widest italic flex items-center shadow-xl ${user.currentDuties.length > 0 ? 'bg-sncb-blue text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
          >
            <span>Match IA</span>
            <span className="ml-3 text-xl">➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
