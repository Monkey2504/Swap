
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig, runDiagnostic } from '../lib/supabase';
import { formatError } from '../lib/api';
import { Settings, ShieldCheck, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-sncb-blue rounded-[24px] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-sncb-blue/20">
            <span className="text-4xl font-bold tracking-tighter">B</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 heading-hero">
            Swap<span className="text-sncb-blue">Act</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium">Bourse d'échange intelligente SNCB</p>
        </div>

        <div className="bg-white p-2 rounded-[32px] apple-shadow border border-slate-100">
           <div className="p-8">
              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-semibold text-center">
                  {authError}
                </div>
              )}

              {showSettings ? (
                <div className="space-y-6 animate-fadeIn">
                   <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-3 mb-1 block">SNCB Cloud URL</label>
                        <input type="text" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono" value={tempUrl} onChange={e => setTempUrl(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-3 mb-1 block">API Public Key</label>
                        <textarea rows={3} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono" value={tempKey} onChange={e => setTempKey(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={saveConfig} className="py-4 bg-slate-900 text-white rounded-xl font-bold text-xs">Sauvegarder</button>
                        <button onClick={async () => alert((await runDiagnostic()).message)} className="py-4 bg-sncb-blue text-white rounded-xl font-bold text-xs">Diagnostic</button>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="w-full text-[10px] font-bold text-slate-400 uppercase mt-2">Retour</button>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-6">
                   <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="nom@sncb.be"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-sncb-blue/30 outline-none font-semibold text-sm transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Mot de passe"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-sncb-blue/30 outline-none font-semibold text-sm transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                   </div>

                   <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-sncb-blue text-white rounded-2xl font-bold text-sm shadow-xl shadow-sncb-blue/20 flex items-center justify-center gap-3 transition-all hover:bg-[#002a7a] active:scale-95 disabled:opacity-50"
                   >
                     {loading ? 'Connexion...' : isSignUp ? "S'inscrire" : "Se connecter"}
                     {!loading && <ArrowRight size={18} />}
                   </button>

                   <div className="flex flex-col items-center gap-6 pt-4">
                      <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-sncb-blue hover:underline">
                        {isSignUp ? "Déjà un compte ?" : "Créer un accès"}
                      </button>
                      
                      <button type="button" onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase hover:text-slate-500 transition-colors">
                        <Settings size={12} />
                        Cloud Settings
                      </button>
                   </div>
                </form>
              )}
           </div>
        </div>

        <div className="text-center mt-12">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Designed by SNCB DSI • v2.5.1</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
