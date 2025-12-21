
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
  const { user, preferences, setPreferences, setUser, logout, error, setError, logAction } = useApp();
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoginSuccess = useCallback((supabaseUser: any) => {
    logAction('USER_LOGIN', { method: 'Supabase' });
    setUser({
      id: supabaseUser.id || 'local-demo',
      sncbId: supabaseUser.user_metadata?.sncbId || '00000000',
      firstName: supabaseUser.user_metadata?.firstName || 'Agent',
      lastName: supabaseUser.user_metadata?.lastName || 'SNCB',
      email: supabaseUser.email || '',
      phone: '',
      depot: 'Bruxelles-Midi',
      series: '',
      position: '',
      isFloating: false,
      currentDuties: []
    });
    setCurrentPage('profile');
  }, [setUser, logAction]);

  const handleLocalLogin = () => {
    if (process.env.NODE_ENV === 'production') return;
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
    await logout();
    setSession(null);
    setCurrentPage('login');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-sncb-blue">
      <div className="w-16 h-16 border-4 border-sncb-yellow border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {error && (
        <div className="bg-red-600 text-white py-3 px-6 text-xs font-black flex justify-between items-center animate-slide-up sticky top-0 z-[100] shadow-xl uppercase tracking-widest">
          <p className="flex items-center"><span className="text-lg mr-2">⚠️</span> {error}</p>
          <button onClick={() => setError(null)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">✕</button>
        </div>
      )}

      {session && (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 h-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('profile')}>
              <div className="w-10 h-10 bg-sncb-blue rounded-xl flex items-center justify-center text-sncb-yellow font-black text-xl shadow-lg transform -rotate-2">S</div>
              <span className="font-black text-2xl text-sncb-blue tracking-tighter uppercase">Swap<span className="text-yellow-500">ACT</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <button onClick={() => setCurrentPage('profile')} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${currentPage === 'profile' ? 'bg-sncb-blue text-white shadow-md' : 'text-gray-400 hover:text-sncb-blue hover:bg-gray-50'}`}>Profil</button>
              <button onClick={() => setCurrentPage('preferences')} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${currentPage === 'preferences' ? 'bg-sncb-blue text-white shadow-md' : 'text-gray-400 hover:text-sncb-blue hover:bg-gray-50'}`}>Préférences</button>
              <button onClick={() => setCurrentPage('swaps')} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${currentPage === 'swaps' ? 'bg-sncb-blue text-white shadow-md' : 'text-gray-400 hover:text-sncb-blue hover:bg-gray-50'}`}>Tableau</button>
              <div className="w-px h-8 bg-gray-200 mx-2"></div>
              <button onClick={handleLogout} className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition">Quitter</button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow">
        {!session ? (
          <LoginPage onLocalLogin={handleLocalLogin} />
        ) : (
          <div className="container mx-auto py-8 px-4">
            {currentPage === 'profile' && <ProfilePage onNext={() => setCurrentPage('preferences')} />}
            {currentPage === 'preferences' && <PreferencesPage preferences={preferences} setPreferences={setPreferences} onNext={() => setCurrentPage('swaps')} />}
            {currentPage === 'swaps' && user && <SwapBoard user={user} preferences={preferences} />}
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
        Sécurisé par SNCB Cybersecurity • © {new Date().getFullYear()} • ACT SWAP v2.1-SECURE
      </footer>
    </div>
  );
};

export default App;
