
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';
import { formatError } from '../lib/api';
import { DEPOTS } from '../constants';
import { Upload, Camera, Trash2, Calendar, ChevronRight, X, MapPin, Loader2, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, updateUserProfile, setError, setSuccessMessage } = useApp();
  const { removeDuty, addDuty } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!user?.onboardingCompleted);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "parsing" | "saving">("idle");
  const [stats, setStats] = useState({ count: 0 });
  
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editDepot, setEditDepot] = useState(user?.depot || DEPOTS[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setShowCamera(true);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Erreur caméra.");
      setShowCamera(false);
    } finally { setCameraLoading(false); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const processRosterData = async (base64Data: string, mimeType: string) => {
    if (!user) return;
    setIsUploading(true);
    setUploadStep("uploading");
    
    try {
      setUploadStep("parsing");
      const services = await parseRosterDocument(base64Data, mimeType);
      
      if (services?.length) {
        setUploadStep("saving");
        setStats({ count: services.length });
        
        // Batch add duties
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
        setSuccessMessage(`Digitalisation réussie : ${services.length} services importés.`);
      } else {
        setError("Aucun service détecté sur ce document.");
      }
    } catch (err) { 
      setError(formatError(err)); 
    } finally { 
      setIsUploading(false); 
      setUploadStep("idle");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processRosterData((reader.result as string).split(',')[1], file.type);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Camera Modal Overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-xl">
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-[48px] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
            {cameraLoading && <Loader2 className="absolute inset-0 m-auto text-white animate-spin" />}
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 m-8 border-2 border-white/20 rounded-[40px] pointer-events-none"></div>
          </div>
          <div className="mt-12 flex items-center gap-8">
            <button onClick={stopCamera} className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center transition-transform active:scale-90"><X size={24} /></button>
            <button onClick={() => {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              if (canvas && video) {
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                processRosterData(canvas.toDataURL('image/jpeg').split(',')[1], 'image/jpeg');
                stopCamera();
              }
            }} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-white/20 active:scale-90 transition-all">
              <div className="w-12 h-12 bg-sncb-blue rounded-full"></div>
            </button>
            <div className="w-16 h-16"></div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Profile Card */}
        <div className="w-full lg:w-80 space-y-8">
          <div className="bg-white rounded-[48px] p-10 shadow-2xl border border-white text-center">
            <div className="w-32 h-32 bg-sncb-blue rounded-[40px] flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 shadow-xl relative group">
              {user?.firstName?.[0]}
              <div className="absolute -bottom-2 -right-2 bg-sncb-yellow text-sncb-blue w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                <User size={20} />
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Identification</label>
                  <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-sncb-blue/10" placeholder="Prénom" />
                  <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-sncb-blue/10" placeholder="Nom" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Attache Administrative</label>
                  <select value={editDepot} onChange={e => setEditDepot(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-sncb-blue/10">
                    {DEPOTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={() => { updateUserProfile({firstName: editFirstName, lastName: editLastName, depot: editDepot, onboardingCompleted: true}); setIsEditing(false); }} className="w-full py-5 bg-sncb-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-sncb-blue/10 mt-4 active:scale-95 transition-transform">SAUVEGARDER</button>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{user?.firstName} {user?.lastName}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sncb-blue/5 text-sncb-blue rounded-full text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={10} /> {user?.depot}
                </div>
                <button onClick={() => setIsEditing(true)} className="w-full py-4 mt-8 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:text-sncb-blue transition-colors">Modifier Profil</button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow space-y-12">
          {/* Import Card */}
          <div className="bg-white rounded-[48px] p-10 shadow-2xl border border-white relative overflow-hidden">
            {isUploading && (
              <div className="absolute inset-0 bg-white/95 z-20 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn p-8">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className={`absolute inset-0 border-4 border-sncb-blue rounded-full border-t-transparent animate-spin`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="text-sncb-blue" size={32} />
                  </div>
                </div>
                
                <h4 className="text-xl font-black text-slate-900 mb-2 italic">Analyse du Roster Mensuel</h4>
                
                <div className="w-full max-w-xs space-y-3">
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${uploadStep !== 'uploading' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <CheckCircle2 size={12} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${uploadStep === 'uploading' ? 'text-sncb-blue animate-pulse' : 'text-slate-400'}`}>Chargement Document</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${['saving'].includes(uploadStep) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <CheckCircle2 size={12} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${uploadStep === 'parsing' ? 'text-sncb-blue animate-pulse' : 'text-slate-400'}`}>Extraction IA des Services</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${uploadStep === 'idle' && stats.count > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <CheckCircle2 size={12} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${uploadStep === 'saving' ? 'text-sncb-blue animate-pulse' : 'text-slate-400'}`}>Synchronisation ({stats.count} jours)</span>
                   </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight italic">Digitalisation Mensuelle</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">IA Spécialisée Grilles SNCB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={startCamera} className="p-10 rounded-[40px] border-2 border-dashed border-slate-100 hover:border-sncb-blue hover:bg-slate-50 transition-all flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-sncb-blue group-hover:text-white rounded-full flex items-center justify-center text-slate-300 transition-all">
                  <Camera size={32} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">Scan Roster Papier</span>
              </button>
              
              <button onClick={() => fileInputRef.current?.click()} className="p-10 rounded-[40px] border-2 border-dashed border-slate-100 hover:border-emerald-500 hover:bg-slate-50 transition-all flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-emerald-500 group-hover:text-white rounded-full flex items-center justify-center text-slate-300 transition-all">
                  <Upload size={32} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">PDF / Capture d'écran</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
            </div>
            
            <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
               <AlertCircle size={18} className="text-sncb-blue shrink-0 mt-0.5" />
               <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                 <span className="text-slate-900">Conseil Premium :</span> Pour une fluidité maximale, assurez-vous que tout le mois est visible. L'IA traitera automatiquement les 31 jours et créera les prestations correspondantes.
               </p>
            </div>
          </div>

          {/* Duties List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-sncb-blue" />
                <h3 className="font-black text-slate-900 tracking-tight italic">Planning Détecté</h3>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">{duties.length} SERVICES</span>
            </div>

            {dutiesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-slate-200" size={40} />
              </div>
            ) : duties.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-slate-200">
                <p className="text-slate-300 font-bold italic">Aucun service importé pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {duties.map(d => (
                  <div key={d.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-white flex items-center justify-between group hover:border-sncb-blue/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex flex-col items-center justify-center border border-slate-100 transition-colors group-hover:bg-sncb-blue/5">
                        <span className="text-lg font-black text-sncb-blue leading-none">{d.code}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{d.type}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-black text-slate-900 tracking-tight">{d.startTime} - {d.endTime}</p>
                          {d.destinations && d.destinations.length > 0 && (
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                              {d.destinations[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {new Date(d.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'})}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeDuty(d.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl md:opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {duties.length > 0 && (
            <div className="flex justify-center pt-8">
              <button 
                onClick={onNext}
                className="px-12 py-5 bg-sncb-blue text-white rounded-3xl font-black text-sm shadow-2xl shadow-sncb-blue/30 flex items-center gap-4 hover:bg-[#002a7a] transition-all"
              >
                CONFIGURER MES PRÉFÉRENCES
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
