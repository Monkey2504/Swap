
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty, CreateDutyDTO } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
// Add MapPin and Sparkles to resolve "Cannot find name" errors.
import { Upload, Camera, FileText, Trash2, Calendar, User, ChevronRight, X, MapPin, Sparkles } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, updateUserProfile, setRgpdConsent, setError, addTechLog } = useApp();
  const { removeDuty, addDuty } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isEditing, setIsEditing] = useState(!user?.onboardingCompleted);
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || DEPOTS[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setIsEditing(true);
    }
  }, [user]);

  const ensureApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    }
  };

  const processRosterData = async (base64Data: string, mimeType: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      await ensureApiKey();
      addTechLog(`Analyse IA (${mimeType})`, 'info', 'AI');
      const services = await parseRosterDocument(base64Data, mimeType);
      
      if (services && services.length > 0) {
        for (const s of services) {
          const newDuty: CreateDutyDTO = {
            user_id: user.id,
            code: s.code || "TOUR",
            type: (s.type as any) || 'IC',
            startTime: s.startTime || "00:00",
            endTime: s.endTime || "00:00",
            date: new Date().toISOString().split('T')[0],
            relations: [],
            compositions: [],
            destinations: []
          };
          await addDuty(newDuty);
        }
      } else {
        setError("Aucun service détecté. Vérifiez la qualité de l'image.");
      }
    } catch (err: any) {
      const msg = formatError(err);
      if (msg.includes("Requested entity was not found")) {
        // @ts-ignore
        if (window.aistudio) await window.aistudio.openSelectKey();
      }
      setError("Importation impossible : " + msg);
    } finally {
      setIsUploading(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && user) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
      await processRosterData(base64Data, 'image/jpeg');
      if (video.srcObject) (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setShowCamera(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const base64Data = result.split(',')[1];
      const mimeType = file.type;
      await processRosterData(base64Data, mimeType);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateUserProfile({
      firstName: editFirstName,
      lastName: editLastName,
      depot: editDepot,
      onboardingCompleted: true
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-slide-up pb-32">
      {showCamera && (
        <div className="fixed inset-0 glass-dark z-[100] flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-[40px] overflow-hidden border-[1px] border-white/20 apple-shadow shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[2px] border-white/30 pointer-events-none rounded-[40px]"></div>
          </div>
          <div className="mt-12 flex gap-6">
            <button onClick={() => setShowCamera(false)} className="bg-white/10 text-white px-8 py-4 rounded-full font-bold">Annuler</button>
            <button 
              onClick={capturePhoto} 
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-full border-[3px] border-slate-900"></div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* Left: Identity Card */}
        <div className="w-full md:w-80 bg-white rounded-[40px] p-8 apple-shadow border border-slate-100 flex flex-col items-center">
          <div className="w-32 h-32 bg-sncb-blue rounded-[32px] flex items-center justify-center text-white text-5xl font-bold shadow-2xl mb-6 shadow-sncb-blue/20">
            {user.firstName[0] || '?'}
          </div>
          
          {!isEditing ? (
            <div className="text-center space-y-2 w-full">
              <h2 className="text-2xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                <MapPin size={12} />
                {user.depot}
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-6 w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-all"
              >
                Modifier le profil
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full mt-2">
              <input 
                type="text" 
                value={editFirstName} 
                onChange={e => setEditFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm focus:outline-sncb-blue"
                placeholder="Prénom"
              />
              <input 
                type="text" 
                value={editLastName} 
                onChange={e => setEditLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm focus:outline-sncb-blue"
                placeholder="Nom"
              />
              <select 
                value={editDepot}
                onChange={e => setEditDepot(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm appearance-none"
              >
                {DEPOTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button 
                onClick={handleSaveProfile}
                className="w-full py-4 bg-sncb-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-sncb-blue/20"
              >
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions & Roster Import */}
        <div className="flex-grow space-y-10">
          <div className="bg-white rounded-[40px] p-10 apple-shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Importation Roster IA</h3>
                <p className="text-xs text-slate-400 font-medium">Détectez vos tours de service en un clic.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                 onClick={() => setShowCamera(true)}
                 disabled={isUploading}
                 className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-sncb-blue hover:bg-slate-50 transition-all group gap-4"
               >
                 <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-sncb-blue/5 group-hover:text-sncb-blue rounded-full flex items-center justify-center transition-all">
                   <Camera size={28} />
                 </div>
                 <div className="text-center">
                   <p className="font-bold text-slate-900">Scanner une photo</p>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Directement du papier</p>
                 </div>
               </button>

               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-slate-50 transition-all group gap-4"
               >
                 <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-emerald-500/5 group-hover:text-emerald-500 rounded-full flex items-center justify-center transition-all">
                   {isUploading ? <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={28} />}
                 </div>
                 <div className="text-center">
                   <p className="font-bold text-slate-900">Upload PDF / Image</p>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Fichier numérique</p>
                 </div>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
            </div>
          </div>

          {/* Planning Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-900">Tours de service actifs</h3>
              </div>
              <span className="text-[10px] font-bold text-sncb-blue bg-sncb-blue/5 px-3 py-1 rounded-full uppercase">
                {duties.length} Prestations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duties.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Aucun service importé.</p>
                </div>
              ) : (
                duties.map((duty) => (
                  <div key={duty.id} className="bg-white p-6 rounded-[28px] border border-slate-100 apple-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-xl font-bold text-sncb-blue">{duty.code}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{duty.type}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-900">{duty.startTime}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-lg font-bold text-slate-900">{duty.endTime || '--:--'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(duty.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDuty(duty.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {user.onboardingCompleted && (
              <button 
                onClick={onNext}
                className="w-full mt-6 py-5 bg-slate-900 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all"
              >
                Passer aux préférences
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
