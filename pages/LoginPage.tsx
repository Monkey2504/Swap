
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig } from '../lib/supabase';
import { formatError } from '../lib/api';
import { Settings, Eye, EyeOff, Lock, HelpCircle, Loader2, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
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
      setAuthError("Configuration Cloud SNCB manquante.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              firstName: email.split('.')[0] || 'Agent',
              lastName: 'SNCB',
              depot: 'Bruxelles-Midi'
            }
          }
        });

        if (error) throw error;
        
        if (data.user && !data.session) {
          setSignUpSuccess(true);
        } else if (data.user && data.session && onLoginSuccess) {
          await onLoginSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user && onLoginSuccess) {
          await onLoginSuccess(data.user);
        }
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
      {/* Background avec Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://i.imgur.com/1iDqp8I.jpeg" 
          alt="SNCB Train Background" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-[#003399]/75 mix-blend-multiply backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#001a4d]/40 to-[#000a1a]"></div>
      </div>

      <div className="w-full max-w-md px-6 relative z-10 animate-fade-in flex flex-col items-center">
        
        {/* Logo Animation */}
        <div className="relative mb-8">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative border-4 border-white/20">
              <div className="w-16 h-16 rounded-full border-[3px] border-sncb-blue flex items-center justify-center">
                <span className="text-sncb-blue text-4xl font-black italic tracking-tighter">B</span>
              </div>
           </div>
        </div>

        {signUpSuccess ? (
          <div className="w-full bg-white rounded-[40px] shadow-2xl p-10 text-center animate-slide-up border border-white">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 italic">Email envoyé !</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre accès.
            </p>
            <button 
              onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
              className="w-full py-4 bg-sncb-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-sncb-blue/20"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/40">
            
            {/* TABS NAVIGATION */}
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => { setIsSignUp(false); setAuthError(null); }}
                className={`flex-1 py-5 flex items-center justify-center gap-2 transition-all ${!isSignUp ? 'border-b-4 border-sncb-blue bg-white text-sncb-blue' : 'text-slate-400 bg-slate-50/50 hover:bg-slate-50'}`}
              >
                <LogIn size={18} />
                <span className="font-black text-xs uppercase tracking-widest">Connexion</span>
              </button>
              <button 
                onClick={() => { setIsSignUp(true); setAuthError(null); }}
                className={`flex-1 py-5 flex items-center justify-center gap-2 transition-all ${isSignUp ? 'border-b-4 border-sncb-blue bg-white text-sncb-blue' : 'text-slate-400 bg-slate-50/50 hover:bg-slate-50'}`}
              >
                <UserPlus size={18} />
                <span className="font-black text-xs uppercase tracking-widest">S'inscrire</span>
              </button>
            </div>

            <div className="p-8 pt-10">
              {authError && (
                <div className="mb-6 p-3 bg-red-50 rounded-xl text-[10px] text-red-600 font-black uppercase text-center border border-red-100 animate-pulse">
                  {authError}
                </div>
              )}

              {showSettings ? (
                <div className="space-y-4 animate-slide-up">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Config Cloud SNCB</h3>
                   <input 
                    type="text" 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 text-xs font-mono border-none focus:ring-2 focus:ring-sncb-blue/10" 
                    value={tempUrl} 
                    placeholder="URL Supabase"
                    onChange={e => setTempUrl(e.target.value)} 
                   />
                   <textarea 
                    rows={2} 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 text-[10px] font-mono border-none focus:ring-2 focus:ring-sncb-blue/10" 
                    value={tempKey} 
                    placeholder="Clé Anon"
                    onChange={e => setTempKey(e.target.value)} 
                   />
                   <button onClick={saveConfig} className="w-full py-4 bg-sncb-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sncb-blue/10">Sauvegarder</button>
                   <button onClick={() => setShowSettings(false)} className="w-full text-[10px] font-black text-slate-300 uppercase py-2">Fermer</button>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group focus-within:border-sncb-blue/30 transition-all">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">E-mail Professionnel</label>
                      <input
                        type="email"
                        placeholder="nom.prenom@sncb.be"
                        className="w-full bg-transparent outline-none font-bold text-slate-900 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center group focus-within:border-sncb-blue/30 transition-all">
                      <div className="flex-grow">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Mot de passe</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full bg-transparent outline-none font-bold text-slate-900 text-sm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-slate-300 hover:text-sncb-blue transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-sncb-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-sncb-blue/30 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      isSignUp ? "Créer mon compte" : "Se Connecter"
                    )}
                  </button>

                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {isSignUp ? "Accès réservé aux agents SNCB" : "Sécurisé par SNCB Cloud Identity"}
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 mt-12 pb-8">
          <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-black uppercase tracking-widest italic">
            <HelpCircle size={14} />
            Support Technique
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 text-white/10 hover:text-white/40 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
