'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * Error codes and their user-friendly messages
 */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  auth_error: {
    title: 'Authentication Error',
    description: 'We couldn\'t verify your session. This might be temporary.',
  },
  session_expired: {
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again.',
  },
  unauthorized: {
    title: 'Unauthorized',
    description: 'You don\'t have permission to access this resource.',
  },
  default: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'default';
  const customMessage = searchParams.get('message');

  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-raised px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-warning-600 dark:text-warning-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-text-secondary">
            {customMessage || errorInfo.description}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg-hover hover:bg-bg-hover dark:hover:bg-bg-card text-text-primary rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          {code === 'auth_error' && (
            <Link
              href="/login"
              className="w-full flex items-center justify-center px-4 py-3 border border-border-base hover:bg-bg-hover text-text-primary rounded-lg transition-colors"
            >
              Log In Again
            </Link>
          )}
        </div>

        <p className="mt-8 text-sm text-text-muted">
          If this problem persists, please contact{' '}
          <a href="mailto:support@synthex.com" className="text-info-600 hover:underline">
            support@synthex.com
          </a>
        </p>

        {process.env.NODE_ENV === 'development' && code && (
          <div className="mt-4 p-3 bg-bg-hover rounded text-left text-sm font-mono">
            <p className="text-text-muted">Error Code: {code}</p>
            {customMessage && <p className="text-text-muted">Message: {customMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-raised">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
