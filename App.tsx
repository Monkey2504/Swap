
import React, { useState, useEffect } from 'react';
import { SNCB_DEPOTS, INITIAL_PREFERENCES, MOCK_USER_DUTIES } from './constants';
import { UserProfile, UserPreference, SwapOffer, PreferenceLevel } from './types';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import SwapBoard from './pages/SwapBoard';
import LoginPage from './pages/LoginPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'profile' | 'preferences' | 'swaps'>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>(INITIAL_PREFERENCES);
  const [showYellowBanner, setShowYellowBanner] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Vérifier la session actuelle au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleLoginSuccess(session.user);
    });

    // Écouter les changements d'auth (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleLoginSuccess(session.user);
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    // userData peut provenir de Supabase ou d'un login local (démo)
    setUser({
      id: userData.id || 'demo-id',
      sncbId: userData.user_metadata?.sncbId || '78798800',
      firstName: userData.user_metadata?.firstName || 'Jean',
      lastName: userData.user_metadata?.lastName || 'Démo',
      email: userData.email || 'demo@sncb.be',
      phone: '',
      depot: SNCB_DEPOTS[0],
      series: '702',
      position: '12',
      isFloating: false,
      currentDuties: MOCK_USER_DUTIES
    });
    setCurrentPage('profile');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setCurrentPage('login');
  };

  const handleLocalLogin = () => {
    // Mode Démo : on crée une session fictive pour bypasser Supabase
    setSession({ user: { id: 'local-demo' } });
    handleLoginSuccess({ id: 'local-demo', user_metadata: { firstName: 'Jean', sncbId: '78798800' } });
  };

  const renderPage = () => {
    if (!session) return <LoginPage onLocalLogin={handleLocalLogin} />;
    
    switch (currentPage) {
      case 'profile':
        return <ProfilePage user={user!} setUser={setUser} onNext={() => setCurrentPage('preferences')} />;
      case 'preferences':
        return <PreferencesPage preferences={preferences} setPreferences={setPreferences} onNext={() => setCurrentPage('swaps')} />;
      case 'swaps':
        return <SwapBoard user={user!} preferences={preferences} />;
      default:
        return <ProfilePage user={user!} setUser={setUser} onNext={() => setCurrentPage('preferences')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {showYellowBanner && (
        <div className="bg-yellow-400 text-black py-2 px-4 text-sm font-medium flex justify-between items-center shadow-md">
          <p>✨ Soutenez l'appli ! Contribution annuelle suggérée de 5€ pour le serveur. <span className="underline cursor-pointer ml-2">Contribuer</span></p>
          <button onClick={() => setShowYellowBanner(false)} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {session && (
        <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900 font-bold">S</div>
              <span className="font-bold text-xl tracking-tight">SWAP SNCB</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <button onClick={() => setCurrentPage('profile')} className={`hover:text-yellow-400 transition ${currentPage === 'profile' ? 'text-yellow-400 border-b-2 border-yellow-400' : ''}`}>Profil</button>
              <button onClick={() => setCurrentPage('preferences')} className={`hover:text-yellow-400 transition ${currentPage === 'preferences' ? 'text-yellow-400 border-b-2 border-yellow-400' : ''}`}>Préférences</button>
              <button onClick={() => setCurrentPage('swaps')} className={`hover:text-yellow-400 transition ${currentPage === 'swaps' ? 'text-yellow-400 border-b-2 border-yellow-400' : ''}`}>Echanges</button>
              <button onClick={handleLogout} className="hover:text-red-400 transition">Déconnexion</button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow">
        {renderPage()}
      </main>

      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 text-xs font-semibold text-gray-500 z-40">
           <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center ${currentPage === 'profile' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">👤</span>
             <span>Profil</span>
           </button>
           <button onClick={() => setCurrentPage('preferences')} className={`flex flex-col items-center ${currentPage === 'preferences' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">⚙️</span>
             <span>Préf.</span>
           </button>
           <button onClick={() => setCurrentPage('swaps')} className={`flex flex-col items-center ${currentPage === 'swaps' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">🔀</span>
             <span>Swap</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
