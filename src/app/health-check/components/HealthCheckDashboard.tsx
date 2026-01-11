/**
 * Health Check Dashboard Client Component
 * Orchestrates all dashboard sections with real-time WebSocket updates
 *
 * Features:
 * - Real-time threat feed via WebSocket (useRealTimethreats hook)
 * - Live health analysis fetching
 * - Connection status indicator
 * - Toast notifications for critical threats
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { useRealTimethreats } from '@/lib/hooks/useRealTimethreats';
import { HealthCheckHero } from './HealthCheckHero';
import { OverallHealthScore } from './OverallHealthScore';
import { EEATBreakdown } from './EEATBreakdown';
import { TechnicalAuditSummary } from './TechnicalAuditSummary';
import { RealTimeThreatFeed } from './RealTimeThreatFeed';
import { CompetitorBenchmark } from './CompetitorBenchmark';
import { RecommendationGrid } from './RecommendationGrid';
import { ConnectionStatus } from './ConnectionStatus';

export interface HealthCheckDashboardProps {
  workspaceId: string;
  domain?: string;
  historicalScores: Array<{ overall_score: number; created_at: string }>;
  initialResults: any;
}

interface HealthCheckResults {
  overallScore: number;
  eeat: { expertise: number; authority: number; trust: number };
  technical: { lcp: number; cls: number; inp: number; security: number };
  competitors: Array<{ domain: string; health_score: number }>;
  actionableInsights: Array<{ title: string; impact: string; effort: string }>;
}

export function HealthCheckDashboard({
  workspaceId,
  domain,
  historicalScores,
  initialResults,
}: HealthCheckDashboardProps) {
  const router = useRouter();
  const [results, setResults] = useState<HealthCheckResults | null>(initialResults);
  const [loading, setLoading] = useState(!initialResults && !domain);
  const [prevThreatCount, setPrevThreatCount] = useState(0);

  // Initialize real-time threat monitoring
  const { threats, summary, isConnected, error: websocketError, reconnect } = useRealTimethreats(
    workspaceId,
    domain
  );

  /**
   * Analyze health check for domain
   */
  const analyzeHealth = async (targetDomain: string) => {
    if (!targetDomain) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/health-check/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain, workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze domain');
      }

      const data = await response.json();
      setResults(data);

      // Update URL with domain
      router.push(`/health-check?domain=${encodeURIComponent(targetDomain)}&workspaceId=${workspaceId}`);

      toast.success('Health check analysis complete', {
        description: `Domain: ${targetDomain}`,
      });
    } catch (error) {
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Show toast for new critical threats
   */
  useEffect(() => {
    if (threats.length > prevThreatCount) {
      const newThreats = threats.slice(0, threats.length - prevThreatCount);

      newThreats.forEach((threat) => {
        if (threat.threat?.severity === 'critical') {
          toast.error(`Critical threat: ${threat.threat.title}`, {
            description: threat.threat.description,
            action: {
              label: 'View',
              onClick: () => {
                // Scroll to threat feed
                const element = document.getElementById('threat-feed');
                element?.scrollIntoView({ behavior: 'smooth' });
              },
            },
          });
        }
      });

      setPrevThreatCount(threats.length);
    }
  }, [threats.length, prevThreatCount]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Toaster position="top-right" />

      {/* Header with Connection Status */}
      <div className="sticky top-0 z-40 bg-bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-text-primary">Website Health Check</h1>
          {domain && <ConnectionStatus isConnected={isConnected} />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Domain Input */}
        <HealthCheckHero onAnalyze={analyzeHealth} loading={loading} initialDomain={domain} />

        {/* Loading State */}
        {loading && !results && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-500/20 animate-spin mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent" />
              </div>
              <p className="text-text-secondary">Analyzing your website...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-8">
            {/* Overall Score Card */}
            <OverallHealthScore score={results.overallScore} historicalScores={historicalScores} />

            {/* E.E.A.T. and Technical Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EEATBreakdown eeat={results.eeat} />
              <TechnicalAuditSummary technical={results.technical} />
            </div>

            {/* Competitor Benchmarking */}
            {results.competitors && results.competitors.length > 0 && (
              <CompetitorBenchmark competitors={results.competitors} currentDomain={domain} />
            )}

            {/* Recommendations */}
            {results.actionableInsights && results.actionableInsights.length > 0 && (
              <RecommendationGrid insights={results.actionableInsights} />
            )}

            {/* Real-Time Threat Feed */}
            <div id="threat-feed" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Real-Time Threat Monitoring
                </h2>
                <span className="text-sm text-text-secondary">
                  {summary?.total || 0} threat{(summary?.total || 0) !== 1 ? 's' : ''} detected
                </span>
              </div>
              <RealTimeThreatFeed threats={threats} summary={summary} isConnected={isConnected} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !results && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Enter a domain to analyze</h2>
              <p className="text-text-secondary">
                Get E.E.A.T. scoring, technical audit, and competitor benchmarking
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
