
import React, { Component, ReactNode, ErrorInfo, useState, useCallback } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string;
  recoveryAttempts: number;
  lastErrorTime: number | null;
  isPermanentFailure: boolean;
}

/**
 * Composant ErrorBoundary robuste avec gestion de récupération progressive
 * - Capture les erreurs de rendu React
 * - Gestion des erreurs asynchrones via window.onerror
 * - Stratégie de récupération hiérarchique
 * - Journalisation structurée
 */
// Fix: Explicitly extend React.Component to ensure props, state, and setState are correctly recognized by TypeScript.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private static MAX_RECOVERY_ATTEMPTS = 3;
  private static RECOVERY_COOLDOWN_MS = 5000; // 5 secondes entre les erreurs
  private errorHandlerRef: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandlerRef: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    // Fix: State initialization within constructor recognized via inheritance from React.Component.
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: this.generateIncidentId(),
      recoveryAttempts: 0,
      lastErrorTime: null,
      isPermanentFailure: false,
    };

    this.handleManualRetry = this.handleManualRetry.bind(this);
    this.handleFullReset = this.handleFullReset.bind(this);
  }

  /**
   * Génère un identifiant unique pour l'incident
   */
  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Gestionnaire d'erreurs globales (hors React)
   */
  private setupGlobalErrorHandlers() {
    // Capture les erreurs JavaScript globales
    this.errorHandlerRef = (event: ErrorEvent) => {
      // Éviter les boucles infinies
      if (event.error?.message?.includes('ErrorBoundary')) return;

      const error = event.error || new Error(event.message);
      this.logErrorToService(error, {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    // Capture les promesses non catchées
    this.rejectionHandlerRef = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.logErrorToService(error, {
        type: 'unhandled_rejection',
        reason: event.reason,
      });
    };

    window.addEventListener('error', this.errorHandlerRef);
    window.addEventListener('unhandledrejection', this.rejectionHandlerRef);
  }

  /**
   * Nettoie les gestionnaires d'événements
   */
  private cleanupGlobalErrorHandlers() {
    if (this.errorHandlerRef) {
      window.removeEventListener('error', this.errorHandlerRef);
    }
    if (this.rejectionHandlerRef) {
      window.removeEventListener('unhandledrejection', this.rejectionHandlerRef);
    }
  }

  /**
   * Journalisation structurée des erreurs
   */
  private logErrorToService(error: Error, metadata: Record<string, any> = {}) {
    // Fix: access state from React.Component.
    const currentState = this.state;
    const logEntry = {
      incidentId: currentState.incidentId,
      timestamp: new Date().toISOString(),
      component: 'ErrorBoundary',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      state: {
        recoveryAttempts: currentState.recoveryAttempts,
        lastErrorTime: currentState.lastErrorTime,
      },
      metadata,
    };

    // Envoi à un service de logging (console en développement)
    console.error('[ErrorBoundary] Incident:', currentState.incidentId, logEntry);

    // En production, envoyer à votre service de monitoring
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry).catch(() => {
        // Ignorer les erreurs d'envoi pour ne pas créer de boucle
      });
    }
  }

  /**
   * Envoi sécurisé aux services de monitoring
   */
  private async sendToMonitoringService(data: any) {
    // Intégration avec Sentry, LogRocket, ou votre backend
    if (typeof window !== 'undefined') {
      // Exemple avec un endpoint d'API
      await fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {}); // Ne pas bloquer en cas d'erreur
    }
  }

  /**
   * Méthode statique pour mettre à jour l'état lors d'une erreur
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      incidentId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      lastErrorTime: Date.now(),
    };
  }

  /**
   * Capture les informations d'erreur détaillées
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Fix: Access to state and props works correctly within React.Component lifecycle method.
    const { incidentId } = this.state;
    const { onError } = this.props;

    this.logErrorToService(error, {
      type: 'react_error',
      componentStack: errorInfo.componentStack,
    });

    // Appeler le callback parent si fourni
    if (onError) {
      onError(error, errorInfo);
    }

    // Fix: setState is correctly inherited from React.Component.
    this.setState({
      errorInfo,
    });
  }

  componentDidMount() {
    this.setupGlobalErrorHandlers();
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Fix: props and state access works correctly within React.Component lifecycle method.
    const { resetOnChange, children } = this.props;
    const { hasError } = this.state;

    // Réinitialiser l'erreur si les props changent (navigation, etc.)
    if (resetOnChange && 
        children !== prevProps.children && 
        hasError) {
      this.resetErrorState();
    }
  }

  componentWillUnmount() {
    this.cleanupGlobalErrorHandlers();
  }

  /**
   * Réinitialise l'état d'erreur
   */
  private resetErrorState() {
    // Fix: setState call is now recognized as a member of ErrorBoundary through inheritance.
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: this.generateIncidentId(),
      recoveryAttempts: 0,
      isPermanentFailure: false,
    });
  }

  /**
   * Stratégie de récupération hiérarchique
   */
  private handleManualRetry() {
    const now = Date.now();
    // Fix: State access recognized correctly in class context.
    const { lastErrorTime, recoveryAttempts } = this.state;

    // Vérifier le cooldown entre les tentatives
    if (lastErrorTime && (now - lastErrorTime) < ErrorBoundary.RECOVERY_COOLDOWN_MS) {
      console.warn('Trop de tentatives de récupération rapprochées');
      return;
    }

    // Limiter le nombre de tentatives
    if (recoveryAttempts >= ErrorBoundary.MAX_RECOVERY_ATTEMPTS) {
      // Fix: setState recognized correctly.
      this.setState({
        isPermanentFailure: true,
      });
      return;
    }

    // Fix: Functional setState works correctly when extending React.Component.
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prevState.recoveryAttempts + 1,
      lastErrorTime: now,
    }));
  }

  /**
   * Réinitialisation complète (dernier recours)
   */
  private handleFullReset() {
    // Sauvegarder l'état important avant reset
    const importantState = {
      userToken: localStorage.getItem('auth_token'),
      // Ajouter d'autres données critiques
    };

    // Nettoyer le localStorage de manière sélective
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('swapact_') && !key.includes('token')) {
        localStorage.removeItem(key);
      }
    });

    // Recharger la page en conservant certaines données
    if (importantState.userToken) {
      localStorage.setItem('auth_token', importantState.userToken);
    }

    // Option 1: Rechargement doux (garder la session)
    window.location.hash = '#recovery';
    window.location.reload();
  }

  /**
   * Affiche le composant de fallback personnalisé ou l'UI par défaut
   */
  render() {
    // Fix: Props and State access recognized correctly in render method.
    const { hasError, error, errorInfo, incidentId, recoveryAttempts, isPermanentFailure } = this.state;
    const { children, fallback } = this.props;

    // Si pas d'erreur, afficher les enfants normalement
    if (!hasError) {
      return children;
    }

    // Si un fallback personnalisé est fourni
    if (fallback) {
      return fallback;
    }

    // Échec permanent - afficher un message spécial
    if (isPermanentFailure) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-500 p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-500 text-4xl font-black mx-auto mb-4">
                ⚠️
              </div>
              <h2 className="text-white text-xl font-black uppercase tracking-tighter">
                Échec Système
              </h2>
              <p className="text-white/80 text-sm mt-2">
                L'application rencontre des problèmes persistants
              </p>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                Nous n'avons pas pu récupérer l'application après plusieurs tentatives.
                Veuillez contacter le support technique.
              </p>
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Référence incident: <strong>{incidentId}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Tentatives: {recoveryAttempts}/{ErrorBoundary.MAX_RECOVERY_ATTEMPTS}
                </p>
              </div>
              <button
                onClick={this.handleFullReset}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-slate-900 transition-colors"
              >
                Réinitialiser complètement
              </button>
            </div>
          </div>
        </div>
      );
    }

    // UI d'erreur par défaut
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-4 backdrop-blur-sm">
              🚂
            </div>
            <h2 className="text-white text-xl font-black uppercase tracking-tighter">
              Oups ! Une erreur est survenue
            </h2>
            <p className="text-white/80 text-sm mt-2">
              L'application a rencontré un problème technique
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Pas d'inquiétude, vos données sont en sécurité sur le cloud SNCB.
                Nous avons créé un rapport technique pour résoudre le problème.
              </p>
              
              {error && (
                <div className="bg-slate-50 p-4 rounded-xl text-left">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Détails techniques :</p>
                  <p className="text-sm text-slate-700 font-mono truncate">
                    {error.message || 'Erreur inconnue'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-semibold">Incident :</span>
                <code className="bg-slate-100 px-2 py-1 rounded">{incidentId}</code>
                <span className="text-xs">
                  (Tentative {recoveryAttempts + 1}/{ErrorBoundary.MAX_RECOVERY_ATTEMPTS})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg"
              >
                Réessayer l'application
              </button>
              
              <button
                onClick={this.handleFullReset}
                className="w-full py-3 text-slate-600 border border-slate-300 rounded-2xl font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Réinitialiser et recharger
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Si le problème persiste, contactez le support avec le code incident.
                <br />
                <a 
                  href={`mailto:support@sncb.be?subject=Incident ${incidentId}`}
                  className="text-blue-600 hover:underline"
                >
                  support@sncb.be
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Hook personnalisé pour utiliser le ErrorBoundary de manière déclarative
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const showBoundary = useCallback((err: Error) => {
    setError(err);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showBoundary,
    resetError,
  };
}

/**
 * Composant ErrorBoundary simplifié pour les cas d'usage courants
 */
export const ErrorBoundarySimple: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return (
    <ErrorBoundary
      fallback={fallback}
      resetOnChange={true}
    >
      {children}
    </ErrorBoundary>
  );
};
