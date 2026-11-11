import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;

  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DateFund ErrorBoundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-container-high border border-outline-variant/20 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-on-surface">
                Something slipped out of sync
              </h1>
              <p className="text-xs text-outline leading-relaxed">
                DateFund encountered an unexpected issue while rendering this view. Your saved goals and memories are safe in the cloud.
              </p>
            </div>
            {this.state.errorMessage && (
              <div className="p-3 rounded-xl bg-surface-container text-[11px] font-mono text-outline/80 break-words text-left border border-outline-variant/15 max-h-28 overflow-y-auto">
                {this.state.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 px-5 rounded-full bg-primary text-on-primary-fixed font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Reload DateFund
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

