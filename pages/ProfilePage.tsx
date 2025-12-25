
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS, LEGAL_DISCLAIMER } from '../constants';
import { Upload, Trash2, MapPin, Loader2, Train, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, completeOnboarding, setError, setSuccessMessage, logout } = useApp();
  const { removeDuty, addDuty, refresh } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditDepot(user.depot || '');
    }
  }, [user]);

  const isProfileComplete = editFirstName.trim() !== '' && editLastName.trim() !== '' && editDepot !== '' && rgpdAccepted;

  const handleActivateAccount = async () => {
    if (!isProfileComplete) return;
    setIsActivating(true);
    try {
      await completeOnboarding({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        depot: editDepot,
        rgpdConsent: true
      });
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsActivating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const detectedServices = await parseRosterDocument(base64, file.type);
          
          if (detectedServices.length === 0) {
            throw new Error("Aucun service n'a été détecté dans ce document.");
          }

          // Ajout automatique des services dans la base de données
          let count = 0;
          for (const service of detectedServices) {
            await addDuty({
              ...service,
              user_id: user?.id,
              type: service.type || 'IC'
            });
            count++;
          }

          setSuccessMessage(`${count} services ont été ajoutés à votre planning !`);
          await refresh();
        } catch (err) {
          setError(formatError(err));
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(formatError(err));
      setIsUploading(false);
    }
  };

  if (!user?.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <div className="relative z-10 w-full max-w-xl glass-card bg-slate-900/90 p-8 md:p-12 border-white/10 animate-slide-up shadow-2xl">
           <div className="text-center mb-10">
             <div className="w-20 h-20 bg-sncb-blue rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl">
               <Train size={36} />
             </div>
             <h1 className="text-3xl font-black text-white italic uppercase">Finaliser le <span className="text-blue-400">Profil</span></h1>
           </div>

           <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-white placeholder-slate-500" placeholder="Prénom" />
                <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-white placeholder-slate-500" placeholder="Nom" />
              </div>
              <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-white">
                <option value="" disabled className="bg-slate-900">Choisir mon dépôt...</option>
                {DEPOTS.map(d => <option key={d.code} value={d.code} className="bg-slate-900">{d.name}</option>)}
              </select>

              <label className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                <input type="checkbox" checked={rgpdAccepted} onChange={e => setRgpdAccepted(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-sncb-blue focus:ring-sncb-blue" />
                <span className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                  J'accepte que mes données de planning soient visibles par mes collègues du même dépôt pour faciliter les échanges.
                </span>
              </label>
           </div>

           <button onClick={handleActivateAccount} disabled={!isProfileComplete || isActivating} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isProfileComplete ? 'bg-white text-slate-950 shadow-xl' : 'bg-white/10 text-slate-600'}`}>
             {isActivating ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Accéder à la bourse"}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-40">
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
        <AlertTriangle className="text-sncb-blue shrink-0" size={24} />
        <p className="text-[11px] font-bold text-sncb-blue leading-relaxed italic">{LEGAL_DISCLAIMER}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass-card p-10 bg-white border-gray-100 text-center shadow-xl">
            <div className="w-24 h-24 bg-sncb-blue rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6">
              {user.firstName?.[0]}
            </div>
            <h2 className="text-xl font-black text-sncb-blue">{user.firstName} {user.lastName}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{user.depot}</p>
            <button onClick={logout} className="w-full py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all">Déconnexion</button>
          </div>

          <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-4">
             <div className="flex items-center gap-3">
               <FileText className="text-blue-400" />
               <p className="font-black text-xs uppercase italic">Résumé Roster</p>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl text-center">
                   <p className="text-[8px] font-bold text-slate-500 uppercase">Services</p>
                   <p className="text-lg font-black">{duties.length}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl text-center">
                   <p className="text-[8px] font-bold text-slate-500 uppercase">Prochain</p>
                   <p className="text-lg font-black">{duties[0]?.code || '---'}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-grow space-y-10">
           <div className="glass-card p-10 bg-white shadow-xl relative overflow-hidden">
             <div className="flex items-center gap-4 mb-8">
               <Upload className="text-sncb-blue" />
               <h3 className="text-xl font-black italic uppercase text-sncb-blue">Charger mon Roster</h3>
             </div>
             
             <div className="relative group">
               {isUploading && (
                 <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-[32px] animate-fade-in">
                    <Loader2 size={48} className="text-sncb-blue animate-spin mb-4" />
                    <p className="text-xs font-black text-sncb-blue uppercase tracking-widest">Analyse IA en cours...</p>
                 </div>
               )}

               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 disabled={isUploading}
                 className="w-full py-16 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center gap-4 hover:bg-blue-50/50 hover:border-sncb-blue/30 transition-all group"
               >
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-sncb-blue group-hover:bg-white group-hover:shadow-lg transition-all">
                    <Upload size={36} />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-black uppercase text-slate-600 tracking-widest mb-1">Cliquer pour importer</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">PDF, PNG ou JPEG acceptés</span>
                  </div>
               </button>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept=".pdf,image/*" 
               onChange={handleFileUpload} 
             />
           </div>

           {/* Liste des services pour prévisualisation rapide */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Services Actuels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {duties.slice(0, 4).map(duty => (
                   <div key={duty.id} className="glass-card p-5 bg-white border-gray-100 flex justify-between items-center group hover:border-sncb-blue/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-sncb-blue">
                          {duty.code}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase">{duty.startTime} > {duty.endTime}</p>
                          <p className="text-[9px] font-bold text-slate-400">{new Date(duty.date).toLocaleDateString('fr-BE')}</p>
                        </div>
                      </div>
                      <button onClick={() => removeDuty(duty.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
                 {duties.length === 0 && (
                   <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                     <p className="text-[10px] font-bold text-slate-300 uppercase italic">Aucun service importé</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
