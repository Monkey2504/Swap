import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { authService } from './lib/api/authService';
import { useDuties } from './hooks/useDuties';
import { 
  LayoutDashboard, 
  Settings, 
  Repeat, 
  BookOpen, 
  LogOut, 
  List, 
  Loader2, 
  Train, 
  Menu, 
  X, 
  ImageIcon, 
  Key,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'));
const SwapBoard = lazy(() => import('./pages/SwapBoard'));
const StationDictionary = lazy(() => import('./pages/StationDictionary'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ImageEditorPage = lazy(() => import('./pages/ImageEditorPage'));

type AppPage = 'dashboard' | 'profile' | 'preferences' | 'swaps' | 'dictionary' | 'studio';
type ApiKeyStatus = 'checking' | 'missing' | 'valid' | 'error';

const App: React.FC = () => {
  const { user, logout, loadUserProfile, preferences } = useApp();
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('checking');
  const [apiError, setApiError] = useState<string | null>(null);
  const { duties, refresh, isLoading: dutiesLoading } = useDuties(user?.id);

  const checkApiHealth = useCallback(async () => {
    try {
      // Vérifier la santé de l'API Vision
      const response = await fetch('/api/vision', { method: 'GET' });
      
      if (response.ok) {
        const data = await response.json();
        if (data.api_key_configured) {
          setApiKeyStatus('valid');
          setApiError(null);
          return true;
        } else {
          setApiKeyStatus('missing');
          setApiError('Clé API Google Cloud Vision non configurée');
          return false;
        }
      } else {
        setApiKeyStatus('error');
        const errorData = await response.json();
        setApiError(`Erreur API: ${errorData.message || 'Impossible de joindre le service'}`);
        return false;
      }
    } catch (error) {
      console.error('Erreur vérification API:', error);
      setApiKeyStatus('error');
      setApiError('Service API indisponible. Vérifiez votre connexion.');
      return false;
    }
  }, []);

  const init = useCallback(async () => {
    try {
      setIsAppLoading(true);
      setApiError(null);

      // Vérification de la santé de l'API au démarrage
      await checkApiHealth();

      const session = await authService.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user);
      }
    } catch (err) {
      console.error("[App] Erreur init:", err);
      setApiError('Erreur lors de l\'initialisation de l\'application');
    } finally {
      setIsAppLoading(false);
    }
  }, [loadUserProfile, checkApiHealth]);

  useEffect(() => { 
    init(); 
  }, [init]);

  // Vérifier périodiquement la santé de l'API
  useEffect(() => {
    if (apiKeyStatus === 'error') {
      const interval = setInterval(async () => {
        await checkApiHealth();
      }, 30000); // Vérifier toutes les 30 secondes si erreur
      
      return () => clearInterval(interval);
    }
  }, [apiKeyStatus, checkApiHealth]);

  const handleRetryApi = async () => {
    setApiKeyStatus('checking');
    setApiError(null);
    await checkApiHealth();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const navigateTo = (page: AppPage) => {
    setCurrentPage(page);
    closeSidebar();
  };

  const renderApiStatusIndicator = () => {
    switch(apiKeyStatus) {
      case 'valid':
        return (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle size={12} />
            <span className="font-semibold">API Opérationnelle</span>
          </div>
        );
      case 'missing':
      case 'error':
        return (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <AlertCircle size={12} />
            <span className="font-semibold">Problème API</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isAppLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-sncb-blue/5 to-white">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 bg-sncb-blue rounded-2xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Train size={48} className="text-white" />
            </div>
            <div className="absolute -inset-4 bg-sncb-blue/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-sncb-blue tracking-tighter">
              Swap<span className="text-accent-blue">ACT</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Initialisation de l'application...
            </p>
          </div>
          
          <div className="w-64 mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sncb-blue to-accent-blue animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Écran de configuration API si erreur
  if (apiKeyStatus === 'error' || apiKeyStatus === 'missing') {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-sncb-blue to-accent-blue flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              apiKeyStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-sncb-blue'
            }`}>
              {apiKeyStatus === 'error' ? <AlertCircle size={40} /> : <Key size={40} />}
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-sncb-blue uppercase tracking-tighter">
                {apiKeyStatus === 'error' ? 'Erreur de Configuration' : 'Configuration Requise'}
              </h2>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  {apiError || 'Une configuration serveur est nécessaire pour utiliser les fonctionnalités IA.'}
                </p>
                
                {apiKeyStatus === 'missing' && (
                  <div className="text-left bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-sm text-sncb-blue mb-2">Configuration Vercel :</h4>
                    <ol className="text-xs text-gray-700 space-y-1 pl-5 list-decimal">
                      <li>Allez sur Vercel Dashboard → votre projet</li>
                      <li>Settings → Environment Variables</li>
                      <li>Ajoutez : <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_API_KEY=votre_clé_api</code></li>
                      <li>Redeployez l'application</li>
                    </ol>
                  </div>
                )}
                
                {apiKeyStatus === 'error' && (
                  <div className="text-left bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-bold text-sm text-red-600 mb-2">Dépannage :</h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Vérifiez que Google Cloud Vision API est activée</li>
                      <li>• Vérifiez que la facturation est activée</li>
                      <li>• Vérifiez que la clé API a les bonnes permissions</li>
                      <li>• Attendez 5 minutes après l'ajout de la clé</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleRetryApi}
                className="w-full py-4 bg-sncb-blue text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-blue-700 transition-colors active:scale-95"
              >
                {apiKeyStatus === 'checking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Vérification...
                  </span>
                ) : 'Réessayer'}
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Recharger la page
              </button>
              
              <a 
                href="https://console.cloud.google.com/apis/library/vision.googleapis.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-sm text-sncb-blue hover:underline font-medium"
              >
                Accéder à Google Cloud Console →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN SI NON CONNECTÉ
  if (!user) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-sncb-blue via-accent-blue to-sncb-blue flex items-center justify-center p-6">
        <LoginPage onLoginSuccess={async (u) => { 
          await loadUserProfile(u.id, u); 
          refresh(); 
        }} />
      </div>
    );
  }

  // IDENTIFICATION FORCEE SI PROFIL INCOMPLET
  if (!user.onboardingCompleted) {
    return (
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-sncb-blue" size={32} />
        </div>
      }>
        <div className="h-screen w-full overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-4 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
              <div className="w-12 h-12 bg-gradient-to-br from-sncb-blue to-accent-blue rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Train size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-sncb-blue uppercase italic tracking-tighter">
                  Bienvenue sur <span className="text-gray-400">SwapACT</span>
                </h1>
                <p className="text-sm text-gray-500">Complétez votre profil pour continuer</p>
              </div>
            </div>
            <ProfilePage onNext={() => {}} duties={duties} dutiesLoading={dutiesLoading} />
          </div>
        </div>
      </Suspense>
    );
  }

  // APP NORMALE SI PROFIL OK
  return (
    <ErrorBoundary>
      <div className="app-container relative">
        {/* Header Mobile */}
        <header className="mobile-header bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sncb-blue to-accent-blue rounded-lg flex items-center justify-center shadow-sm">
                <Train size={18} className="text-white" />
              </div>
              <span className="text-sm font-black text-sncb-blue tracking-tight">SwapACT</span>
              {renderApiStatusIndicator()}
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-2 text-sncb-blue hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Overlay pour sidebar mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          sidebar-sncb fixed md:relative z-50 md:z-auto 
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          transition-transform duration-300
          bg-gradient-to-b from-sncb-blue to-accent-blue
        `}>
          <div className="sidebar-logo px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Train size={24} className="text-sncb-blue" />
              </div>
              <div className="flex-grow">
                <span className="text-lg font-black text-white tracking-tight block">SNCB</span>
                <span className="text-xs font-bold opacity-80 uppercase tracking-wider text-white">
                  SwapACT Premium
                </span>
              </div>
              <button 
                onClick={closeSidebar} 
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-grow py-6 px-4 overflow-y-auto">
            <NavItem 
              active={currentPage === 'dashboard'} 
              onClick={() => navigateTo('dashboard')} 
              icon={LayoutDashboard} 
              label="Tableau de Bord" 
            />
            <NavItem 
              active={currentPage === 'profile'} 
              onClick={() => navigateTo('profile')} 
              icon={List} 
              label="Mon Roster" 
            />
            <NavItem 
              active={currentPage === 'swaps'} 
              onClick={() => navigateTo('swaps')} 
              icon={Repeat} 
              label="Bourse d'Échanges" 
            />
            <NavItem 
              active={currentPage === 'studio'} 
              onClick={() => navigateTo('studio')} 
              icon={ImageIcon} 
              label="Studio IA" 
            />
            <NavItem 
              active={currentPage === 'dictionary'} 
              onClick={() => navigateTo('dictionary')} 
              icon={BookOpen} 
              label="Codes Gares" 
            />
            <NavItem 
              active={currentPage === 'preferences'} 
              onClick={() => navigateTo('preferences')} 
              icon={Settings} 
              label="Mes Préférences" 
            />
          </nav>

          {/* User Section */}
          <div className="p-6 border-t border-white/10 bg-black/10">
            <div className="mb-4">
              <p className="text-sm font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs opacity-80 uppercase tracking-wider text-white">
                {user.depot || 'Sans Dépôt'} • {user.employeeId || 'N/A'}
              </p>
            </div>
            <button 
              onClick={() => { 
                authService.signOut(); 
                logout(); 
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-medium text-sm text-white"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content bg-gradient-to-b from-gray-50 to-white">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="animate-spin text-sncb-blue mx-auto" size={32} />
                <p className="text-sm text-gray-500">Chargement de la page...</p>
              </div>
            </div>
          }>
            {currentPage === 'dashboard' && (
              <DashboardPage duties={duties} onNavigate={navigateTo} />
            )}
            {currentPage === 'profile' && (
              <ProfilePage 
                onNext={() => navigateTo('preferences')} 
                duties={duties} 
                dutiesLoading={dutiesLoading} 
              />
            )}
            {currentPage === 'preferences' && (
              <PreferencesPage 
                preferences={preferences} 
                setPreferences={() => {}} 
                onNext={() => navigateTo('swaps')} 
              />
            )}
            {currentPage === 'swaps' && (
              <SwapBoard 
                user={user} 
                preferences={preferences} 
                onRefreshDuties={async () => { refresh(); }} 
              />
            )}
            {currentPage === 'studio' && (
              <>
                {apiKeyStatus === 'valid' ? (
                  <ImageEditorPage />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <AlertCircle className="mx-auto text-red-500" size={48} />
                      <h3 className="text-xl font-bold text-gray-900">Service IA indisponible</h3>
                      <p className="text-gray-600">
                        Le service de reconnaissance de documents est temporairement indisponible.
                      </p>
                      <button
                        onClick={handleRetryApi}
                        className="px-6 py-3 bg-sncb-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {currentPage === 'dictionary' && <StationDictionary />}
          </Suspense>
        </main>

        {/* Notification d'erreur API */}
        {apiError && apiKeyStatus !== 'missing' && (
          <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 animate-slide-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-grow">
                <p className="text-sm font-medium text-red-900">Problème de connexion API</p>
                <p className="text-xs text-red-700 mt-1">{apiError}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleRetryApi}
                    className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 transition-colors"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={() => setApiError(null)}
                    className="text-xs px-3 py-1.5 bg-transparent text-red-600 rounded font-medium hover:bg-red-100 transition-colors"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 
      transition-all duration-200 font-medium text-sm
      ${active 
        ? 'bg-white text-sncb-blue shadow-sm' 
        : 'text-white/90 hover:bg-white/10 hover:text-white'
      }
    `}
  >
    <Icon size={18} className={active ? 'text-sncb-blue' : 'text-white/80'} />
    <span className="text-left">{label}</span>
  </button>
);

export default App;