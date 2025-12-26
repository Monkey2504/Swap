import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { LoadingFallback } from './components/ErrorBoundary';
import './styles/global.css';
import { APP_VERSION, MINIMUM_BROWSER_VERSION } from './constants';

// Vérifier la compatibilité du navigateur
const checkBrowserCompatibility = (): boolean => {
  const userAgent = navigator.userAgent;
  let version = 0;

  // Détecter Chrome
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  }
  // Détecter Firefox
  else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  }
  // Détecter Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  }

  return version >= MINIMUM_BROWSER_VERSION;
};

// Écran de chargement initial
const InitialLoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-sncb-blue to-accent-blue flex flex-col items-center justify-center p-6">
    <div className="text-center space-y-8 animate-pulse">
      <div className="relative">
        <div className="w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-white to-white/50 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-4xl">🚂</span>
          </div>
        </div>
        <div className="absolute -inset-6 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white tracking-tighter">
          Swap<span className="text-yellow-300">ACT</span>
        </h1>
        <p className="text-white/80 text-sm font-medium max-w-xs mx-auto">
          Plateforme d'échanges de services SNCB
        </p>
      </div>
      
      <div className="w-64 mx-auto">
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-white via-yellow-300 to-white animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
        </div>
        <p className="text-xs text-white/60 mt-3 font-medium">
          Version {APP_VERSION} • Chargement de l'application sécurisée...
        </p>
      </div>
      
      <div className="pt-8 border-t border-white/20">
        <p className="text-xs text-white/50">
          © 2024 SNCB/NMBS - Application interne réservée au personnel
        </p>
      </div>
    </div>
  </div>
);

// Écran d'incompatibilité navigateur
const BrowserCompatibilityScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">⚠️</span>
      </div>
      
      <h1 className="text-2xl font-black text-gray-900 mb-4">
        Navigateur incompatible
      </h1>
      
      <div className="text-left space-y-4 mb-8">
        <p className="text-gray-600">
          Votre navigateur n'est pas compatible avec SwapACT. Pour des raisons de sécurité et de performance, 
          l'application nécessite un navigateur moderne.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">Solution recommandée :</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Téléchargez la dernière version de <strong>Google Chrome</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Mettez à jour votre navigateur actuel</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Vérifiez que JavaScript est activé</span>
            </li>
          </ul>
        </div>
        
        <div className="text-xs text-gray-500">
          Version minimale requise : Chrome {MINIMUM_BROWSER_VERSION}+, Firefox {MINIMUM_BROWSER_VERSION}+, Safari {MINIMUM_BROWSER_VERSION}+
        </div>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Recharger la page
        </button>
        
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Télécharger Chrome →
        </a>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Pour toute assistance, contactez le support technique SNCB
          <br />
          <a href="mailto:support@swapact.sncb.be" className="text-blue-600 hover:underline">
            support@swapact.sncb.be
          </a>
        </p>
      </div>
    </div>
  </div>
);

// Fonction principale pour démarrer l'application
const startApplication = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Élément racine #root non trouvé dans le DOM');
    return;
  }

  // Vérifier la compatibilité du navigateur
  if (!checkBrowserCompatibility()) {
    ReactDOM.createRoot(rootElement).render(<BrowserCompatibilityScreen />);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  
  // Afficher l'écran de chargement initial
  root.render(<InitialLoadingScreen />);
  
  // Simuler un délai de chargement et monter l'application complète
  setTimeout(() => {
    try {
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <AppProvider>
              <App />
            </AppProvider>
          </ErrorBoundary>
        </React.StrictMode>
      );
    } catch (error) {
      console.error('Erreur lors du rendu de l\'application:', error);
      root.render(
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Erreur de démarrage</h2>
            <p className="text-gray-600 mb-6">
              L'application n'a pas pu démarrer. Veuillez recharger la page ou contacter le support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-sncb-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
  }, 1500); // Délai de 1.5 seconde pour l'écran de chargement
};

// Vérifier que le DOM est chargé avant de démarrer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}

// Exporter pour les tests
export { checkBrowserCompatibility };