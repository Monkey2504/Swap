
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useApp } from '../context/AppContext';
import { Upload, Wand2, Download, Trash2, Loader2, Image as ImageIcon, Sparkles, MessageSquare, ChevronLeft } from 'lucide-react';

const ImageEditorPage: React.FC = () => {
  const { setError } = useApp();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!sourceImage || !prompt.trim()) return;
    setIsProcessing(true);
    
    try {
      // Instanciation directe ici pour garantir l'utilisation de la clé injectée
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: prompt }
          ]
        }
      });

      let foundImage = false;
      const candidates = (response as any).candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            setProcessedImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("L'IA n'a pas pu traiter l'image. Veuillez essayer un prompt différent.");
      }
    } catch (err: any) {
      console.error("Studio IA Error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        if (window.aistudio) await window.aistudio.openSelectKey();
      }
      setError(err.message || "Erreur lors du traitement IA");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `swapact-ia-edit-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-slide-up pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-sncb-blue uppercase italic tracking-tighter">
          Studio <span className="text-slate-400">IA</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Édition d'images par Gemini 2.5 Flash</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contrôles */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 bg-white border-slate-100 shadow-xl space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-sncb-blue uppercase tracking-widest italic flex items-center gap-2">
                <ImageIcon size={14} /> Image Source
              </label>
              {!sourceImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-16 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-300 hover:text-sncb-blue hover:border-sncb-blue hover:bg-blue-50/30 transition-all group"
                >
                  <Upload size={32} className="mb-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Importer une photo</span>
                </button>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-100 group shadow-inner">
                  <img src={sourceImage} className="w-full h-48 object-cover" alt="Source" />
                  <button 
                    onClick={() => { setSourceImage(null); setProcessedImage(null); }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-sncb-blue uppercase tracking-widest italic flex items-center gap-2">
                <MessageSquare size={14} /> Instructions IA
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: 'Ajoute un filtre vintage', 'Retire l'arrière-plan', 'Change la couleur en bleu SNCB'..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-sncb-blue/5 focus:border-sncb-blue transition-all min-h-[120px] resize-none"
              />
            </div>

            <button 
              disabled={!sourceImage || !prompt.trim() || isProcessing}
              onClick={processImage}
              className="w-full py-5 bg-sncb-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-sncb-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none group"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />}
              Générer la retouche
            </button>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
            <Sparkles className="text-sncb-blue shrink-0" size={20} />
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
              La technologie Nano Banana permet de modifier vos images à l'aide de commandes naturelles.
            </p>
          </div>
        </div>

        {/* Visualisation */}
        <div className="lg:col-span-8">
          <div className="w-full h-[600px] glass-card bg-slate-50 border-slate-100 flex flex-col items-center justify-center overflow-hidden relative shadow-2xl rounded-[48px]">
            {!processedImage ? (
              <div className="text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-100 mx-auto shadow-sm">
                  <Sparkles size={48} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Résultat IA</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Votre image modifiée apparaîtra ici</p>
                </div>
              </div>
            ) : (
              <>
                <img src={processedImage} className="w-full h-full object-contain" alt="IA Result" />
                <div className="absolute bottom-10 left-10 right-10 flex justify-center">
                  <button 
                    onClick={downloadImage}
                    className="px-10 py-5 bg-white text-sncb-blue border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-50 transition-all hover:scale-105"
                  >
                    <Download size={18} /> Télécharger l'image
                  </button>
                </div>
              </>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-sncb-blue/10 border-t-sncb-blue rounded-full animate-spin"></div>
                  <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sncb-blue" size={24} />
                </div>
                <p className="text-[10px] font-black text-sncb-blue uppercase tracking-[0.3em] animate-pulse">Calcul des pixels par l'IA...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorPage;
