'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: 'dashboard' },
      contexts: { react: { componentStack: error.digest } },
    });
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#FF4444' }} />
        <h2 className="text-lg font-mono font-bold text-white/90 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-white/40 mb-6">
          {error.message || 'An error occurred while loading this page.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard/overview'; }}
            className="w-full bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-4 py-2 hover:bg-white/[0.06] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
