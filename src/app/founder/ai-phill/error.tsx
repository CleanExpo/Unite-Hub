/**
 * Error boundary for AI Phill Page
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
    console.error('AI Phill page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <Card className="bg-gray-800/50 border-gray-700 p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          AI Phill is unavailable
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'Failed to connect to AI Phill. Please try again.'}
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/founder')}
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
