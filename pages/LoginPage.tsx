
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { formatError } from '../lib/api';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (user: User) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && onLoginSuccess) await onLoginSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user && onLoginSuccess) await onLoginSuccess(data.user);
      }
    } catch (error: any) {
      setAuthError(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm glass-card p-10 space-y-8 animate-in slide-in-from-bottom-10 duration-700">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/30 mx-auto">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">Accès Bord</h2>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Communauté SNCB</p>
        </div>
      </div>

      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
        <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isSignUp ? 'bg-white/10 text-white' : 'text-white/30'}`}>Connexion</button>
        <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSignUp ? 'bg-white/10 text-white' : 'text-white/30'}`}>Inscription</button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {authError && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] text-red-400 font-bold uppercase text-center">{authError}</div>}
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="E-mail professionnel" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button disabled={loading} className="w-full btn-gradient py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 active:scale-95 transition-all">
          {loading ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? "Créer mon compte" : "Entrer dans l'espace")}
        </button>
      </form>
      
      <p className="text-[9px] text-white/20 font-medium text-center uppercase tracking-widest leading-relaxed">Réservé aux agents statutaires et contractuels SNCB</p>
    </div>
  );
};

export default LoginPage;
