
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { 
  Trash2, Loader2, CheckCircle, XCircle, Scan, 
  ArrowRight, Table, Save, X, Info, FileSearch, 
  Sparkles, FileText, AlertCircle, Train 
} from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, completeOnboarding, setError, setSuccessMessage, ui, clearMessages, isSaving } = useApp();
  const { removeDuty, addDuties, error: dutiesError } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewDuties, setPreviewDuties] = useState<Duty[] | null>(null);
  
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDepot, setEditDepot] = useState('');

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditDepot(user.depot || '');
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    clearMessages();
    setPreviewDuties(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        
        // DÉTERMINATION DE L'URL ABSOLUE (Étape 12 : Fix routing 404)
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, "");
        const API_URL = `${baseUrl}/api/parse-roster`;

        console.log(`[ProfilePage] Appel Roster via: ${API_URL}`);

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64, 
            mimeType: file.type 
          })
        });

        // *** VÉRIFICATION DE LA RÉPONSE HTTP (Étape 11) ***
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ProfilePage] Erreur HTTP ${response.status}. Corps:`, errorText);
          
          let errorMessage = `Erreur du serveur (Statut ${response.status}).`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.details || errorMessage;
          } catch (e) {
            // Pas de JSON, on garde le message générique avec le statut
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (!result.services || result.services.length === 0) {
          throw new Error("Aucun service n'a pu être extrait. Vérifiez que le document est un Roster SNCB lisible.");
        }
        
        setPreviewDuties(result.services);
        setSuccessMessage(`${result.services.length} prestations identifiées par l'IA.`);
      } catch (err: any) {
        console.error("[ProfilePage] Capture d'erreur fatale:", err);
        setError(formatError(err));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFromPreview = (index: number) => {
    if (!previewDuties) return;
    const next = [...previewDuties];
    next.splice(index, 1);
    setPreviewDuties(next.length > 0 ? next : null);
  };

  const confirmImport = async () => {
    if (!previewDuties || !user) return;
    setIsUploading(true);
    try {
      const dutiesToCreate = previewDuties.map(s => ({ 
        ...s, 
        user_id: user.id 
      }));
      await addDuties(dutiesToCreate as any);
      setSuccessMessage("Votre planning a été importé avec succès.");
      setPreviewDuties(null);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-32 max-w-5xl mx-auto px-4">
      {/* NOTIFICATIONS */}
      {(ui.error || ui.success || dutiesError) && (
        <div className={`p-5 rounded-3xl border flex items-center gap-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          ui.error || dutiesError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {ui.error || dutiesError ? <XCircle size={22} /> : <CheckCircle size={22} />}
          <p className="text-[11px] font-black uppercase tracking-tight flex-grow italic">
            {ui.error || dutiesError || ui.success}
          </p>
          <button onClick={clearMessages} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* PROFIL AGENT */}
      <section className="glass-card p-8 md:p-12 bg-white shadow-2xl rounded-[40px] border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Train size={140} className="text-sncb-blue" />
        </div>
        
        <div className="flex items-center gap-5 mb-12">
           <div className="w-14 h-14 bg-sncb-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sncb-blue/20">
             <Info size={28} />
           </div>
           <div>
             <h3 className="text-lg font-black text-sncb-blue uppercase tracking-widest italic leading-none">Mon Profil Agent</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Identification communautaire SNCB</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:ring-8 focus:ring-sncb-blue/5 focus:border-sncb-blue transition-all outline-none" 
              value={editFirstName} 
              onChange={e => setEditFirstName(e.target.value)} 
              placeholder="Ex: Philippe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:ring-8 focus:ring-sncb-blue/5 focus:border-sncb-blue transition-all outline-none" 
              value={editLastName} 
              onChange={e => setEditLastName(e.target.value)} 
              placeholder="Ex: De Smet"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dépôt d'attache</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold appearance-none outline-none focus:ring-8 focus:ring-sncb-blue/5 focus:border-sncb-blue transition-all" 
              value={editDepot} 
              onChange={e => setEditDepot(e.target.value)}
            >
              <option value="">Sélectionnez un dépôt...</option>
              {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={() => completeOnboarding({ first_name: editFirstName, last_name: editLastName, depot: editDepot, rgpd_consent: true } as any)} 
          disabled={!editFirstName || !editDepot || isSaving} 
          className="w-full mt-12 py-6 bg-sncb-blue text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-sncb-blue/20 hover:scale-[1.01] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4 group"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Mettre à jour mon profil"}
          {!isSaving && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </section>

      {/* SCANNER SÉCURISÉ */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-sncb-blue uppercase tracking-widest italic leading-none">Roster Intelligence</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-sncb-blue" /> Cloud-Proxy IA Extraction
            </p>
          </div>
          {!isUploading && !previewDuties && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-10 py-5 bg-white border-2 border-sncb-blue text-sncb-blue rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-4 hover:bg-blue-50 transition-all shadow-xl active:scale-95"
            >
              <Scan size={24} /> Scanner un planning
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,application/pdf" 
          />
        </div>

        {/* ANIMATION DE SCAN LASER */}
        {isUploading && (
          <div className="relative h-80 glass-card bg-white rounded-[48px] border-dashed border-2 border-sncb-blue/10 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-sncb-blue to-transparent shadow-[0_0_30px_#003399] animate-laser-pass z-10"></div>
            
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-sncb-blue/5 rounded-full blur-3xl animate-pulse"></div>
              <FileSearch className="text-sncb-blue relative z-10" size={96} strokeWidth={1} />
            </div>

            <div className="text-center space-y-4 relative z-10 px-8">
               <div className="flex items-center justify-center gap-3">
                 <Loader2 className="animate-spin text-sncb-blue" size={20} />
                 <p className="text-[12px] font-black text-sncb-blue uppercase tracking-[0.5em] italic">Analyse IA...</p>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-xs mx-auto">
                 Extraction sécurisée des services depuis votre Roster SNCB.
               </p>
            </div>
          </div>
        )}

        {/* APERÇU ÉDITABLE */}
        {previewDuties && (
          <div className="glass-card bg-white p-8 md:p-12 rounded-[48px] border-2 border-sncb-blue shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-50 text-sncb-blue rounded-2xl shadow-inner"><Table size={32} /></div>
                <div>
                   <h4 className="text-lg font-black text-sncb-blue uppercase tracking-widest italic leading-none">Validation des données</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Vérifiez et éditez les prestations détectées</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDuties(null)} 
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <X size={32} />
              </button>
            </div>
            
            <div className="space-y-4 mb-12 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
              {previewDuties.map((d, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:border-sncb-blue/20 transition-all group animate-in slide-in-from-right-4"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center font-black text-sncb-blue text-sm shadow-sm italic group-hover:bg-sncb-blue group-hover:text-white transition-all">
                      {d.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-black text-slate-800 tabular-nums tracking-tighter">{d.start_time} — {d.end_time}</p>
                        <span className="px-4 py-1.5 bg-sncb-blue text-white text-[9px] font-black rounded-xl uppercase italic tracking-tighter shadow-md">
                          {d.type || 'SNCB'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        {new Date(d.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => removeFromPreview(i)} 
                      className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Retirer ce service"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button 
                 onClick={() => setPreviewDuties(null)} 
                 className="py-6 bg-slate-100 text-slate-500 rounded-[24px] font-black text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
               >
                 Tout annuler
               </button>
               <button 
                 onClick={confirmImport} 
                 className="py-6 bg-emerald-500 text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all active:scale-95"
               >
                 <Save size={24} /> Enregistrer le planning
               </button>
            </div>
          </div>
        )}

        {/* LISTE DES TOURS ACTUELS */}
        {!previewDuties && duties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {duties.map(duty => (
              <div 
                key={duty.id} 
                className="glass-card p-6 bg-white border border-slate-50 rounded-[32px] flex items-center justify-between group hover:shadow-2xl hover:border-sncb-blue/10 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center group-hover:bg-blue-50 transition-colors shadow-inner">
                    <span className="text-xl font-black text-sncb-blue italic leading-none">{duty.code}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase mt-2 tracking-widest">Tour</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800 tracking-tight">
                      {duty.start_time} <ArrowRight size={16} className="inline mx-2 text-slate-200" /> {duty.end_time}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {new Date(duty.date).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeDuty(duty.id)} 
                  className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ÉTAT VIDE */}
        {!previewDuties && duties.length === 0 && !isUploading && (
          <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center bg-white/30">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-8 text-slate-100 shadow-sm">
              <FileText size={48} strokeWidth={1} />
            </div>
            <h4 className="text-sm font-black text-slate-300 uppercase tracking-[0.4em] mb-4 italic">Aucun planning</h4>
            <p className="text-xs text-slate-400 font-bold uppercase max-w-xs mx-auto leading-relaxed px-6">
              Importez votre Roster pour voir vos prestations et commencer les échanges.
            </p>
          </div>
        )}
      </section>

      {duties.length > 0 && !previewDuties && (
        <div className="flex justify-center pt-12">
          <button 
            onClick={onNext} 
            className="px-20 py-7 bg-sncb-blue text-white rounded-[40px] font-black uppercase text-[14px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-6 group"
          >
            Passer à la Bourse <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
