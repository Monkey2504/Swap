
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
          <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Oups, une erreur est survenue</h1>
            <p className="text-gray-600 mb-6 text-sm">
              L'application a rencontré un problème inattendu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-sncb-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg"
            >
              Recharger l'application
            </button>
            {this.state.error && (
              <pre className="mt-6 text-[10px] text-red-400 bg-red-50 p-3 rounded text-left overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    // Fix: Access children via this.props.children in React Class Components
    return this.props.children;
  }
}
