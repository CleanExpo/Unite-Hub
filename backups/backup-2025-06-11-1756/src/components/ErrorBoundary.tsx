'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
  errorId: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
    this.errorId = Math.random().toString(36).substr(2, 9)
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, this would send to your error monitoring service
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })

    // Example: Send to Sentry, LogRocket, or your monitoring service
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    this.errorId = Math.random().toString(36).substr(2, 9)
  }

  private reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorId={this.errorId}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const reloadPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-slate-400">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error ID for support */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Error ID</span>
            </div>
            <code className="text-sm text-slate-400 font-mono">{errorId}</code>
            <p className="text-xs text-slate-500 mt-2">
              Please include this ID when contacting support
            </p>
          </div>

          {/* Development error details */}
          {isDevelopment && error && (
            <div className="bg-red-950/20 rounded-lg p-4 border border-red-800/30">
              <h3 className="text-sm font-medium text-red-400 mb-2">Development Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-red-300 font-medium">Message:</span>
                  <p className="text-xs text-red-200 font-mono mt-1">{error.message}</p>
                </div>
                {error.stack && (
                  <div>
                    <span className="text-xs text-red-300 font-medium">Stack Trace:</span>
                    <pre className="text-xs text-red-200 font-mono mt-1 whitespace-pre-wrap overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={reloadPage} className="flex-1 border-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button variant="outline" onClick={goHome} className="flex-1 border-slate-600">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center text-xs text-slate-500">
            If this problem persists, please contact our support team with the error ID above.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Custom error fallback for specific components
export function ComponentErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <h3 className="text-sm font-medium text-red-300">Component Error</h3>
      </div>
      <p className="text-sm text-red-200 mb-4">
        This component encountered an error and couldn&apos;t render properly.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4">
          <summary className="text-xs text-red-300 cursor-pointer mb-2">
            Show error details
          </summary>
          <pre className="text-xs text-red-200 font-mono whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
      )}
      <Button size="sm" onClick={resetError} variant="outline" className="border-red-700">
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </div>
  )
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error boundary integration
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo)
    // Could also trigger error boundary or send to monitoring service
    throw error
  }
}

export default ErrorBoundary
