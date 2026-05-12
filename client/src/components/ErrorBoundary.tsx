import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-red-400 mb-4">오류가 발생했습니다</h2>
            <div className="bg-red-950/30 border border-red-900/50 rounded p-4 mb-4">
              <p className="font-mono text-sm text-red-300 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </p>
            </div>
            {this.state.errorInfo && (
              <details className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4">
                <summary className="cursor-pointer text-sm font-medium text-[#aaaaaa]">
                  상세 정보 보기
                </summary>
                <pre className="mt-2 text-xs text-[#666666] overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#c9a96e] text-black rounded hover:bg-[#b8925a]"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
