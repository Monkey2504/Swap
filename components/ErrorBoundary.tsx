
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  incidentId?: string;
  recoveryAttempts: number;
}

/**
 * ErrorBoundary conforme aux standards Enterprise SNCB.
 * Gère la journalisation des incidents, l'anonymisation des erreurs et la résilience logicielle.
 */
export class ErrorBoundary extends Component<Props, State> {
  private readonly MAX_RECOVERY_ATTEMPTS = 2;
  
  public state: State = {
    hasError: false,
    recoveryAttempts: 0
  };

  /**
   * Génère un identifiant d'incident court et lisible pour le support technique.
   */
  private generateIncidentId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Masque les informations potentiellement sensibles dans les messages d'erreur.
   */
  private sanitizeErrorMessage(message: string): string {
    const sensitiveKeywords = ['password', 'token', 'key', 'auth', 'secret', 'bearer', 'cookie'];
    let sanitized = message;
    sensitiveKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}=[^&\\s]+`, 'gi');
      sanitized = sanitized.replace(regex, `${keyword}=[REDACTED]`);
    });
    return sanitized;
  }

  /**
   * Détermine si une erreur est récupérable (ex: erreur réseau temporaire).
   */
  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') || 
      message.includes('failed to fetch') || 
      message.includes('chunkloaderror') ||
      message.includes('timeout')
    );
  }

  public static getDerivedStateFromError(_: Error): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const incidentId = this.generateIncidentId();
    const sanitizedMessage = this.sanitizeErrorMessage(error.message);
    
    // Journalisation structurée pour les outils de supervision (ex: Sentry, ELK)
    const report = {
      incidentId,
      timestamp: new Date().toISOString(),
      errorType: error.name,
      message: sanitizedMessage,
      stack: errorInfo.componentStack,
      environment: process.env.NODE_ENV,
      url: window.location.href
    };

    // Simulation de l'envoi vers un service de log centralisé SNCB
    console.error(`[AUDIT] Incident ${incidentId} rapporté au SIEM:`, report);

    // Tentative de récupération automatique pour les erreurs transitoires
    if (this.isRecoverable(error) && this.state.recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS) {
      this.setState(prevState => ({
        incidentId,
        recoveryAttempts: prevState.recoveryAttempts + 1
      }), () => {
        setTimeout(() => {
          this.setState({ hasError: false });
        }, 1500);
      });
    } else {
      this.setState({ incidentId });
    }
  }

  private handleManualRetry = () => {
    this.setState({ hasError: false, recoveryAttempts: 0 });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Si nous sommes en cours de tentative de récupération automatique
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

      // Écran d'erreur critique (Fallback UI)
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
              <h1 className="text-white text-2xl font-black tracking-tight uppercase">Erreur Système</h1>
            </div>
            
            <div className="p-8 text-center">
              <p className="text-gray-600 font-medium mb-6 leading-relaxed">
                L'application a rencontré un problème technique imprévu. Votre session a été sécurisée.
              </p>
              
              <div className="bg-slate-50 border rounded-2xl p-4 mb-8">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">ID Incident Support</p>
                <p className="text-2xl font-black text-blue-900 font-mono tracking-tighter">
                  {this.state.incidentId || 'UNAVAILABLE'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleManualRetry}
                  className="w-full bg-blue-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-800 transition shadow-lg active:scale-95"
                >
                  REDÉMARRER L'APPLICATION
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full text-blue-600 text-xs font-bold hover:underline"
                >
                  Imprimer le rapport pour le support
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t text-[9px] text-gray-400 font-bold uppercase tracking-tighter flex justify-between">
              <span>SNCB ACT SWAP v2.0</span>
              <span>© {new Date().getFullYear()} DSI-FER</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
