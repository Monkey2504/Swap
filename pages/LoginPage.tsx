
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (sncbId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [sncbId, setSncbId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sncbId.length >= 6) {
      onLogin(sncbId);
    } else {
      alert("Veuillez entrer un identifiant SNCB valide.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-blue-900 text-3xl font-bold mx-auto mb-4 shadow-lg rotate-3">S</div>
          <h1 className="text-3xl font-bold text-gray-800">Appli Swap</h1>
          <p className="text-gray-500 mt-2">Accès réservé au personnel SNCB (ACT)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Identifiant SNCB</label>
            <input
              type="text"
              placeholder="ex: 78798800"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={sncbId}
              onChange={(e) => setSncbId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition shadow-lg transform active:scale-95"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col space-y-4">
          <button className="flex items-center justify-center space-x-2 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition text-gray-700 font-medium">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="google" />
            <span>Continuer avec Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
