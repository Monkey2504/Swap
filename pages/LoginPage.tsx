
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { formatError } from '../lib/api';
import { Settings, Eye, EyeOff, Lock, Mail, HelpCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-inter bg-sncb-blue">
      {/* Background Image: Specific Train with Transparent Blue Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://i.imgur.com/1iDqp8I.jpeg" 
          alt="SNCB Train Background" 
          className="w-full h-full object-cover scale-105"
        />
        {/* Transparent Blue Overlay */}
        <div className="absolute inset-0 bg-[#003399]/70 mix-blend-multiply backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#001a4d]/40 to-[#000a1a]"></div>
      </div>

      <div className="w-full max-w-sm px-6 relative z-10 animate-fade-in flex flex-col items-center">
        
        {/* LOGO B-SWAP */}
        <div className="relative mb-8 mt-4">
           {/* White Rotating Arrows */}
           <div className="absolute inset-0 -m-5 opacity-90 animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-none stroke-white stroke-[2.5]">
                <path d="M50 10 A40 40 0 0 1 90 50 M82 42 L90 50 L82 58" />
                <path d="M50 90 A40 40 0 0 1 10 50 M18 58 L10 50 L18 42" />
              </svg>
           </div>
           {/* The 'B' Logo Container */}
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative border-2 border-white/20">
              <div className="w-16 h-16 rounded-full border-[3px] border-sncb-blue flex items-center justify-center">
                <span className="text-sncb-blue text-4xl font-black italic tracking-tighter">B</span>
              </div>
           </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Connexion</h1>
          <p className="text-white/80 text-sm mt-3 px-4 leading-snug">
            Accédez à votre espace d'échange de services SNCB sécurisé.
          </p>
        </div>

        {/* INPUT CARD (Standard login, no SNCB ID mentioned) */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-[28px] shadow-2xl overflow-hidden mb-6 p-1 border border-white/40">
          <div className="p-4 pt-6 pb-6">
            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 rounded-xl text-[10px] text-red-600 font-bold uppercase text-center border border-red-100">
                {authError}
              </div>
            )}

            {showSettings ? (
              <div className="space-y-3 animate-slide-up">
                 <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 text-xs font-mono border-none" 
                  value={tempUrl} 
                  placeholder="URL Cloud"
                  onChange={e => setTempUrl(e.target.value)} 
                 />
                 <textarea 
                  rows={2} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 text-[10px] font-mono border-none" 
                  value={tempKey} 
                  placeholder="Clé Secrète"
                  onChange={e => setTempKey(e.target.value)} 
                 />
                 <button onClick={saveConfig} className="w-full py-3 bg-sncb-blue text-white rounded-xl font-bold text-xs uppercase tracking-widest">Enregistrer</button>
                 <button onClick={() => setShowSettings(false)} className="w-full text-[10px] font-bold text-slate-400 uppercase">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-0 divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="bg-white p-3.5 px-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Adresse E-mail</label>
                    <input
                      type="email"
                      placeholder="votre.nom@sncb.be"
                      className="w-full bg-transparent outline-none font-semibold text-slate-900 text-base"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="bg-white p-3.5 px-5 flex items-center">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock size={12} className="text-slate-300" />
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mot de passe</label>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full bg-transparent outline-none font-semibold text-slate-900 text-base placeholder:text-slate-200"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4.5 bg-[#2162c1] hover:bg-sncb-blue text-white rounded-2xl font-bold text-base shadow-lg shadow-sncb-blue/20 active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {loading ? 'Connexion...' : isSignUp ? "S'inscrire" : "Se Connecter"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* OR SEPARATOR */}
        <div className="w-full flex items-center gap-4 text-white/30 my-2 px-2">
          <div className="h-[1px] flex-grow bg-white/20"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">ou</span>
          <div className="h-[1px] flex-grow bg-white/20"></div>
        </div>

        {/* SOCIAL BUTTONS */}
        <div className="w-full space-y-3 mt-4">
          <button className="w-full py-4 bg-white rounded-2xl flex items-center px-6 gap-4 shadow-xl active:scale-95 transition-all">
             <svg viewBox="0 0 24 24" className="w-5 h-5">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             <span className="text-sm font-bold text-slate-600">Continuer avec Google</span>
          </button>

          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full py-4 bg-white rounded-2xl flex items-center px-6 gap-4 shadow-xl active:scale-95 transition-all"
          >
             <Mail size={20} className="text-sncb-blue" />
             <span className="text-sm font-bold text-slate-600">
               {isSignUp ? "Déjà inscrit ? Connexion" : "Continuer avec E-mail"}
             </span>
          </button>
        </div>

        {/* FOOTER LINKS */}
        <div className="flex flex-col items-center gap-6 mt-12 pb-8">
          <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <HelpCircle size={14} />
            Besoin d'aide ?
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-white/10 hover:text-white/30 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
