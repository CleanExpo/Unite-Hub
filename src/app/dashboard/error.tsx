'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      <Card className="bg-gray-800/50 border-gray-700 p-8 max-w-md w-full text-center">
        <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'An error occurred while loading this page.'}
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700">
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard/overview'}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
