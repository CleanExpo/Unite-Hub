'use client';

/**
 * Error boundary for Agent Operations Console
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Bot, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Agent Console error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6 min-h-[60vh]">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Bot className="w-10 h-10 text-muted-foreground" />
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Console Error</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {error.message || 'An error occurred while loading the agent console.'}
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/founder/agents'}
            variant="outline"
            className="w-full"
          >
            Back to Agents
          </Button>
        </div>
      </Card>
    </div>
  );
}
