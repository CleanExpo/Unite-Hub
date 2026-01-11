/**
 * Health Check Hero Component
 * Domain input form and analysis trigger
 *
 * Features:
 * - URL input field with validation
 * - Analyze button with loading state
 * - Error handling
 * - Responsive layout
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface HealthCheckHeroProps {
  onAnalyze: (domain: string) => Promise<void>;
  loading: boolean;
  initialDomain?: string;
}

export function HealthCheckHero({ onAnalyze, loading, initialDomain }: HealthCheckHeroProps) {
  const [domain, setDomain] = useState(initialDomain || '');
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    // Basic domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    if (!domainRegex.test(domain.trim())) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }

    await onAnalyze(domain.trim());
  };

  return (
    <div className="mb-12">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Analyze Your Website Health
          </h2>
          <p className="text-text-secondary text-lg">
            Get instant E.E.A.T. scoring, technical audit, and competitor benchmarking
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Enter domain (e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
              className="flex-1 bg-bg-card border-border text-text-primary placeholder:text-text-secondary/50"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="inline-flex mr-2 w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-bg-card p-4 rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent-500 mb-1">6</div>
            <div className="text-sm text-text-secondary">Threat Types Detected</div>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent-500 mb-1">Real-Time</div>
            <div className="text-sm text-text-secondary">WebSocket Updates</div>
          </div>
          <div className="bg-bg-card p-4 rounded-lg border border-border">
            <div className="text-2xl font-bold text-accent-500 mb-1">&lt;2s</div>
            <div className="text-sm text-text-secondary">Average Analysis Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
