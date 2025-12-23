
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig, runDiagnostic } from '../lib/supabase';
import { formatError } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const config = getSupabaseConfig();
  const [tempUrl, setTempUrl] = useState(config.url);
  const [tempKey, setTempKey] = useState(config.key);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setAuthError("Configuration Cloud manquante.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      if (data.user && onLoginSuccess) {
        await onLoginSuccess(data.user);
      }
    } catch (error: any) {
      setAuthError(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = () => {
    localStorage.setItem('sncb_supabase_url', tempUrl.trim());
    localStorage.setItem('sncb_supabase_key', tempKey.trim());
    window.location.reload();
  };

  const checkStatus = async () => {
    const diag = await runDiagnostic();
    alert(diag.message + (diag.ok ? "" : "\n\nAssurez-vous d'avoir exécuté le script SQL dans Supabase."));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-inter relative overflow-hidden">
      {/* Background subtil */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] aspect-square bg-sncb-blue/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] aspect-square bg-sncb-yellow/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-white rounded-[56px] shadow-[0_30px_60px_-15px_rgba(0,51,153,0.1)] p-12 border border-white animate-fadeIn">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-sncb-blue rounded-[36px] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
              <span className="text-5xl font-black italic">B</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              SWAP<span className="text-sncb-blue">ACT</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.5em] mt-4 opacity-60 italic">Plateforme Collaborative</p>
          </div>

          {authError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold animate-pulse">
              ⚠️ {authError}
            </div>
          )}

          {showSettings ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Serveur Cloud</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono" value={tempUrl} onChange={e => setTempUrl(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Clé Publique</label>
                  <textarea rows={3} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono break-all" value={tempKey} onChange={e => setTempKey(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={saveConfig} className="py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Mettre à jour</button>
                  <button onClick={checkStatus} className="py-5 bg-sncb-blue text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Test Flux</button>
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full text-[10px] font-black text-slate-400 uppercase py-2">Retour à la connexion</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="nom@sncb.be"
                  className="w-full px-8 py-5 rounded-[30px] bg-slate-50 border-2 border-transparent focus:border-sncb-blue/20 focus:bg-white outline-none font-bold text-sm transition-all shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full px-8 py-5 rounded-[30px] bg-slate-50 border-2 border-transparent focus:border-sncb-blue/20 focus:bg-white outline-none font-bold text-sm transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-black py-6 rounded-[32px] shadow-2xl text-[12px] uppercase tracking-[0.3em] transition-all transform sncb-button-volume ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Connexion...' : isSignUp ? "S'enregistrer" : "Entrer dans l'app"}
              </button>
              
              <div className="flex flex-col items-center gap-6 pt-4">
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[11px] font-black text-sncb-blue uppercase tracking-widest hover:underline underline-offset-8 decoration-2">
                  {isSignUp ? "J'ai déjà mon accès" : "Première connexion ?"}
                </button>
                
                <div className="flex items-center gap-4">
                  {email === 'admin@admin' && (
                    <div className="px-5 py-2 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                      Console Superviseur
                    </div>
                  )}
                  <button type="button" onClick={() => setShowSettings(true)} className="text-[10px] font-black text-slate-300 uppercase hover:text-slate-500 transition-colors">
                    ⚙️ Paramètres Cloud
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center mt-12 text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">SNCB DSI • Version 2.5</p>
      </div>
    </div>
  );
};

export default LoginPage;
