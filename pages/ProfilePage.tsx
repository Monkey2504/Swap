
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useDuties } from '../hooks/useDuties';
import { parseRosterDocument } from '../services/geminiService';
import { Duty, CreateDutyDTO } from '../types';
import { formatError } from '../lib/api';

const ProfilePage: React.FC<{ onNext: () => void; duties: Duty[]; dutiesLoading: boolean }> = ({ onNext, duties, dutiesLoading }) => {
  const { user, setRgpdConsent, setError, addTechLog } = useApp();
  const { removeDuty, addDuty } = useDuties(user?.id);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processRosterData = async (base64Data: string, mimeType: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      addTechLog(`Lancement de l'analyse OCR (${mimeType}) via Gemini...`, 'info', 'AI');
      const services = await parseRosterDocument(base64Data, mimeType);
      
      if (services && services.length > 0) {
        let importedCount = 0;
        for (const s of services) {
          const newDuty: CreateDutyDTO = {
            user_id: user.id,
            code: s.code || "ERR",
            type: (s.type as any) || 'IC',
            startTime: s.startTime || "00:00",
            endTime: s.endTime || "00:00",
            date: new Date().toISOString().split('T')[0],
            relations: [],
            compositions: [],
            destinations: []
          };
          await addDuty(newDuty);
          importedCount++;
        }
        addTechLog(`${importedCount} services importés`, 'info', 'AI');
        alert(`${importedCount} prestations ajoutées à votre planning.`);
      } else {
        setError("Gemini n'a détecté aucun service valide dans ce document.");
      }
    } catch (err: any) {
      setError("Erreur d'importation : " + formatError(err));
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
      
      setRgpdConsent(true);
      await processRosterData(base64Data, mimeType);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-12 animate-fadeIn pb-40">
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-[60px] overflow-hidden border-[10px] border-sncb-yellow shadow-[0_0_120px_rgba(255,210,0,0.25)]">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-full h-full border-[1px] border-white/20"></div>
               <div className="absolute top-1/2 left-0 w-full h-[2px] bg-sncb-yellow/50 animate-pulse"></div>
            </div>
          </div>
          <div className="mt-16 flex gap-10">
            <button onClick={() => setShowCamera(false)} className="px-10 py-5 bg-white/10 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest">Fermer</button>
            <button 
              onClick={capturePhoto} 
              disabled={isUploading}
              className="w-24 h-24 bg-sncb-yellow rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
            >
              <span className="text-4xl">{isUploading ? '⏳' : '📸'}</span>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Profile Volume Card */}
      <div className="bg-white p-10 rounded-[56px] sncb-card border-none flex items-center gap-10 shadow-[0_30px_60px_-15px_rgba(0,51,153,0.1)]">
        <div className="w-28 h-28 rounded-[40px] bg-sncb-blue flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-sncb-blue/30 transform rotate-3">
          {user.firstName[0]}
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{user.firstName}</h2>
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase bg-sncb-blue/5 text-sncb-blue px-4 py-2 rounded-full tracking-wider">{user.depot}</span>
            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-4 py-2 rounded-full tracking-wider">Série {user.series}</span>
          </div>
        </div>
      </div>

      {/* AI Import Actions */}
      <div className="bg-slate-900 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-sncb-blue/20 rounded-full blur-[100px] group-hover:scale-125 transition-all duration-1000"></div>
        <div className="relative z-10">
          <p className="text-sncb-yellow font-black text-[11px] uppercase tracking-[0.4em] mb-4">Intégration Roster</p>
          <p className="text-2xl font-bold leading-tight mb-10 max-w-[320px]">Importez votre planning via photo ou fichier PDF.</p>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => {
                setRgpdConsent(true);
                setShowCamera(true);
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                  .then(s => videoRef.current && (videoRef.current.srcObject = s));
              }}
              disabled={isUploading}
              className="w-full py-7 sncb-button-volume font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 disabled:opacity-50"
            >
              Scanner avec Caméra 📸
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-7 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-[28px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 transition-all disabled:opacity-50"
            >
              {isUploading ? 'Analyse en cours...' : 'Importer PDF / Image 📂'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,.pdf" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      {/* Services List - Ticket Style */}
      <div className="space-y-8">
        <div className="flex justify-between items-center px-6">
          <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Prestations Actives</h3>
          <span className="text-[10px] font-black text-sncb-blue bg-sncb-blue/5 px-4 py-1.5 rounded-full">
            {dutiesLoading ? 'Chargement...' : `${duties.length} tours`}
          </span>
        </div>

        <div className="space-y-8">
          {duties.length === 0 && !dutiesLoading ? (
            <div className="py-24 text-center bg-white rounded-[56px] sncb-card border-dashed border-2 border-slate-100 shadow-none">
              <div className="text-6xl mb-8 opacity-20">📅</div>
              <p className="text-slate-400 font-bold italic">Aucun service importé pour le moment.</p>
            </div>
          ) : (
            duties.map((duty, idx) => (
              <div 
                key={duty.id} 
                className="bg-white rounded-[52px] overflow-hidden sncb-card border-none flex flex-col digital-ticket animate-slideIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="p-10 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex flex-col items-center justify-center border border-slate-100 shadow-inner">
                      <span className="text-2xl font-black text-sncb-blue">{duty.code}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 mt-1">{duty.type}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{duty.startTime}</span>
                        <span className="text-slate-200 text-2xl font-light">➔</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{duty.endTime || '--:--'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-3 py-1 bg-slate-50 rounded-full inline-block">
                        {new Date(duty.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeDuty(duty.id)} 
                    className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm active:scale-90"
                  >
                    ✕
                  </button>
                </div>
                <div className="px-12 py-6 bg-slate-50/50 border-t border-dashed border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siège de service : {duty.depot || user.depot}</span>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>)}
                  </div>
                </div>
              </div>
            ))
          )}
          {dutiesLoading && <div className="p-10 text-center text-slate-300 font-black uppercase text-[10px] animate-pulse">Mise à jour du planning...</div>}
        </div>
      </div>

      <button 
        onClick={onNext} 
        className="w-full py-8 sncb-button-blue text-white rounded-[36px] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all mt-10"
      >
        Préférences de Matching ➔
      </button>
    </div>
  );
};

export default ProfilePage;
