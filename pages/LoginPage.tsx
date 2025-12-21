
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      alert("Supabase n'est pas configuré. Utilisez l'accès démo.");
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
              firstName: 'Nouvel',
              lastName: 'Agent'
            }
          }
        });
        if (error) throw error;
        alert("Vérifiez votre boîte mail !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center text-blue-900 text-4xl font-black mx-auto mb-4 shadow-xl transform -rotate-3">S</div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Appli Swap</h1>
          {!isSupabaseConfigured && (
            <div className="mt-2 bg-red-50 text-red-600 text-[10px] py-1 px-3 rounded-full font-bold inline-block border border-red-100 uppercase tracking-tighter">
              ⚠️ Mode local (Supabase non configuré)
            </div>
          )}
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Professionnel</label>
            <input
              type="email"
              placeholder="votre.nom@sncb.be"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-0 transition-all outline-none font-bold text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-0 transition-all outline-none font-bold text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-black py-5 rounded-2xl transition-all shadow-lg transform active:scale-95 text-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800 text-white'}`}
          >
            {loading ? 'Chargement...' : isSignUp ? "Créer un compte" : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            {isSignUp ? "Déjà un compte ? Connexion" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Ou explorer</span></div>
        </div>

        <button
          onClick={onLocalLogin}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-black py-4 rounded-2xl transition-all shadow-md transform active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>🚀 Accès Démo Immédiat</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
