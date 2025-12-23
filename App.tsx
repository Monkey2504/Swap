
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import SwapBoard from './pages/SwapBoard';
import AdminConsole from './pages/AdminConsole';
import LoginPage from './pages/LoginPage';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { authService } from './lib/api/authService';
import { useDuties } from './hooks/useDuties';

type AppPage = 'login' | 'profile' | 'preferences' | 'swaps' | 'admin';

const App: React.FC = () => {
  const { 
    user, 
    logout, 
    error, 
    setError, 
    successMessage, 
    setSuccessMessage, 
    isSaving,
    clearMessages,
    loadUserProfile
  } = useApp();
  
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { duties, loading: dutiesLoading, refreshDuties } = useDuties(user?.id);

  const handleNavigation = useCallback((page: AppPage) => {
    localStorage.setItem('swapact_last_page', page);
    setCurrentPage(page);
    clearMessages();
  }, [clearMessages]);

  const handleLoginSuccess = useCallback(async (supabaseUser: User) => {
    try {
      await loadUserProfile(supabaseUser.id, supabaseUser);
      const lastPage = localStorage.getItem('swapact_last_page') as AppPage;
      setCurrentPage((lastPage && lastPage !== 'login') ? lastPage : 'profile');
      refreshDuties();
    } catch (err) {
      setError('Session expirée.');
    }
  }, [loadUserProfile, setError, refreshDuties]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      await logout();
      setCurrentPage('login');
    } catch (err) {
      setError('Erreur déconnexion');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const supabase = getSupabase();
      if (!isSupabaseConfigured() || !supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession?.user) await handleLoginSuccess(currentSession.user);
      } catch (err) {
        setError('Accès Cloud SNCB impossible.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [handleLoginSuccess, setError]);

  const NavItems = [
    { page: 'profile' as const, icon: '👤', label: 'Profil' },
    { page: 'preferences' as const, icon: '⚖️', label: 'Goûts' },
    { page: 'swaps' as const, icon: '🔄', label: 'Bourse' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-[6px] border-sncb-blue/10 border-t-sncb-blue rounded-full animate-spin"></div>
        <p className="mt-10 text-slate-300 font-black uppercase tracking-[0.5em] text-[10px]">Liaison Sécurisée</p>
      </div>
    );
  }

  const renderPage = () => {
    if (!session) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    switch (currentPage) {
      case 'profile': return <ProfilePage onNext={() => handleNavigation('preferences')} duties={duties} dutiesLoading={dutiesLoading} />;
      case 'preferences': return <PreferencesPage preferences={useApp().preferences} setPreferences={(p: any) => useApp().setPreferences(p)} onNext={() => handleNavigation('swaps')} />;
      case 'swaps': return user ? <SwapBoard user={user} preferences={useApp().preferences} onRefreshDuties={refreshDuties} /> : null;
      case 'admin': return <AdminConsole />;
      default: return <ProfilePage onNext={() => handleNavigation('preferences')} duties={duties} dutiesLoading={dutiesLoading} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-inter">
        {/* Notifications Flottantes */}
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-8 pointer-events-none">
          {error && <div className="bg-red-600 text-white p-6 rounded-[32px] shadow-2xl animate-scaleUp pointer-events-auto flex justify-between font-black text-xs"><span>⚠️ {error}</span><button onClick={() => setError(null)}>✕</button></div>}
          {successMessage && <div className="bg-emerald-600 text-white p-6 rounded-[32px] shadow-2xl animate-scaleUp pointer-events-auto flex justify-between font-black text-xs"><span>✅ {successMessage}</span><button onClick={() => setSuccessMessage(null)}>✕</button></div>}
        </div>

        {/* Top Header App (Épuré) */}
        {session && (
          <div className="px-10 pt-10 pb-4 flex justify-between items-center bg-transparent">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-sncb-blue rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-xl">B</div>
               <span className="font-black text-sm uppercase tracking-widest italic">Swap<span className="text-sncb-blue">Act</span></span>
             </div>
             {isSaving && (
               <div className="flex items-center gap-3 bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-white">
                 <div className="w-2 h-2 bg-sncb-blue rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sync Cloud</span>
               </div>
             )}
          </div>
        )}

        <main className={`flex-grow ${session ? 'pb-36' : ''}`}>
          {renderPage()}
        </main>

        {/* Bottom Navigation (Style SNCB E500) */}
        {session && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 px-8 pb-10">
            <div className="nav-blur border border-white h-24 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] flex justify-around items-center px-4">
              {NavItems.map(({ page, icon, label }) => (
                <button
                  key={page}
                  onClick={() => handleNavigation(page)}
                  className={`flex flex-col items-center gap-2 transition-all duration-500 transform ${currentPage === page ? 'text-sncb-blue scale-110 -translate-y-2' : 'text-slate-300'}`}
                >
                  <span className="text-3xl filter drop-shadow-sm">{icon}</span>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${currentPage === page ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
                  {currentPage === page && <div className="w-1.5 h-1.5 bg-sncb-blue rounded-full animate-pulse"></div>}
                </button>
              ))}
              
              <div className="w-px h-10 bg-slate-200/50 mx-2"></div>
              
              {user?.role === 'admin' && (
                <button onClick={() => handleNavigation('admin')} className={`flex flex-col items-center gap-2 transform transition-transform ${currentPage === 'admin' ? 'text-slate-900 scale-110 -translate-y-2' : 'text-slate-300'}`}>
                  <span className="text-3xl">🛠️</span>
                </button>
              )}
              
              <button onClick={handleLogout} className="flex flex-col items-center gap-2 text-slate-300 hover:text-red-500 transition-colors">
                <span className="text-3xl">📤</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
