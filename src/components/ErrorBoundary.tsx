"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Card className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-12 text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  Something Went Wrong
                </h1>
                <p className="text-slate-400 text-lg">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-left">
                  <p className="text-sm font-mono text-red-400 break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-slate-500 overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={this.handleReset}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/dashboard/overview")}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-slate-500 pt-4">
                If this problem persists, please contact support or check the
                browser console for more details.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for page-level error boundaries
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onReset={() => {
        // Refresh the page on reset
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Convenience wrapper for section-level error boundaries (less intrusive)
export function SectionErrorBoundary({
  children,
  sectionName = "this section",
}: {
  children: React.ReactNode;
  sectionName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Failed to load {sectionName}
              </h3>
              <p className="text-sm text-slate-400">
                An error occurred while loading this content.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
