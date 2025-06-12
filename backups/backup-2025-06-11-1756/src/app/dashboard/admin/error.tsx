// ================================================
// Admin Dashboard Error Boundary
// ================================================

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An error occurred while loading the admin dashboard.
          </p>
          {error.message && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-mono">
                {error.message}
              </p>
            </div>
          )}
          {error.digest && (
            <p className="mt-2 text-xs text-gray-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/dashboard/crm"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to CRM Dashboard
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}
