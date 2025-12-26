import React, { ReactNode, ErrorInfo, useState, useCallback } from 'react';

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
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private static MAX_RECOVERY_ATTEMPTS = 3;
  private static RECOVERY_COOLDOWN_MS = 5000;
  private errorHandlerRef: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandlerRef: ((event: PromiseRejectionEvent) => void) | null = null;

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
    };

    this.handleManualRetry = this.handleManualRetry.bind(this);
    this.handleFullReset = this.handleFullReset.bind(this);
  }

  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR_${timestamp}_${random}`.toUpperCase();
  }

  private setupGlobalErrorHandlers() {
    this.errorHandlerRef = (event: ErrorEvent) => {
      if (event.error?.message?.includes('ErrorBoundary')) return;
      const error = event.error || new Error(event.message);
      this.logErrorToService(error, {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

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

  private cleanupGlobalErrorHandlers() {
    if (this.errorHandlerRef) {
      window.removeEventListener('error', this.errorHandlerRef);
    }
    if (this.rejectionHandlerRef) {
      window.removeEventListener('unhandledrejection', this.rejectionHandlerRef);
    }
  }

  private logErrorToService(error: Error, metadata: Record<string, any> = {}) {
    const currentState = this.state;
    const logEntry = {
      incidentId: currentState.incidentId,
      timestamp: new Date().toISOString(),
      component: 'ErrorBoundary',
      error: {
        name: error?.name || 'Error',
        message: error?.message || 'Unknown error',
        stack: error?.stack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      state: {
        recoveryAttempts: currentState.recoveryAttempts,
        lastErrorTime: currentState.lastErrorTime,
      },
      metadata,
    };

    // Logging séparé pour éviter [object Object] dans la console
    console.group(`[ErrorBoundary] Incident: ${currentState.incidentId}`);
    console.error("Détails de l'erreur:", error);
    console.error("Contexte technique:", logEntry);
    console.groupEnd();

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry).catch(() => {});
    }
  }

  private async sendToMonitoringService(data: any) {
    if (typeof window !== 'undefined') {
      await fetch('/api/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      incidentId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { incidentId } = this.state;
    const { onError } = this.props;

    this.logErrorToService(error, {
      type: 'react_error',
      componentStack: errorInfo.componentStack,
    });

    if (onError) {
      onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  componentDidMount() {
    this.setupGlobalErrorHandlers();
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnChange, children } = this.props;
    const { hasError } = this.state;

    if (resetOnChange && 
        children !== prevProps.children && 
        hasError) {
      this.resetErrorState();
    }
  }

  componentWillUnmount() {
    this.cleanupGlobalErrorHandlers();
  }

  private resetErrorState() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: this.generateIncidentId(),
      recoveryAttempts: 0,
      isPermanentFailure: false,
    });
  }

  private handleManualRetry() {
    const now = Date.now();
    const { lastErrorTime, recoveryAttempts } = this.state;

    if (lastErrorTime && (now - lastErrorTime) < ErrorBoundary.RECOVERY_COOLDOWN_MS) {
      return;
    }

    if (recoveryAttempts >= ErrorBoundary.MAX_RECOVERY_ATTEMPTS) {
      this.setState({
        isPermanentFailure: true,
      });
      return;
    }

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

  render() {
    const { hasError, error, incidentId, recoveryAttempts, isPermanentFailure } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

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
                Plusieurs tentatives de récupération ont échoué.
              </p>
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Incident: <strong>{incidentId}</strong>
                </p>
              </div>
              <button
                onClick={this.handleFullReset}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm uppercase tracking-wider"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-4 backdrop-blur-sm">
              🚂
            </div>
            <h2 className="text-white text-xl font-black uppercase tracking-tighter">
              Une erreur est survenue
            </h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              {error && (
                <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Détails :</p>
                  <p className="text-sm text-slate-700 font-mono break-all line-clamp-3">
                    {String(error?.message || 'Erreur inconnue')}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-semibold">ID :</span>
                <code className="bg-slate-100 px-2 py-1 rounded">{incidentId}</code>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                className="w-full py-4 bg-sncb-blue text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);
  const showBoundary = useCallback((err: Error) => setError(err), []);
  const resetError = useCallback(() => setError(null), []);
  return { error, showBoundary, resetError };
}

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
}