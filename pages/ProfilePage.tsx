
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty, CreateDutyDTO } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Camera, FileText, Trash2, Calendar, User, ChevronRight, X, MapPin, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, updateUserProfile, setError, addTechLog, setSuccessMessage } = useApp();
  const { removeDuty, addDuty } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!user?.onboardingCompleted);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || DEPOTS[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setIsEditing(true);
    }
  }, [user]);

  // Logique d'activation de la caméra
  useEffect(() => {
    const startCamera = async () => {
      if (showCamera) {
        setCameraLoading(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, // Préférer la caméra arrière sur mobile
            audio: false 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Erreur caméra:", err);
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
          setShowCamera(false);
        } finally {
          setCameraLoading(false);
        }
      } else {
        stopCamera();
      }
    };

    startCamera();

    return () => stopCamera();
  }, [showCamera]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

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
    setUploadProgress("Initialisation de l'analyse IA...");
    try {
      await ensureApiKey();
      addTechLog(`Analyse IA initiée (${mimeType})`, 'info', 'AI');
      
      setUploadProgress("OCR & Analyse des tableaux SNCB...");
      const services = await parseRosterDocument(base64Data, mimeType);
      
      if (services && services.length > 0) {
        setUploadProgress(`Traitement de ${services.length} prestations...`);
        for (const s of services) {
          const newDuty: CreateDutyDTO = {
            user_id: user.id,
            code: s.code || "TOUR",
            type: (s.type as any) || 'IC',
            startTime: s.startTime || "00:00",
            endTime: s.endTime || "00:00",
            date: s.date || new Date().toISOString().split('T')[0],
            relations: [],
            compositions: [],
            destinations: s.destinations || []
          };
          await addDuty(newDuty);
        }
        setSuccessMessage(`${services.length} services ajoutés avec succès à votre planning.`);
      } else {
        setError("L'IA n'a détecté aucun tour de service valide dans ce document.");
      }
    } catch (err: any) {
      setError("Importation échouée : " + formatError(err));
    } finally {
      setIsUploading(false);
      setUploadProgress("");
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
      
      stopCamera();
      setShowCamera(false);
      
      await processRosterData(base64Data, 'image/jpeg');
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
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-[40px] overflow-hidden border-[1px] border-white/20 apple-shadow shadow-2xl bg-black">
            {cameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-500 ${cameraLoading ? 'opacity-0' : 'opacity-100'}`} 
            />
            <div className="absolute inset-0 border-[2px] border-white/30 pointer-events-none rounded-[40px] m-4"></div>
            <div className="absolute top-8 left-0 right-0 text-center">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.3em]">Cadrer le tour de service</p>
            </div>
          </div>
          
          <div className="mt-12 flex items-center gap-10">
            <button 
              onClick={() => setShowCamera(false)} 
              className="w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
            >
              <X size={24} />
            </button>
            
            <button 
              onClick={capturePhoto} 
              disabled={cameraLoading}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
            >
              <div className="w-20 h-20 rounded-full border-[3px] border-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full scale-0 group-active:scale-100 transition-transform"></div>
              </div>
            </button>

            <div className="w-14"></div> {/* Spacer pour équilibrer */}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* Identité */}
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
              <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm outline-none focus:ring-2 focus:ring-sncb-blue/20" placeholder="Prénom" />
              <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm outline-none focus:ring-2 focus:ring-sncb-blue/20" placeholder="Nom" />
              <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-sm appearance-none">
                {DEPOTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button onClick={handleSaveProfile} className="w-full py-4 bg-sncb-blue text-white rounded-xl font-bold text-sm shadow-lg shadow-sncb-blue/20">Enregistrer</button>
            </div>
          )}
        </div>

        {/* Zone Import & Roster */}
        <div className="flex-grow space-y-10 w-full">
          <div className="bg-white rounded-[40px] p-10 apple-shadow border border-slate-100 overflow-hidden relative">
            {isUploading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-sncb-blue rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Analyse en cours...</h3>
                <p className="text-slate-500 font-medium text-sm max-w-xs">{uploadProgress}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chargement Roster Premium</h3>
                <p className="text-xs text-slate-400 font-medium">Glissez un PDF ou prenez une photo de votre planning papier.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button onClick={() => setShowCamera(true)} disabled={isUploading} className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-sncb-blue hover:bg-slate-50 transition-all group gap-4">
                 <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-sncb-blue/5 group-hover:text-sncb-blue rounded-full flex items-center justify-center transition-all">
                   <Camera size={28} />
                 </div>
                 <div className="text-center">
                   <p className="font-bold text-slate-900">Caméra (Papier)</p>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Scan intelligent</p>
                 </div>
               </button>

               <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-slate-50 transition-all group gap-4">
                 <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-emerald-500/5 group-hover:text-emerald-500 rounded-full flex items-center justify-center transition-all">
                   <Upload size={28} />
                 </div>
                 <div className="text-center">
                   <p className="font-bold text-slate-900">Fichier (PDF / JPG)</p>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Extraction multi-jours</p>
                 </div>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
            </div>
          </div>

          {/* Liste des prestations */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-900">Planning Actuel</h3>
              </div>
              <div className="flex items-center gap-2">
                 {dutiesLoading && <div className="w-4 h-4 border-2 border-slate-200 border-t-sncb-blue rounded-full animate-spin"></div>}
                 <span className="text-[10px] font-bold text-sncb-blue bg-sncb-blue/5 px-3 py-1 rounded-full uppercase">
                   {duties.length} Services détectés
                 </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {duties.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">Aucun service importé. Utilisez les boutons ci-dessus.</p>
                </div>
              ) : (
                duties.map((duty) => (
                  <div key={duty.id} className="bg-white p-6 rounded-[28px] border border-slate-100 apple-shadow flex items-center justify-between group transition-all hover:border-sncb-blue/20">
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(duty.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          {duty.destinations && duty.destinations.length > 0 && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[100px]">
                              {duty.destinations[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeDuty(duty.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {user.onboardingCompleted && duties.length > 0 && (
              <button onClick={onNext} className="w-full mt-6 py-5 bg-slate-900 text-white rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-[0.99]">
                Configurer mes préférences de swap
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
