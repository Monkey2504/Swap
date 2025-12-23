
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
import { User as UserIcon, Settings, Repeat, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';

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
    if (user && !user.onboardingCompleted && page !== 'profile') {
      setError("Veuillez d'abord compléter votre profil.");
      return;
    }
    localStorage.setItem('swapact_last_page', page);
    setCurrentPage(page);
    clearMessages();
  }, [user, clearMessages, setError]);

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

  useEffect(() => {
    if (user && !user.onboardingCompleted && currentPage !== 'profile') {
      setCurrentPage('profile');
    }
  }, [user, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-[3px] border-slate-200 border-t-sncb-blue rounded-full animate-spin"></div>
        <p className="mt-6 text-slate-400 font-medium text-sm tracking-tight">Vérification des accès...</p>
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

  const NavItem = ({ page, icon: Icon, label }: { page: AppPage, icon: any, label: string }) => (
    <button
      onClick={() => handleNavigation(page)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${
        currentPage === page 
          ? 'bg-sncb-blue text-white shadow-lg' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} className={currentPage === page ? 'text-white' : 'text-slate-400'} />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F5F7] flex overflow-hidden">
        {/* Messages Flottants (Toast) */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
          {error && (
            <div className="glass bg-red-50/90 border-red-100 p-4 rounded-2xl shadow-2xl animate-slide-up flex items-start gap-3">
              <span className="text-red-500">⚠️</span>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-red-900">Erreur</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-slate-400">✕</button>
            </div>
          )}
          {successMessage && (
            <div className="glass bg-emerald-50/90 border-emerald-100 p-4 rounded-2xl shadow-2xl animate-slide-up flex items-start gap-3">
              <span className="text-emerald-500">✅</span>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-emerald-900">Succès</p>
                <p className="text-xs text-emerald-700">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-slate-400">✕</button>
            </div>
          )}
        </div>

        {session && (
          <>
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-72 h-screen glass border-r border-slate-200 p-6 z-40">
              <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-10 h-10 bg-sncb-blue rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">B</div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">Swap<span className="text-sncb-blue">Act</span></h1>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">SNCB Platform</p>
                </div>
              </div>

              <nav className="flex-grow space-y-2">
                <NavItem page="profile" icon={UserIcon} label="Mon Profil & Roster" />
                <NavItem page="preferences" icon={Settings} label="Mes Préférences" />
                <NavItem page="swaps" icon={Repeat} label="Bourse aux Échanges" />
                {user?.role === 'admin' && (
                  <NavItem page="admin" icon={ShieldCheck} label="Administration" />
                )}
              </nav>

              <div className="mt-auto space-y-4">
                {isSaving && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Synchronisation Cloud</span>
                  </div>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full mt-4"
                >
                  <LogOut size={20} />
                  <span className="font-semibold text-sm">Déconnexion</span>
                </button>
              </div>
            </aside>

            {/* Bottom Nav for Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 h-20 px-6 flex items-center justify-around z-50">
               <button onClick={() => handleNavigation('profile')} className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-sncb-blue' : 'text-slate-400'}`}>
                 <UserIcon size={24} />
                 <span className="text-[10px] font-bold">Profil</span>
               </button>
               <button onClick={() => handleNavigation('preferences')} className={`flex flex-col items-center gap-1 ${currentPage === 'preferences' ? 'text-sncb-blue' : 'text-slate-400'}`}>
                 <Settings size={24} />
                 <span className="text-[10px] font-bold">Gouts</span>
               </button>
               <button onClick={() => handleNavigation('swaps')} className={`flex flex-col items-center gap-1 ${currentPage === 'swaps' ? 'text-sncb-blue' : 'text-slate-400'}`}>
                 <Repeat size={24} />
                 <span className="text-[10px] font-bold">Swaps</span>
               </button>
               <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400">
                 <LogOut size={24} />
                 <span className="text-[10px] font-bold">Sortir</span>
               </button>
            </nav>
          </>
        )}

        <main className={`flex-grow overflow-y-auto ${session ? 'md:p-12 p-6' : ''}`}>
           <div className={`mx-auto ${session ? 'max-w-6xl' : ''}`}>
              {renderPage()}
           </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
