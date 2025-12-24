
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Camera, Trash2, Calendar, ChevronRight, X, MapPin, Loader2, User, FileText, CheckCircle2, AlertCircle, LogOut, Train } from 'lucide-react';

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
        <Loader2 className="animate-spin text-sky-500" />
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

  // UI ONBOARDING - REVISITÉE POUR ÊTRE MOINS AGRESSIVE
  if (!user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <img src="https://i.imgur.com/ChBOn7U.jpeg" className="w-full h-full object-cover scale-110 blur-md" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl glass-card bg-slate-900/80 p-12 border border-white/10 animate-slide-up shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
           <div className="text-center mb-12">
             <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 italic shadow-2xl">
               <Train size={40} className="opacity-80" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Activation <span className="text-sky-400">Profil</span></h1>
             <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Identifiez-vous auprès de vos collègues</p>
           </div>

           <div className="space-y-8 mb-12">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Prénom</label>
                  <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 font-bold text-sm text-white focus:border-sky-500/50 transition-all" placeholder="Ex: Marc" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nom</label>
                  <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 font-bold text-sm text-white focus:border-sky-500/50 transition-all" placeholder="Ex: Lambert" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Votre Dépôt</label>
                <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 font-bold text-sm text-white focus:border-sky-500/50 transition-all appearance-none cursor-pointer">
                  <option value="" disabled className="bg-slate-900">Choisir mon dépôt...</option>
                  {DEPOTS.map(d => <option key={d.code} value={d.code} className="bg-slate-900">{d.name}</option>)}
                </select>
              </div>
           </div>

           <button 
             onClick={handleActivateAccount}
             disabled={!isProfileComplete || isActivating}
             className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${
               isProfileComplete && !isActivating 
               ? 'bg-white text-slate-900 hover:scale-[1.02] shadow-white/5' 
               : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
             }`}
           >
             {isActivating ? <Loader2 size={20} className="animate-spin" /> : "Finaliser mon inscription"}
             {!isActivating && <ChevronRight size={18} />}
           </button>

           <button onClick={logout} className="w-full py-4 mt-6 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">Déconnexion</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-inter">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 space-y-8">
          <div className="glass-card p-10 shadow-2xl border border-gray-100 text-center group bg-white">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[30px] flex items-center justify-center text-sncb-blue text-3xl font-black mx-auto mb-8 shadow-sm relative transition-transform group-hover:scale-105 border border-gray-100">
              {user.firstName?.[0] || 'A'}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-800" placeholder="Prénom" />
                <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-800" placeholder="Nom" />
                <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-800">
                  {DEPOTS.map(d => <option key={d.code} value={d.code} className="bg-white">{d.name}</option>)}
                </select>
                <button onClick={handleUpdateProfile} className="w-full py-3 bg-sncb-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Enregistrer</button>
                <button onClick={() => setIsEditing(false)} className="w-full py-2 text-[10px] font-black text-slate-500 uppercase">Annuler</button>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-sncb-blue">{user.firstName} {user.lastName}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-sncb-blue rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  <MapPin size={10} /> {user.depot || 'Dépôt non défini'}
                </div>
                <button onClick={() => setIsEditing(true)} className="w-full py-3 mt-8 bg-gray-50 text-slate-500 rounded-xl font-black text-[10px] tracking-widest uppercase hover:text-sncb-blue transition-colors border border-gray-100">Modifier mon profil</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow space-y-12">
          <div className="glass-card p-10 shadow-2xl border border-gray-100 relative overflow-hidden bg-white">
            {isUploading && (
              <div className="absolute inset-0 bg-white/90 z-20 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
                <div className="w-12 h-12 border-4 border-sncb-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black text-sncb-blue uppercase tracking-widest">Numérisation en cours...</p>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-50 text-sncb-blue rounded-2xl flex items-center justify-center italic font-black text-xl border border-blue-100">B</div>
              <div>
                <h3 className="text-xl font-black tracking-tight italic uppercase text-sncb-blue">Mon Roster</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Importation pour le matching</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => fileInputRef.current?.click()} className="p-10 rounded-[32px] border-2 border-dashed border-gray-200 hover:border-sncb-blue/50 hover:bg-blue-50/30 transition-all flex flex-col items-center gap-5 group">
                <Upload size={32} className="text-slate-300 group-hover:text-sncb-blue transition-colors" />
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Scanner PDF / Image</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => processRosterData((reader.result as string).split(',')[1], file.type);
                  reader.readAsDataURL(file);
                }
              }} className="hidden" />
              
              <div className="p-10 bg-gray-50 rounded-[32px] flex flex-col items-center justify-center text-center gap-2 border border-gray-100">
                <p className="text-3xl font-black text-sncb-blue">{duties.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prestations chargées</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {dutiesLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sncb-blue" size={40} /></div>
            ) : duties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duties.slice(0, 6).map(d => (
                  <div key={d.id} className="glass-card p-6 shadow-sm border border-gray-100 bg-white flex items-center justify-between group hover:border-sncb-blue/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-sncb-blue font-black text-sm border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">{d.code}</div>
                      <div>
                        <p className="font-black text-gray-800 text-base">{d.startTime} - {d.endTime}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(d.date).toLocaleDateString('fr-BE')}</p>
                      </div>
                    </div>
                    <button onClick={() => removeDuty(d.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            )}
            
            {duties.length > 0 && (
               <button onClick={onNext} className="w-full py-6 bg-sncb-blue text-white rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform">
                 Configurer mes préférences <ChevronRight size={18} />
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
