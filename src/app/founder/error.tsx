/**
 * Error boundary for Founder OS Dashboard
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Founder OS Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-8">
      <Card className="bg-bg-raised/50 border-border p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-error-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-text-muted mb-6">
          {error.message || 'An error occurred while loading the Founder OS dashboard.'}
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-info-600 hover:bg-info-700"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-border text-text-secondary hover:bg-bg-raised"
          >
            Go to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
