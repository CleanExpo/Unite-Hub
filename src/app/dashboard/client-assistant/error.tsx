'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, MessageSquare, RefreshCw } from 'lucide-react';

export default function ClientAssistantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client Assistant error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8 min-h-[60vh]">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Assistant Error</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {error.message || 'An error occurred while loading the client assistant.'}
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard/overview')}
            variant="outline"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
