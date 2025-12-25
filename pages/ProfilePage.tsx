
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Trash2, Loader2, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, completeOnboarding, setError, setSuccessMessage, ui, clearMessages } = useApp();
  const { removeDuty, addDuty, refresh, error: dutiesError } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(user?.rgpdConsent || false);
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfileComplete = editFirstName.trim() !== '' && 
                            editLastName.trim() !== '' && 
                            editDepot !== '' && 
                            rgpdAccepted;

  const handleActivateAccount = async () => {
    if (!isProfileComplete || isActivating) return;
    setIsActivating(true);
    clearMessages();
    
    try {
      // On passe explicitement les clés en snake_case pour Supabase
      await completeOnboarding({
        first_name: editFirstName,
        last_name: editLastName,
        depot: editDepot,
        rgpd_consent: rgpdAccepted
      } as any);
      setSuccessMessage("Compte activé avec succès !");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsActivating(false);
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

        let importedCount = 0;
        for (const s of parsedServices) {
          try {
            await addDuty({
              code: s.code,
              date: s.date,
              start_time: s.start_time,
              end_time: s.end_time,
              type: s.type || 'IC',
              destinations: s.destinations || [],
              user_id: user?.id
            } as any);
            importedCount++;
          } catch (e) {
            console.warn("Service ignoré:", e);
          }
        }
        setSuccessMessage(`${importedCount} prestations importées.`);
        await refresh();
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
    <div className="space-y-8 animate-slide-up pb-20 max-w-4xl mx-auto">
      {/* ZONE DE NOTIFICATION */}
      {(ui.error || ui.success || dutiesError) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-up ${
          ui.error || dutiesError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {ui.error || dutiesError ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <p className="text-xs font-bold uppercase tracking-tight">
            {ui.error || dutiesError || ui.success}
          </p>
          <button onClick={clearMessages} className="ml-auto opacity-50 hover:opacity-100">
            <XCircle size={14} />
          </button>
        </div>
      )}

      <section className="glass-card p-6 md:p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
        <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-widest mb-6 italic">Identification Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-sncb-blue transition-all"
              value={editFirstName}
              onChange={e => setEditFirstName(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-sncb-blue transition-all"
              value={editLastName}
              onChange={e => setEditLastName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dépôt d'attache</label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-sncb-blue transition-all"
              value={editDepot}
              onChange={e => setEditDepot(e.target.value)}
            >
              <option value="">Sélectionner un dépôt</option>
              {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <input 
            type="checkbox" 
            id="rgpd" 
            className="w-5 h-5 rounded border-gray-300 text-sncb-blue focus:ring-sncb-blue"
            checked={rgpdAccepted}
            onChange={e => setRgpdAccepted(e.target.checked)}
          />
          <label htmlFor="rgpd" className="text-[11px] font-medium text-slate-600 leading-tight cursor-pointer">
            J'accepte que mes données de service soient synchronisées avec le Cloud SwapACT.
          </label>
        </div>

        <button 
          disabled={!isProfileComplete || isActivating}
          onClick={handleActivateAccount}
          className="w-full mt-8 py-4 bg-sncb-blue text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sncb-blue-light transition-all disabled:opacity-50 shadow-lg shadow-sncb-blue/20"
        >
          {isActivating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
          {user?.onboardingCompleted ? "Mettre à jour mon profil" : "Activer mon compte agent"}
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-widest italic">Gestion du Roster</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Importez vos prestations via l'IA</p>
          </div>
          <button 
            onClick={triggerFileInput}
            disabled={isUploading}
            className="px-6 py-3 bg-white border border-sncb-blue text-sncb-blue rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
          >
            {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
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
          <div className="py-20 flex flex-col items-center glass-card bg-white rounded-2xl border-dashed border-2 border-gray-100">
            <Loader2 className="animate-spin text-sncb-blue mb-4" size={32} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isUploading ? "Analyse IA en cours..." : "Chargement du Roster..."}
            </p>
          </div>
        ) : duties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duties.map(duty => (
              <div key={duty.id} className="glass-card p-5 bg-white border border-gray-100 rounded-xl flex items-center justify-between group hover:border-sncb-blue/30 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                    <span className="text-xs font-black text-sncb-blue leading-none">{duty.code}</span>
                    <span className="text-[7px] font-black text-gray-400 uppercase mt-1">TOUR</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-800">{duty.start_time} - {duty.end_time}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-100 text-sncb-blue rounded uppercase">{duty.type}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {new Date(duty.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', weekday: 'short' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeDuty(duty.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center glass-card bg-white border-2 border-dashed border-gray-100 rounded-3xl">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
               <FileText size={32} />
             </div>
             <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest italic">Aucune prestation chargée</p>
          </div>
        )}
      </section>

      {user?.onboardingCompleted && (
        <div className="flex justify-center pt-10">
          <button 
            onClick={onNext}
            className="px-12 py-5 bg-sncb-blue text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Étape Suivante : Mes Préférences
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
