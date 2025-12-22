
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginPageProps {
  onLocalLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLocalLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Fix: Removed Gemini API key status tracking from UI as it should be handled exclusively via environment variables
  const isReadyForProd = isSupabaseConfigured;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      alert("Erreur : Les variables SUPABASE_URL ou SUPABASE_ANON_KEY sont manquantes.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              sncbId: email.split('@')[0],
              firstName: 'Agent',
              lastName: 'SNCB'
            }
          }
        });
        if (error) throw error;
        alert("Succès ! Vérifiez votre email professionnel pour confirmer l'inscription.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003399] to-[#001133] p-4 font-inter">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 border border-white/20 relative overflow-hidden">
        {/* Décoration SNCB */}
        <div className="absolute top-0 left-0 w-full h-2 bg-sncb-yellow"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sncb-yellow rounded-2xl flex items-center justify-center text-sncb-blue text-3xl font-black mx-auto mb-4 shadow-lg transform -rotate-3">
            S
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Swap<span className="text-sncb-blue">ACT</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">SNCB Service Exchange Platform</p>
        </div>

        {/* Panneau de Diagnostic Dynamique */}
        <div className="mb-8 bg-slate-50 rounded-3xl p-5 border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assistant de Connexion</p>
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="text-[9px] font-black text-sncb-blue uppercase underline"
            >
              {showGuide ? "Fermer" : "Aide configuration"}
            </button>
          </div>

          {showGuide ? (
            <div className="space-y-3 mb-2 animate-fadeIn">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-slate-700">Pour relier votre compte :</p>
                <ul className="text-[9px] text-slate-500 mt-2 space-y-1 font-mono">
                  {/* Fix: Removed API_KEY configuration hints to follow GenAI security requirements */}
                  <li>• SUPABASE_URL = (L'URL de votre projet)</li>
                  <li>• SUPABASE_ANON_KEY = (Clé publique anon)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className={`flex flex-col items-center justify-center p-3 w-full rounded-2xl border transition-all ${isSupabaseConfigured ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <span className="text-sm mb-1">{isSupabaseConfigured ? '✅' : '❌'}</span>
                <span className={`text-[8px] font-black uppercase ${isSupabaseConfigured ? 'text-green-700' : 'text-red-700'}`}>Base de données</span>
              </div>
            </div>
          )}
          
          {isReadyForProd && (
            <div className="mt-4 flex items-center justify-center space-x-2 animate-pulse">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Système Opérationnel</p>
            </div>
          )}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail professionnel (SNCB)"
            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-sncb-blue outline-none font-bold text-slate-700 transition-all text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe sécurisé"
            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-sncb-blue outline-none font-bold text-slate-700 transition-all text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl transform active:scale-95 text-sm uppercase tracking-widest ${
              loading || !isSupabaseConfigured 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-sncb-blue hover:bg-slate-900 text-white shadow-sncb-blue/20'
            }`}
          >
            {loading ? 'Traitement...' : isSignUp ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-black text-sncb-blue uppercase tracking-widest hover:underline"
          >
            {isSignUp ? "Déjà un compte ? Connexion" : "Nouvel utilisateur ? S'inscrire"}
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-white px-4 text-slate-300 font-black tracking-[0.3em]">Ou</span></div>
        </div>

        <button
          onClick={onLocalLogin}
          className="w-full bg-sncb-yellow hover:bg-[#ffe033] text-sncb-blue font-black py-4 rounded-2xl transition-all shadow-lg transform active:scale-95 flex items-center justify-center space-x-2 text-xs uppercase tracking-widest"
        >
          <span>🚀 Mode Démo Immédiat</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
