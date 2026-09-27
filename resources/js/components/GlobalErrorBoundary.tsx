import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 dark:bg-ink-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-ink-900 dark:text-cream-50">
                Đã có sự cố hiển thị trang
              </h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Hệ thống đã tự động bảo vệ và chặn hiện tượng trắng trang. Bạn có thể tải lại trang hoặc quay về trang chủ.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-cream-100 dark:bg-ink-800 rounded-xl text-xs font-mono text-rose-600 dark:text-rose-400 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <RotateCcw size={14} /> Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-cream-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-cream-200 dark:border-ink-700 shadow-2xs"
              >
                <Home size={14} /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
