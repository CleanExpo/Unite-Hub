import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DefaultErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-4 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <details className="text-sm text-red-600">
            <summary>Error details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
              {this.state.error?.toString()}
              {'\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
} 