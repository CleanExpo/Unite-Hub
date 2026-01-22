/**
 * Error state for Repos Dashboard
 */

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default function ReposError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <Section>
        <Card className="p-12 bg-bg-card border-border-base text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Failed to load repositories
          </h2>
          <p className="text-text-muted mb-6">
            {error.message || 'An unexpected error occurred while loading your repositories.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-accent-500 to-accent-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <a href="/founder">Back to Founder OS</a>
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-text-muted mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </Card>
      </Section>
    </PageContainer>
  );
}
