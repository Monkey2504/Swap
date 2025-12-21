
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './context/AppContext';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import SwapBoard from './pages/SwapBoard';
import LoginPage from './pages/LoginPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

type AppPage = 'login' | 'profile' | 'preferences' | 'swaps';

const App: React.FC = () => {
  const { setUser, preferences, setPreferences } = useApp();
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showYellowBanner, setShowYellowBanner] = useState(true);

  const handleLoginSuccess = useCallback((supabaseUser: any) => {
    // Initialisation du profil utilisateur simplifié via Context
    setUser({
      id: supabaseUser.id || 'local-demo',
      sncbId: '78798800',
      firstName: 'Agent',
      lastName: 'SNCB',
      email: supabaseUser.email || '',
      phone: '',
      depot: 'Bruxelles-Midi',
      series: '702',
      position: '12',
      isFloating: false,
      currentDuties: []
    });
    setCurrentPage('profile');
  }, [setUser]);

  const handleLocalLogin = () => {
    const demoSession = { user: { id: 'local-demo', email: 'demo@sncb.be' } } as Session;
    setSession(demoSession);
    handleLoginSuccess(demoSession.user);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleLoginSuccess(session.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) handleLoginSuccess(session.user);
    });

    return () => subscription.unsubscribe();
  }, [handleLoginSuccess]);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setCurrentPage('login');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {showYellowBanner && (
        <div className="bg-yellow-400 text-blue-900 py-2 px-6 text-[10px] font-black uppercase tracking-widest flex justify-between items-center shadow-lg z-50">
          <p>✨ Soutenez l'initiative ACT : 5€/an pour les serveurs. <span className="underline cursor-pointer ml-2">Contribuer</span></p>
          <button onClick={() => setShowYellowBanner(false)} className="text-lg">✕</button>
        </div>
      )}

      {session && (
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 h-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-yellow-400 font-black text-xl shadow-lg transform -rotate-3">S</div>
              <span className="font-black text-2xl text-blue-900 tracking-tighter">SWAP<span className="text-yellow-500">ACT</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <button onClick={() => setCurrentPage('profile')} className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition ${currentPage === 'profile' ? 'bg-blue-900 text-white' : 'text-gray-400 hover:text-blue-900'}`}>Profil</button>
              <button onClick={() => setCurrentPage('preferences')} className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition ${currentPage === 'preferences' ? 'bg-blue-900 text-white' : 'text-gray-400 hover:text-blue-900'}`}>Préférences</button>
              <button onClick={() => setCurrentPage('swaps')} className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition ${currentPage === 'swaps' ? 'bg-blue-900 text-white' : 'text-gray-400 hover:text-blue-900'}`}>Tableau</button>
              <div className="w-px h-6 bg-gray-100 mx-2"></div>
              <button onClick={handleLogout} className="text-red-500 font-black text-xs uppercase tracking-widest px-4">Quitter</button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow container mx-auto py-8">
        {!session ? (
          <LoginPage onLocalLogin={handleLocalLogin} />
        ) : (
          <>
            {currentPage === 'profile' && <ProfilePage onNext={() => setCurrentPage('preferences')} />}
            {currentPage === 'preferences' && <PreferencesPage preferences={preferences} setPreferences={setPreferences} onNext={() => setCurrentPage('swaps')} />}
            {currentPage === 'swaps' && <SwapBoard user={useApp().user!} preferences={preferences} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
