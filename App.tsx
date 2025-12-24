
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { authService } from './lib/api/authService';
import { useDuties } from './hooks/useDuties';
import { LayoutDashboard, User as UserIcon, Settings, Repeat, BookOpen, LogOut, Bell, Search, Loader2, Star, List } from 'lucide-react';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
const SwapBoard = lazy(() => import('./pages/SwapBoard'));
const StationDictionary = lazy(() => import('./pages/StationDictionary'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

type AppPage = 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary';

const App: React.FC = () => {
  const { user, logout, loadUserProfile, clearMessages, preferences, setPreferences } = useApp();
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { duties, isLoading: dutiesLoading, refresh } = useDuties(user?.id);

  const init = useCallback(async () => {
    setIsAppLoading(true);
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user);
      }
    } catch (err) {
      console.error("[App] Init fail:", err);
    } finally {
      setIsAppLoading(false);
    }
  }, [loadUserProfile]);

  useEffect(() => { init(); }, [init]);

  if (isAppLoading) return (
    <div className="h-screen w-full bg-[#0a0c10] flex items-center justify-center">
      <Loader2 className="animate-spin text-purple-500" size={48} />
    </div>
  );

  if (!user) return <LoginPage onLoginSuccess={async (u) => { await loadUserProfile(u.id, u); refresh(); }} />;

  const NavItem = ({ page, icon: Icon, label }: { page: AppPage, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentPage(page); clearMessages(); }}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all rounded-2xl mb-1 ${
        currentPage === page ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={currentPage === page ? 'text-purple-400' : ''} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  return (
    <ErrorBoundary>
      <div className="h-screen w-full relative flex items-center justify-center p-4 lg:p-8">
        <div className="app-bg-container"></div>

        <div className="w-full h-full max-w-[1440px] flex overflow-hidden glass-container">
          {/* Sidebar */}
          <aside className="w-72 h-full glass-sidebar flex flex-col p-8 shrink-0">
            <div className="flex items-center gap-3 mb-16">
               <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                 <Star size={20} fill="white" className="text-white" />
               </div>
               <span className="text-xl font-bold tracking-tight italic">SwapACT</span>
            </div>

            <nav className="flex-grow space-y-2">
              <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem page="profile" icon={List} label="Mes Services" />
              <NavItem page="swaps" icon={Repeat} label="Échanges" />
              <NavItem page="dictionary" icon={BookOpen} label="Codes Gares" />
              <NavItem page="preferences" icon={Settings} label="Préférences" />
            </nav>

            <button 
              onClick={() => { authService.signOut(); logout(); }}
              className="w-full btn-logout-gradient py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </aside>

          {/* Main Area */}
          <main className="flex-grow h-full overflow-y-auto p-10 relative">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-purple-500" /></div>}>
              {currentPage === 'dashboard' && <DashboardPage duties={duties} />}
              {currentPage === 'profile' && <ProfilePage onNext={() => setCurrentPage('preferences')} duties={duties} dutiesLoading={dutiesLoading} />}
              {currentPage === 'preferences' && <PreferencesPage preferences={preferences} setPreferences={setPreferences} onNext={() => setCurrentPage('swaps')} />}
              {currentPage === 'swaps' && <SwapBoard user={user} preferences={preferences} onRefreshDuties={async () => { refresh(); }} />}
              {currentPage === 'dictionary' && <StationDictionary />}
            </Suspense>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
