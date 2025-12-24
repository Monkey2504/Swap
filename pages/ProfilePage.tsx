
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Camera, Trash2, Calendar, ChevronRight, X, MapPin, Loader2, User, FileText, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, updateUserProfile, completeOnboarding, setError, setSuccessMessage, logout, isSaving } = useApp();
  const { removeDuty, addDuty } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || '');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditDepot(user.depot || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-sncb-blue" />
      </div>
    );
  }

  const processRosterData = async (base64Data: string, mimeType: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const services = await parseRosterDocument(base64Data, mimeType);
      if (services?.length) {
        for (const s of services) {
          await addDuty({
            user_id: user.id,
            code: s.code || "TOUR",
            type: (s.type as any) || 'IC',
            startTime: s.startTime || "00:00",
            endTime: s.endTime || "00:00",
            date: s.date || new Date().toISOString().split('T')[0],
            relations: [], 
            destinations: s.destinations || [], 
            compositions: []
          });
        }
        setSuccessMessage(`${services.length} services importés.`);
      }
    } catch (err) { 
      setError(formatError(err)); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const isProfileComplete = editFirstName.trim() !== '' && editLastName.trim() !== '' && editDepot !== '';

  const handleActivateAccount = async () => {
    if (!isProfileComplete) return;
    setIsActivating(true);
    try {
      await completeOnboarding({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        depot: editDepot
      });
    } catch (err) {
      setIsActivating(false);
    }
  };

  const handleUpdateProfile = async () => {
    updateUserProfile({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      depot: editDepot
    });
    setIsEditing(false);
    setSuccessMessage("Profil mis à jour.");
  };

  // UI ONBOARDING
  if (!user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src="https://i.imgur.com/ChBOn7U.jpeg" className="w-full h-full object-cover scale-110 blur-sm" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10 border border-white/20 animate-slide-up">
           <div className="text-center mb-10">
             <div className="w-16 h-16 bg-sncb-blue rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 italic shadow-xl">B</div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Espace Communautaire</h1>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Identifiez-vous auprès de vos collègues</p>
           </div>

           <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Prénom</label>
                  <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-4 focus:ring-sncb-blue/5" placeholder="Ex: Marc" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom</label>
                  <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-4 focus:ring-sncb-blue/5" placeholder="Ex: Lambert" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Votre Dépôt</label>
                <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-4 focus:ring-sncb-blue/5">
                  <option value="" disabled>Choisir mon dépôt...</option>
                  {/* Fixed DEPOTS mapping to use code and name strings */}
                  {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>
           </div>

           <button 
             onClick={handleActivateAccount}
             disabled={!isProfileComplete || isActivating}
             className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${
               isProfileComplete && !isActivating 
               ? 'bg-sncb-blue text-white shadow-sncb-blue/30 hover:scale-[1.02]' 
               : 'bg-slate-100 text-slate-300'
             }`}
           >
             {isActivating ? <Loader2 size={20} className="animate-spin" /> : "Rejoindre l'espace"}
             {!isActivating && <CheckCircle2 size={18} />}
           </button>

           <button onClick={logout} className="w-full py-4 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">Retour</button>
        </div>
      </div>
    );
  }

  // INTERFACE STANDARD
  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 space-y-8">
          <div className="glass-card p-10 shadow-2xl border border-white/5 text-center group">
            <div className="w-24 h-24 bg-accent-purple rounded-[30px] flex items-center justify-center text-white text-3xl font-black mx-auto mb-8 shadow-xl relative transition-transform group-hover:scale-105">
              {user.firstName?.[0] || 'A'}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border-none font-bold text-sm text-white" placeholder="Prénom" />
                <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border-none font-bold text-sm text-white" placeholder="Nom" />
                <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border-none font-bold text-sm text-white">
                  {/* Fixed DEPOTS mapping for profile edit */}
                  {DEPOTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
                <button onClick={handleUpdateProfile} className="w-full py-3 bg-accent-purple text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Enregistrer</button>
                <button onClick={() => setIsEditing(false)} className="w-full py-2 text-[10px] font-black text-slate-400 uppercase">Annuler</button>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-white">{user.firstName} {user.lastName}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-purple/10 text-accent-purple rounded-full text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={10} /> {user.depot || 'Dépôt non défini'}
                </div>
                <button onClick={() => setIsEditing(true)} className="w-full py-3 mt-8 bg-white/5 text-slate-400 rounded-xl font-black text-[10px] tracking-widest uppercase hover:text-white transition-colors">Modifier mes infos</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow space-y-12">
          <div className="glass-card p-10 shadow-2xl border border-white/5 relative overflow-hidden">
            {isUploading && (
              <div className="absolute inset-0 bg-slate-900/90 z-20 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
                <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black text-accent-purple uppercase tracking-widest">Numérisation en cours...</p>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-accent-purple/10 text-accent-purple rounded-2xl flex items-center justify-center italic font-black text-xl">B</div>
              <div>
                <h3 className="text-xl font-black tracking-tight italic">Mon Planning</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Importation pour le matching</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="p-8 rounded-3xl border-2 border-dashed border-white/5 hover:border-accent-purple hover:bg-white/5 transition-all flex flex-col items-center gap-4 group">
                <Upload size={32} className="text-slate-500 group-hover:text-accent-purple transition-colors" />
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-300">Importer PDF / Photo</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => processRosterData((reader.result as string).split(',')[1], file.type);
                  reader.readAsDataURL(file);
                }
              }} className="hidden" />
              
              <div className="p-8 bg-white/5 rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                <p className="text-2xl font-black text-accent-purple">{duties.length}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Services dans mon roster</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {dutiesLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-500" size={40} /></div>
            ) : duties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duties.slice(0, 6).map(d => (
                  <div key={d.id} className="glass-card p-5 shadow-lg border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-accent-purple font-black text-xs">{d.code}</div>
                      <div>
                        <p className="font-black text-white text-sm">{d.startTime} - {d.endTime}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(d.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => removeDuty(d.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            
            {duties.length > 0 && (
               <button onClick={onNext} className="w-full py-5 bg-accent-purple text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                 Affiner mes préférences <ChevronRight size={16} />
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;