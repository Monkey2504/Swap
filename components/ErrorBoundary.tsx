import React, { ReactNode, ErrorInfo, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Zap, Bug, FileText, Train } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnChange?: boolean;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string;
  recoveryAttempts: number;
  lastErrorTime: number | null;
  isPermanentFailure: boolean;
  errorType: 'react' | 'network' | 'api' | 'unknown';
}

/**
 * ErrorBoundary robuste pour SwapACT avec design SNCB
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private static MAX_RECOVERY_ATTEMPTS = 2;
  private static RECOVERY_COOLDOWN_MS = 3000;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: this.generateIncidentId(),
      recoveryAttempts: 0,
      lastErrorTime: null,
      isPermanentFailure: false,
      errorType: 'unknown',
    };

    this.handleManualRetry = this.handleManualRetry.bind(this);
    this.handleFullReset = this.handleFullReset.bind(this);
    this.handleGoToDashboard = this.handleGoToDashboard.bind(this);
    this.handleReportBug = this.handleReportBug.bind(this);
  }

  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `SNCB-${timestamp}-${random}`.toUpperCase();
  }

  private determineErrorType(error: Error): 'react' | 'network' | 'api' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
      return 'network';
    } else if (message.includes('api') || message.includes('server') || message.includes('500')) {
      return 'api';
    } else if (message.includes('react') || message.includes('component')) {
      return 'react';
    }
    
    return 'unknown';
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;
    const errorType = this.determineErrorType(error);

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      errorInfo,
      errorType,
      incidentId: this.generateIncidentId(),
    });

    // Log de l'erreur avec plus de contexte
    this.logErrorToConsole(error, errorInfo, errorType);

    // Appeler le callback parent si fourni
    if (onError) {
      onError(error, errorInfo);
    }

    // Envoyer l'erreur au service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error, errorInfo, errorType, componentName);
    }
  }

  private logErrorToConsole(error: Error, errorInfo: ErrorInfo, errorType: string) {
    console.groupCollapsed(`🚨 SwapACT Error - ${this.state.incidentId}`);
    console.error('Type:', errorType.toUpperCase());
    console.error('Message:', error.message);
    console.error('Component:', this.props.componentName || 'Unknown');
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private async sendToErrorService(error: Error, errorInfo: ErrorInfo, errorType: string, componentName?: string) {
    try {
      const errorData = {
        incidentId: this.state.incidentId,
        timestamp: new Date().toISOString(),
        application: 'SwapACT',
        version: '2.0.0',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 1000),
          type: errorType,
        },
        component: componentName || 'Unknown',
        componentStack: errorInfo.componentStack?.substring(0, 500),
        userAgent: navigator.userAgent,
        url: window.location.href,
        platform: navigator.platform,
      };

      await fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (err) {
      console.warn('Failed to send error to monitoring service:', err);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnChange, children } = this.props;
    const { hasError } = this.state;

    // Réinitialiser l'erreur si les enfants changent et resetOnChange est true
    if (resetOnChange && children !== prevProps.children && hasError) {
      this.resetErrorState();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private resetErrorState() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isPermanentFailure: false,
      errorType: 'unknown',
    });
  }

  private handleManualRetry() {
    const now = Date.now();
    const { lastErrorTime, recoveryAttempts } = this.state;

    // Cooldown check
    if (lastErrorTime && (now - lastErrorTime) < ErrorBoundary.RECOVERY_COOLDOWN_MS) {
      return;
    }

    // Max attempts check
    if (recoveryAttempts >= ErrorBoundary.MAX_RECOVERY_ATTEMPTS) {
      this.setState({
        isPermanentFailure: true,
      });
      return;
    }

    // Réinitialiser l'état d'erreur
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prevState.recoveryAttempts + 1,
      lastErrorTime: now,
    }));
  }

  private handleFullReset() {
    window.location.reload();
  }

  private handleGoToDashboard() {
    window.location.href = '/';
  }

  private handleReportBug() {
    const { incidentId, error, errorType } = this.state;
    const subject = encodeURIComponent(`[SwapACT Bug] Error ${incidentId} - ${errorType}`);
    const body = encodeURIComponent(
      `ID Incident: ${incidentId}\n` +
      `Type: ${errorType}\n` +
      `Message: ${error?.message || 'No message'}\n` +
      `URL: ${window.location.href}\n` +
      `User Agent: ${navigator.userAgent}\n\n` +
      `Description du problème:\n`
    );
    
    window.open(`mailto:support@swapact.sncb.be?subject=${subject}&body=${body}`, '_blank');
  }

  private getErrorIcon() {
    const { errorType } = this.state;
    
    switch(errorType) {
      case 'network':
        return <Zap className="w-12 h-12" />;
      case 'api':
        return <Shield className="w-12 h-12" />;
      case 'react':
        return <Bug className="w-12 h-12" />;
      default:
        return <AlertTriangle className="w-12 h-12" />;
    }
  }

  private getErrorTitle() {
    const { errorType } = this.state;
    
    switch(errorType) {
      case 'network':
        return 'Erreur de connexion';
      case 'api':
        return 'Service temporairement indisponible';
      case 'react':
        return 'Erreur d\'interface';
      default:
        return 'Une erreur est survenue';
    }
  }

  private getErrorDescription() {
    const { errorType, componentName } = this.state;
    const base = "L'application a rencontré un problème inattendu.";
    
    const descriptions = {
      network: "Vérifiez votre connexion internet et réessayez.",
      api: "Le service backend est temporairement indisponible. Réessayez dans quelques instants.",
      react: `Le composant "${componentName || 'application'}" a rencontré un problème.`,
      unknown: "Une erreur inattendue s'est produite. Notre équipe technique en a été informée.",
    };
    
    return `${base} ${descriptions[errorType]}`;
  }

  render() {
    const { 
      hasError, 
      error, 
      incidentId, 
      recoveryAttempts,
      isPermanentFailure 
    } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    // Écran d'erreur permanent
    if (isPermanentFailure) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
                <Train className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
                Service Suspendu
              </h1>
              <p className="text-white/90 text-sm mt-2">
                Des erreurs persistantes ont été détectées
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                  <AlertTriangle size={16} />
                  Échec de récupération multiple
                </div>
                
                <div className="space-y-3">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Le système a détecté des erreurs répétées et a temporairement suspendu le service 
                    pour prévenir d'autres problèmes.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium mb-1">ID d'incident :</div>
                    <code className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded border border-slate-300 block">
                      {incidentId}
                    </code>
                    <div className="text-xs text-slate-500 mt-2">
                      Merci de fournir cet identifiant au support technique.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleFullReset}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Recharger l'application
                </button>
                
                <button
                  onClick={this.handleReportBug}
                  className="w-full py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Signaler ce problème
                </button>
              </div>
              
              <div className="text-center">
                <a 
                  href="mailto:support@swapact.sncb.be"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Shield size={14} />
                  support@swapact.sncb.be
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Écran d'erreur normal
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-sncb-blue to-accent-blue p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
              {this.getErrorIcon()}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-sm"></div>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              {this.getErrorTitle()}
            </h1>
            <p className="text-white/90 text-sm mt-2">
              Nous travaillons à résoudre le problème
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                {this.getErrorDescription()}
              </p>
              
              {error && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left">
                  <div className="text-xs text-slate-500 font-medium mb-2">Message d'erreur :</div>
                  <div className="text-sm font-mono text-slate-800 bg-white p-3 rounded border border-slate-300 overflow-x-auto">
                    {error.message.substring(0, 200)}
                    {error.message.length > 200 ? '...' : ''}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <Shield size={12} />
                  Incident: {incidentId}
                </div>
                
                {recoveryAttempts > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    <RefreshCw size={12} />
                    Tentative {recoveryAttempts}/{ErrorBoundary.MAX_RECOVERY_ATTEMPTS}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                disabled={recoveryAttempts >= ErrorBoundary.MAX_RECOVERY_ATTEMPTS}
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 ${
                  recoveryAttempts >= ErrorBoundary.MAX_RECOVERY_ATTEMPTS
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-sncb-blue to-accent-blue text-white hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                <RefreshCw size={18} />
                Réessayer
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoToDashboard}
                  className="py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={16} />
                  Accueil
                </button>
                
                <button
                  onClick={this.handleReportBug}
                  className="py-3 border-2 border-blue-200 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Signaler
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Si le problème persiste, contactez le support technique SNCB
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600">
                <Zap size={12} />
                Code: {incidentId}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Hook pour utiliser ErrorBoundary dans les composants fonctionnels
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);
  
  const showBoundary = useCallback((err: Error) => {
    console.error('ErrorBoundary triggered:', err);
    setError(err);
  }, []);
  
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  return { 
    error, 
    showBoundary, 
    resetError,
    hasError: !!error 
  };
}

/**
 * Composant ErrorBoundary simplifié avec design SNCB
 */
export const ErrorBoundarySimple: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}> = ({ children, fallback, componentName }) => {
  return (
    <ErrorBoundary
      fallback={fallback}
      resetOnChange={true}
      componentName={componentName}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Composant pour afficher les erreurs en ligne (non bloquant)
 */
export const InlineError: React.FC<{
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-grow">
          <p className="text-sm font-medium text-red-900">Erreur</p>
          <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm px-4 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Composant de fallback de chargement avec design SNCB
 */
export const LoadingFallback: React.FC<{
  message?: string;
  showLogo?: boolean;
}> = ({ message = 'Chargement...', showLogo = true }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      {showLogo && (
        <div className="w-16 h-16 bg-gradient-to-br from-sncb-blue to-accent-blue rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <Train className="w-8 h-8 text-white" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-sncb-blue/20 border-t-sncb-blue rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
};

/**
 * Wrapper HOC pour les composants avec ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary componentName={displayName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}