
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Trash2, Loader2, FileText, CheckCircle, AlertCircle, XCircle, Info, Lock } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, completeOnboarding, setError, setSuccessMessage, ui, clearMessages, isSaving } = useApp();
  const { removeDuty, addDuties, refresh, error: dutiesError } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDepot, setEditDepot] = useState('');

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditDepot(user.depot || '');
      setRgpdAccepted(user.rgpdConsent || false);
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfileComplete = editFirstName.trim() !== '' && 
                            editLastName.trim() !== '' && 
                            editDepot !== '' && 
                            rgpdAccepted;

  const handleActivateAccount = async () => {
    if (!isProfileComplete || isSaving) return;
    clearMessages();
    
    try {
      await completeOnboarding({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        depot: editDepot,
        rgpd_consent: rgpdAccepted
      } as any);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    clearMessages();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const parsedServices = await parseRosterDocument(base64, file.type);
        
        if (!parsedServices || parsedServices.length === 0) {
          throw new Error("L'IA n'a détecté aucune prestation. Vérifiez le document.");
        }

        // Préparation du Bulk Insert
        const dutiesToCreate = parsedServices.map(s => ({
          code: s.code,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          type: s.type || 'IC',
          destinations: s.destinations || [],
          user_id: user?.id
        }));

        await addDuties(dutiesToCreate as any);
        setSuccessMessage(`${parsedServices.length} prestations importées.`);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20 max-w-4xl mx-auto px-4">
      {/* ZONE DE NOTIFICATION */}
      {(ui.error || ui.success || dutiesError) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-up shadow-sm ${
          ui.error || dutiesError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {ui.error || dutiesError ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <p className="text-[11px] font-bold uppercase tracking-tight flex-grow">
            {ui.error || dutiesError || ui.success}
          </p>
          <button onClick={clearMessages} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <XCircle size={14} className="opacity-40" />
          </button>
        </div>
      )}

      <section className="glass-card p-6 md:p-8 bg-white shadow-xl rounded-3xl border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-sncb-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-sncb-blue/20">
             <CheckCircle size={20} />
           </div>
           <h3 className="text-xs font-black text-sncb-blue uppercase tracking-[0.2em] italic">Identification Agent</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-sncb-blue focus:ring-4 focus:ring-sncb-blue/5 transition-all"
              value={editFirstName}
              onChange={e => setEditFirstName(e.target.value)}
              placeholder="Ex: Jean"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-sncb-blue focus:ring-4 focus:ring-sncb-blue/5 transition-all"
              value={editLastName}
              onChange={e => setEditLastName(e.target.value)}
              placeholder="Ex: Dupont"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dépôt d'attache</label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-sncb-blue focus:ring-4 focus:ring-sncb-blue/5 transition-all appearance-none"
              value={editDepot}
              onChange={e => setEditDepot(e.target.value)}
            >
              <option value="">-- Sélectionner votre dépôt --</option>
              {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>
          </div>
        </div>
        
        <div className={`mt-8 flex items-center gap-4 p-5 rounded-2xl border transition-all ${rgpdAccepted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              id="rgpd" 
              className="w-6 h-6 rounded-lg border-gray-300 text-sncb-blue focus:ring-sncb-blue cursor-pointer"
              checked={rgpdAccepted}
              onChange={e => setRgpdAccepted(e.target.checked)}
            />
          </div>
          <label htmlFor="rgpd" className="text-[11px] font-bold text-slate-600 leading-snug cursor-pointer select-none">
            J'autorise SwapACT à traiter mes données de service pour le matching. <br/>
            <span className="text-[9px] text-slate-400 font-medium">Les données sont stockées de manière sécurisée sur le Cloud SNCB.</span>
          </label>
        </div>

        <button 
          disabled={!isProfileComplete || isSaving}
          onClick={handleActivateAccount}
          className="w-full mt-8 py-5 bg-sncb-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-sncb-blue-light transition-all disabled:opacity-40 shadow-xl shadow-sncb-blue/20 group"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : (isProfileComplete ? <CheckCircle size={18} /> : <Lock size={18} />)}
          {user?.onboardingCompleted ? "Mettre à jour mon profil" : "Activer mon compte agent"}
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-sncb-blue rounded-full"></div>
              <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-widest italic">Gestion du Roster</h3>
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Numérisez vos prestations (PDF ou Photo)</p>
          </div>
          <button 
            onClick={triggerFileInput}
            disabled={isUploading || !user?.onboardingCompleted}
            className={`px-8 py-4 bg-white border border-sncb-blue text-sncb-blue rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-50 transition-all shadow-sm disabled:opacity-20`}
          >
            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            Scanner Roster
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
        </div>

        {dutiesLoading || isUploading ? (
          <div className="py-24 flex flex-col items-center glass-card bg-white rounded-[32px] border-dashed border-2 border-gray-100">
            <Loader2 className="animate-spin text-sncb-blue mb-6" size={48} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
              {isUploading ? "Intelligence Artificielle en cours..." : "Synchronisation Roster..."}
            </p>
          </div>
        ) : duties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duties.map(duty => (
              <div key={duty.id} className="glass-card p-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-sncb-blue/30 transition-all shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-blue-50 transition-colors">
                    <span className="text-sm font-black text-sncb-blue leading-none">{duty.code}</span>
                    <span className="text-[7px] font-black text-gray-400 uppercase mt-1.5">TOUR</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-black text-gray-800 tracking-tight">{duty.start_time} — {duty.end_time}</span>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-blue-100 text-sncb-blue rounded-lg uppercase">{duty.type}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(duty.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeDuty(duty.id)}
                  className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center glass-card bg-white border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center">
             <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
               <FileText size={40} />
             </div>
             <h4 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] italic">Aucune prestation chargée</h4>
          </div>
        )}
      </section>

      {user?.onboardingCompleted && (
        <div className="flex justify-center pt-10 border-t border-gray-100">
          <button 
            onClick={onNext}
            className="px-14 py-6 bg-sncb-blue text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4"
          >
            Passer aux Préférences
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
