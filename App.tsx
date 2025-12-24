import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, User as UserIcon, Settings, Repeat, BookOpen, LogOut, ChevronRight, Bell, Search } from 'lucide-react';

// Lazy loading des pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
const SwapBoard = lazy(() => import('./pages/SwapBoard'));
const StationDictionary = lazy(() => import('./pages/StationDictionary'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

type AppPage = 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary';

// Composant de chargement
const LoadingScreen = () => (
  <div className="h-screen w-full bg-premium-dark flex flex-col items-center justify-center gap-6">
    <div className="w-16 h-16 border-4 border-white/5 border-t-accent-purple rounded-full animate-spin shadow-2xl glow-purple"></div>
    <div className="text-center space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-purple animate-pulse">Synchronisation</p>
      <p className="text-xs text-slate-500 font-bold">Espace Communautaire SwapACT</p>
    </div>
  </div>
);

// Composant Sidebar mémorisé
const Sidebar = React.memo(({ 
  currentPage, 
  onNavigate, 
  onLogout 
}: { 
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}) => {
  const NavItem = React.useCallback(({ 
    page, 
    icon: Icon, 
    label 
  }: { 
    page: AppPage; 
    icon: any; 
    label: string;
  }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all group ${
        currentPage === page ? 'sidebar-item-active text-white' : 'text-slate-400 hover:text-white'
      }`}
      aria-current={currentPage === page ? 'page' : undefined}
    >
      <Icon 
        size={18} 
        className={currentPage === page ? 'text-accent-purple' : 'text-slate-500 group-hover:text-slate-300'} 
        aria-hidden="true"
      />
      <span className="text-sm font-semibold tracking-tight">{label}</span>
    </button>
  ), [currentPage, onNavigate]);

  return (
    <aside className="w-72 h-full glass-panel border-r border-white/5 flex flex-col p-8 z-50" aria-label="Navigation principale">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-8 h-8 bg-accent-purple rounded-lg flex items-center justify-center text-white font-black italic shadow-lg glow-purple" aria-hidden="true">
          B
        </div>
        <h1 className="text-lg font-black tracking-tighter italic">
          SwapACT <span className="text-[10px] text-accent-purple not-italic ml-1 uppercase font-bold tracking-widest">Communauté</span>
        </h1>
      </div>

      <nav className="flex-grow space-y-1" aria-label="Menu de navigation">
        <NavItem page="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
        <NavItem page="profile" icon={UserIcon} label="Mes Services" />
        <NavItem page="swaps" icon={Repeat} label="Échanges" />
        <NavItem page="dictionary" icon={BookOpen} label="Codes Gares" />
        <NavItem page="preferences" icon={Settings} label="Mes Goûts" />
      </nav>

      <div className="mt-auto space-y-4">
        <div className="px-6 py-4 bg-white/5 rounded-2xl mb-2 border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Projet Indépendant</p>
          <p className="text-[10px] text-slate-400 leading-tight">
            Géré par des collègues pour faciliter notre quotidien.
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-red-400 transition-all bg-white/5 rounded-2xl border border-white/5"
          aria-label="Se déconnecter"
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="text-sm font-bold">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

// Composant Header mémorisé
const Header = React.memo(({ 
  user, 
  onSearch 
}: { 
  user: any; 
  onSearch: (query: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <header className="flex items-center justify-between mb-10">
      <form onSubmit={handleSearch} className="relative w-96 group" role="search">
        <Search 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-purple transition-colors" 
          size={18} 
          aria-hidden="true"
        />
        <input 
          type="text" 
          placeholder="Rechercher un service, un collègue..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/20 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Recherche"
        />
      </form>
      
      <div className="flex items-center gap-6">
        <button 
          className="relative p-2 text-slate-400 hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-purple rounded-full" aria-hidden="true"></span>
        </button>
        <div className="h-8 w-px bg-white/10" aria-hidden="true"></div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-black">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user.depot || 'Dépôt à définir'}</p>
          </div>
          <div 
            className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple font-black"
            aria-hidden="true"
          >
            {user.firstName[0]}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const App: React.FC = () => {
  // Extraire toutes les valeurs du contexte en premier
  const { 
    user, 
    logout, 
    loadUserProfile, 
    clearMessages, 
    addTechLog,
    preferences,
    setPreferences
  } = useApp();

  const { duties, refreshDuties } = { duties: [], refreshDuties: () => {} }; // Temporaire - à remplacer par useDuties si nécessaire

  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [globalError, setGlobalError] = useState<Error | null>(null);

  // Gestion du chargement initial
  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted && isAppInitializing) {
        addTechLog("L'initialisation prend plus de temps que prévu. Vérifiez votre connexion.", 'warn', 'App');
        setIsAppInitializing(false);
      }
    }, 5000);

    const initApp = async () => {
      try {
        // Vérification de session
        // À remplacer par votre service d'authentification
        // const session = await authService.getSession();
        // if (mounted && session?.user) {
        //   await loadUserProfile(session.user.id, session.user);
        //   refreshDuties();
        // }
        
        // Simuler un chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        addTechLog(`Erreur initialisation: ${err}`, 'error', 'App');
        setGlobalError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setIsAppInitializing(false);
        }
      }
    };

    initApp();
    return () => { 
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [addTechLog]);

  // Gestion des erreurs globales
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setGlobalError(event.error);
      addTechLog(`Erreur globale: ${event.message}`, 'error', 'global');
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [addTechLog]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      addTechLog(`Erreur lors de la déconnexion: ${error}`, 'error', 'Auth');
    }
  }, [logout, addTechLog]);

  const handleNavigate = useCallback((page: AppPage) => {
    setCurrentPage(page);
    clearMessages();
  }, [clearMessages]);

  const handleSearch = useCallback((query: string) => {
    // Implémenter la logique de recherche
    console.log('Recherche:', query);
    addTechLog(`Recherche effectuée: ${query}`, 'info', 'Search');
  }, [addTechLog]);

  // Si une erreur globale survient
  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-premium-dark p-6">
        <div className="max-w-md w-full glass-panel p-8 text-center">
          <h2 className="text-xl font-black text-red-400 mb-4">Erreur critique</h2>
          <p className="text-slate-300 mb-6">{globalError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent-purple text-white rounded-2xl font-bold"
          >
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement initial
  if (isAppInitializing) {
    return <LoadingScreen />;
  }

  // Page de connexion
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ErrorBoundary>
          <LoginPage onLoginSuccess={async (authUser) => {
            await loadUserProfile(authUser.id, authUser);
            refreshDuties();
          }} />
        </ErrorBoundary>
      </Suspense>
    );
  }

  // Contenu principal de l'application
  return (
    <ErrorBoundary>
      <div className="h-screen w-full bg-railway-overlay flex overflow-hidden font-inter text-white">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        
        <main className="flex-grow h-full overflow-y-auto p-10 relative">
          <Header user={user} onSearch={handleSearch} />
          
          <div className="animate-slide-up max-w-7xl mx-auto">
            <Suspense fallback={<LoadingScreen />}>
              {currentPage === 'dashboard' && <DashboardPage duties={duties} />}
              {currentPage === 'profile' && <ProfilePage duties={duties} />}
              {currentPage === 'preferences' && (
                <PreferencesPage 
                  preferences={preferences}
                  setPreferences={setPreferences}
                />
              )}
              {currentPage === 'swaps' && (
                <SwapBoard 
                  user={user} 
                  preferences={preferences}
                  onRefreshDuties={refreshDuties}
                />
              )}
              {currentPage === 'dictionary' && <StationDictionary />}
            </Suspense>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;