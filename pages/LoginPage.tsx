
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { formatError } from '../lib/api';
import { Loader2, Eye, EyeOff, ShieldCheck, Train } from 'lucide-react';

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
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      if (result.error) throw result.error;
      if (result.data.user && onLoginSuccess) {
        await onLoginSuccess(result.data.user);
      }
    } catch (error: any) {
      setAuthError(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 space-y-8 animate-slide-up border border-gray-100">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-sncb-blue rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-sncb-blue/20">
          <Train size={32} className="text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-sncb-blue uppercase tracking-tight">
            Swap<span className="text-gray-400">ACT</span>
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portail Agent Certifié SNCB</p>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        <button 
          onClick={() => setIsSignUp(false)} 
          className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${!isSignUp ? 'bg-white text-sncb-blue shadow-sm' : 'text-gray-500'}`}
        >
          Connexion
        </button>
        <button 
          onClick={() => setIsSignUp(true)} 
          className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${isSignUp ? 'bg-white text-sncb-blue shadow-sm' : 'text-gray-500'}`}
        >
          Inscription
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-5">
        {authError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-semibold text-center">
            {authError}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail professionnel</label>
            <input 
              type="email" 
              placeholder="agent@sncb.be" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-sncb-blue focus:ring-1 focus:ring-sncb-blue transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:border-sncb-blue focus:ring-1 focus:ring-sncb-blue transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 bottom-3 text-gray-400 hover:text-sncb-blue"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button 
          disabled={loading} 
          className="w-full py-4 bg-sncb-blue text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sncb-blue-light transition-all shadow-lg shadow-sncb-blue/20 disabled:opacity-70"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? "Créer mon compte" : "Ouvrir ma session")}
        </button>
      </form>
      
      <div className="pt-4 flex items-center justify-center gap-2 text-gray-400">
        <ShieldCheck size={14} />
        <p className="text-[10px] font-bold uppercase tracking-widest">Connexion sécurisée Cloud SNCB</p>
      </div>
    </div>
  );
};

export default LoginPage;
