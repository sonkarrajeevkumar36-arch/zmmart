import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[App Runtime Error Caught by Boundary]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('zypsum_products_cache');
      localStorage.removeItem('zypsum_categories_cache');
      localStorage.removeItem('zypsum_cart_cache');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans">
          <div className="bg-slate-800 border border-slate-700 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white mb-1">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected display error occurred. You can safely retry without losing your account.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-red-300 max-h-28">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-600/20 active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                title="Clear local temporary cached data"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

