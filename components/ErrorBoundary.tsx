
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  incidentId?: string;
  recoveryAttempts: number;
}

/**
 * ErrorBoundary conforme aux standards Enterprise SNCB.
 * Gère la journalisation des incidents, l'anonymisation des erreurs et la résilience logicielle.
 */
// Fix: Extending imported Component directly instead of React.Component to ensure inheritance is correctly recognized by TypeScript and provides access to setState and props.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly MAX_RECOVERY_ATTEMPTS = 2;
  
  public state: ErrorBoundaryState = {
    hasError: false,
    recoveryAttempts: 0
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Explicitly bind the manual retry handler to the class instance to maintain correct 'this' context.
    this.handleManualRetry = this.handleManualRetry.bind(this);
  }

  private generateIncidentId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private sanitizeErrorMessage(message: string): string {
    const sensitiveKeywords = ['password', 'token', 'key', 'auth', 'secret', 'bearer', 'cookie'];
    let sanitized = message;
    sensitiveKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}=[^&\\s]+`, 'gi');
      sanitized = sanitized.replace(regex, `${keyword}=[REDACTED]`);
    });
    return sanitized;
  }

  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') || 
      message.includes('failed to fetch') || 
      message.includes('chunkloaderror') ||
      message.includes('timeout')
    );
  }

  public static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const incidentId = this.generateIncidentId();
    const sanitizedMessage = this.sanitizeErrorMessage(error.message);
    
    // Structured logging for supervision tools.
    const report = {
      incidentId,
      timestamp: new Date().toISOString(),
      errorType: error.name,
      message: sanitizedMessage,
      stack: errorInfo.componentStack,
      url: window.location.href
    };

    console.error(`[AUDIT] Incident ${incidentId} rapporté au SIEM:\n${JSON.stringify(report, null, 2)}`);

    if (this.isRecoverable(error) && this.state.recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS) {
      // Fix: setState is correctly inherited from Component.
      this.setState(prevState => ({
        incidentId,
        recoveryAttempts: (prevState.recoveryAttempts || 0) + 1
      }), () => {
        setTimeout(() => {
          // Fix: Resetting error state automatically for transient network failures via inherited setState.
          this.setState({ hasError: false });
        }, 1500);
      });
    } else {
      // Fix: Record incident ID for non-recoverable errors using inherited setState.
      this.setState({ incidentId });
    }
  }

  private handleManualRetry() {
    // Fix: Properly utilizing inherited setState from Component to reset before reload.
    this.setState({ hasError: false, recoveryAttempts: 0 });
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.recoveryAttempts > 0 && this.state.recoveryAttempts <= this.MAX_RECOVERY_ATTEMPTS) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-900 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-900 font-bold uppercase tracking-widest text-xs">
                Tentative de reconnexion ({this.state.recoveryAttempts}/{this.MAX_RECOVERY_ATTEMPTS})...
              </p>
            </div>
          </div>
        );
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-slate-100 p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-blue-900 p-8 text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center text-blue-900 text-4xl font-black mx-auto mb-4 shadow-inner">
                !
              </div>
              <h2 className="text-white text-xl font-black uppercase tracking-tighter italic">Incident Technique</h2>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-2">Référence: {this.state.incidentId}</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Une erreur inattendue empêche l'affichage du module. Nos équipes ont été alertées.
              </p>
              <button 
                onClick={this.handleManualRetry}
                className="w-full py-4 bg-sncb-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sncb-blue/20 hover:bg-blue-800 transition-all"
              >
                Redémarrer l'application
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: access inherited props.children correctly from the Component base class.
    return this.props.children;
  }
}
