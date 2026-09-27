import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in admin tab [${this.props.tabName || 'unknown'}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 rounded-3xl bg-white dark:bg-ink-900 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h4 className="text-base font-bold text-ink-900 dark:text-cream-50">
              Đã xảy ra sự cố khi tải phân hệ {this.props.tabName || 'này'}
            </h4>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 max-w-md">
              {this.state.error?.message || 'Có lỗi phát sinh trong quá trình hiển thị dữ liệu.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <RefreshCw size={14} /> Thử tải lại phân hệ
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
