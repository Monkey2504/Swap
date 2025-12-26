
import React, { useState } from 'react';
/* Fix: Import User as a type from @supabase/supabase-js */
import type { User } from '@supabase/supabase-js';
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
      /* Fix: Cast auth to any to bypass missing method errors on SupabaseAuthClient type */
      const auth = supabase.auth as any;
      if (isSignUp) {
        result = await auth.signUp({ email, password });
      } else {
        result = await auth.signInWithPassword({ email, password });
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
    <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-slide-up border border-gray-100 flex flex-col">
      {/* Header Image Train SNCB */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1541416955000-848e4268e367?q=80&w=800&auto=format&fit=crop" 
          alt="SNCB Train" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-6 left-8 z-20 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <Train size={24} className="text-sncb-blue" />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Swap<span className="text-gray-300">ACT</span></h2>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Personnel de Bord</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button 
            onClick={() => setIsSignUp(false)} 
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isSignUp ? 'bg-white text-sncb-blue shadow-sm' : 'text-gray-500'}`}
          >
            Connexion
          </button>
          <button 
            onClick={() => setIsSignUp(true)} 
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${isSignUp ? 'bg-white text-sncb-blue shadow-sm' : 'text-gray-500'}`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {authError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-600 font-black uppercase tracking-tight text-center italic">
              {authError}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail professionnel</label>
              <input 
                type="email" 
                placeholder="agent@sncb.be" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm font-semibold focus:outline-none focus:border-sncb-blue focus:ring-4 focus:ring-sncb-blue/5 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm font-semibold focus:outline-none focus:border-sncb-blue focus:ring-4 focus:ring-sncb-blue/5 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 bottom-4 text-gray-300 hover:text-sncb-blue transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-5 bg-sncb-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-accent-blue transition-all shadow-xl shadow-sncb-blue/20 disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? "Créer mon compte" : "Ouvrir ma session")}
          </button>
        </form>
        
        <div className="pt-2 flex items-center justify-center gap-2 text-slate-300">
          <ShieldCheck size={14} />
          <p className="text-[9px] font-black uppercase tracking-widest">Serveur Sécurisé Cloud SNCB</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
