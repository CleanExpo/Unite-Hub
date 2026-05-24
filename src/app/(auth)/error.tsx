'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="p-8 max-w-md w-full text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {error.message || 'Something went wrong during authentication.'}
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
