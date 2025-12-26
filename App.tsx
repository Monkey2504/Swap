
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { authService } from './lib/api/authService';
import { useDuties } from './hooks/useDuties';
import { LayoutDashboard, Settings, Repeat, BookOpen, LogOut, List, Loader2, Train, Menu, X } from 'lucide-react';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
const SwapBoard = lazy(() => import('./pages/SwapBoard'));
const StationDictionary = lazy(() => import('./pages/StationDictionary'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

type AppPage = 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary';

const App: React.FC = () => {
  const { user, logout, loadUserProfile, preferences } = useApp();
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { duties, refresh, isLoading: dutiesLoading } = useDuties(user?.id);

  const init = useCallback(async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user);
      }
    } catch (err) {
      console.error("[App] Erreur init:", err);
    } finally {
      setIsAppLoading(false);
    }
  }, [loadUserProfile]);

  useEffect(() => { init(); }, [init]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navigateTo = (page: AppPage) => {
    setCurrentPage(page);
    closeSidebar();
  };

  if (isAppLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F3F4F6]">
        <div className="w-12 h-12 border-4 border-[#003399]/20 border-t-[#003399] rounded-full animate-spin mb-4"></div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#003399]">Initialisation SwapACT...</p>
      </div>
    );
  }

  // 1. LOGIN SI NON CONNECTÉ
  if (!user) {
    return (
      <div className="h-screen w-full bg-[#003399] flex items-center justify-center p-6">
        <LoginPage onLoginSuccess={async (u) => { await loadUserProfile(u.id, u); refresh(); }} />
      </div>
    );
  }

  // 2. IDENTIFICATION FORCEE SI PROFIL INCOMPLET
  if (!user.onboardingCompleted) {
    return (
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sncb-blue" /></div>}>
        <div className="h-screen w-full overflow-y-auto bg-slate-50 p-4 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
              <div className="w-12 h-12 bg-sncb-blue rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sncb-blue/20">
                <Train size={24} />
              </div>
              <h1 className="text-2xl font-black text-sncb-blue uppercase italic tracking-tighter">Bienvenue sur <span className="text-slate-400">SwapACT</span></h1>
            </div>
            <ProfilePage onNext={() => {}} duties={duties} dutiesLoading={dutiesLoading} />
          </div>
        </div>
      </Suspense>
    );
  }

  // 3. APP NORMALE SI PROFIL OK
  return (
    <ErrorBoundary>
      <div className="app-container">
        <header className="mobile-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#003399] rounded flex items-center justify-center">
              <Train size={18} className="text-white" />
            </div>
            <span className="text-sm font-extrabold text-[#003399] tracking-tight">SwapACT</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 text-[#003399]">
            <Menu size={24} />
          </button>
        </header>

        {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

        <aside className={`sidebar-sncb ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-lg">
              <Train size={24} className="text-[#003399]" />
            </div>
            <div className="flex-grow">
              <span className="text-lg font-extrabold tracking-tight block">SNCB</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">SwapACT Premium</span>
            </div>
            <button onClick={closeSidebar} className="md:hidden p-2">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-grow py-6 overflow-y-auto custom-scrollbar">
            <NavItem active={currentPage === 'dashboard'} onClick={() => navigateTo('dashboard')} icon={LayoutDashboard} label="Tableau de Bord" />
            <NavItem active={currentPage === 'profile'} onClick={() => navigateTo('profile')} icon={List} label="Mon Roster" />
            <NavItem active={currentPage === 'swaps'} onClick={() => navigateTo('swaps')} icon={Repeat} label="Bourse d'Échanges" />
            <NavItem active={currentPage === 'dictionary'} onClick={() => navigateTo('dictionary')} icon={BookOpen} label="Codes Gares" />
            <NavItem active={currentPage === 'preferences'} onClick={() => navigateTo('preferences')} icon={Settings} label="Mes Préférences" />
          </nav>

          <div className="p-6 border-t border-white/10 bg-black/5">
            <div className="mb-4">
              <p className="text-xs font-bold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[9px] opacity-60 uppercase tracking-wider">{user.depot || 'Sans Dépôt'}</p>
            </div>
            <button 
              onClick={() => { authService.signOut(); logout(); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-white/10 hover:bg-white/20 transition-all font-bold text-[10px] uppercase tracking-wider"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="main-content custom-scrollbar">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#003399]" /></div>}>
            {currentPage === 'dashboard' && <DashboardPage duties={duties} onNavigate={navigateTo} />}
            {currentPage === 'profile' && <ProfilePage onNext={() => navigateTo('preferences')} duties={duties} dutiesLoading={dutiesLoading} />}
            {currentPage === 'preferences' && <PreferencesPage preferences={preferences} setPreferences={() => {}} onNext={() => navigateTo('swaps')} />}
            {currentPage === 'swaps' && <SwapBoard user={user} preferences={preferences} onRefreshDuties={async () => { refresh(); }} />}
            {currentPage === 'dictionary' && <StationDictionary />}
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

const NavItem = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`nav-item-sncb w-full ${active ? 'active' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

export default App;
