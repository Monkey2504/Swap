
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
import { User as UserIcon, Settings, Repeat, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';

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
    setCurrentPage(page);
    clearMessages();
  }, [user, clearMessages, setError]);

  const handleLoginSuccess = useCallback(async (supabaseUser: User) => {
    try {
      await loadUserProfile(supabaseUser.id, supabaseUser);
      setCurrentPage('profile');
      refreshDuties();
    } catch (err) {
      setError('Erreur de chargement du profil.');
    }
  }, [loadUserProfile, setError, refreshDuties]);

  const handleLogout = async () => {
    await authService.signOut();
    await logout();
    setCurrentPage('login');
  };

  useEffect(() => {
    const initialize = async () => {
      const supabase = getSupabase();
      if (!isSupabaseConfigured() || !supabase) {
        setIsLoading(false);
        return;
      }
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) await handleLoginSuccess(currentSession.user);
      setIsLoading(false);
    };
    initialize();
  }, [handleLoginSuccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-sncb-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <LoginPage onLoginSuccess={handleLoginSuccess} />;

  const NavItem = ({ page, icon: Icon, label }: { page: AppPage, icon: any, label: string }) => (
    <button
      onClick={() => handleNavigation(page)}
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all w-full group ${
        currentPage === page 
          ? 'bg-sncb-blue text-white shadow-xl shadow-sncb-blue/20' 
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Icon size={20} className={currentPage === page ? 'text-white' : 'text-slate-400 group-hover:text-sncb-blue'} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {currentPage === page && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F2F4F7] flex overflow-hidden font-inter">
        {/* Toast Notifications */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
          {error && (
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-l-4 border-red-500 flex items-center justify-between animate-slide-up">
              <p className="text-sm font-bold text-slate-800">{error}</p>
              <button onClick={() => setError(null)} className="text-slate-300">✕</button>
            </div>
          )}
          {successMessage && (
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-l-4 border-emerald-500 flex items-center justify-between animate-slide-up">
              <p className="text-sm font-bold text-slate-800">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="text-slate-300">✕</button>
            </div>
          )}
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-80 h-screen glass border-r border-slate-200 p-8 z-40">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="w-12 h-12 bg-sncb-blue rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">B</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 italic">B-SWAP</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-sncb-blue/40">SNCB Premium</p>
            </div>
          </div>

          <nav className="flex-grow space-y-2">
            <NavItem page="profile" icon={UserIcon} label="Profil & Roster" />
            <NavItem page="preferences" icon={Settings} label="Goûts & Filtres" />
            <NavItem page="swaps" icon={Repeat} label="Bourse aux Swaps" />
            {user?.role === 'admin' && <NavItem page="admin" icon={ShieldCheck} label="Administration" />}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-5 py-4 text-slate-400 hover:text-red-500 transition-all w-full"
            >
              <LogOut size={20} />
              <span className="font-bold text-sm tracking-tight">Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 h-20 px-4 flex items-center justify-around z-50">
          <button onClick={() => handleNavigation('profile')} className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-sncb-blue' : 'text-slate-400'}`}>
            <UserIcon size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Roster</span>
          </button>
          <button onClick={() => handleNavigation('swaps')} className={`flex flex-col items-center gap-1 ${currentPage === 'swaps' ? 'text-sncb-blue' : 'text-slate-400'}`}>
            <div className="w-12 h-12 bg-sncb-blue text-white rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#F2F4F7]">
              <Repeat size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Swap</span>
          </button>
          <button onClick={() => handleNavigation('preferences')} className={`flex flex-col items-center gap-1 ${currentPage === 'preferences' ? 'text-sncb-blue' : 'text-slate-400'}`}>
            <Settings size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Gouts</span>
          </button>
        </nav>

        <main className="flex-grow overflow-y-auto lg:p-12 p-6 pb-28">
           <div className="max-w-6xl mx-auto animate-slide-up">
              {currentPage === 'profile' && <ProfilePage onNext={() => handleNavigation('preferences')} duties={duties} dutiesLoading={dutiesLoading} />}
              {currentPage === 'preferences' && <PreferencesPage preferences={useApp().preferences} setPreferences={useApp().setPreferences} onNext={() => handleNavigation('swaps')} />}
              {currentPage === 'swaps' && (user ? <SwapBoard user={user} preferences={useApp().preferences} onRefreshDuties={refreshDuties} /> : null)}
              {currentPage === 'admin' && <AdminConsole />}
           </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
