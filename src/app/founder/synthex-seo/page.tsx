/**
 * Synthex.social Founder SEO Dashboard
 *
 * Real-time self-monitoring dashboard showing Synthex.social's own SEO performance
 *
 * Features:
 * - Keyword rankings (DataForSEO + Semrush consensus)
 * - Confidence scoring (50-100%)
 * - Trend indicators (up/down/stable)
 * - Visibility score (weighted ranking quality)
 * - Daily snapshot history
 *
 * Access: /founder/synthex-seo (Founder-only via RLS)
 */

'use client';

import { useEffect, useState } from 'react';
import { ScrollReveal, AnimatedCounter } from '@/components/AnimatedElements';

type RankingData = {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  provider: string;
  confidence: number;
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  trendDays: number;
};

type SeoMetrics = {
  rankings: RankingData[];
  summary: {
    totalKeywords: number;
    averagePosition: number;
    top10Count: number;
    top20Count: number;
    visibility: number;
  };
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    agreementPercentage: number;
  };
};

export default function SynthexSEODashboard() {
  const [metrics, setMetrics] = useState<SeoMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/seo/sync-rankings?domain=synthex.social');

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data.metrics);
        setLastUpdated(data.lastUpdated);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-hover p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-600 mx-auto mb-4"></div>
          <p className="text-text-muted">Loading SEO metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-bg-hover p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Error Loading Metrics</h2>
          <p className="text-text-muted mb-4">{error || 'No metrics available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-hover p-8">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Synthex.social SEO Dashboard
          </h1>
          <p className="text-text-muted">
            Real-time keyword rankings tracking our own performance (DataForSEO + Semrush)
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            Last updated: {lastUpdated || 'Never'} • Confidence: {metrics.confidence.level}
          </p>
        </div>
      </ScrollReveal>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <ScrollReveal delay={100}>
          <div className="bg-bg-card p-6 rounded-lg shadow border border-border-subtle">
            <div className="text-3xl font-bold text-info-600 mb-1">
              <AnimatedCounter end={metrics.summary.top10Count} />
            </div>
            <p className="text-text-muted text-sm">Top 10 Rankings</p>
            <p className="text-xs text-text-muted mt-1">
              {Math.round((metrics.summary.top10Count / metrics.summary.totalKeywords) * 100)}%
              of tracked keywords
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="bg-bg-card p-6 rounded-lg shadow border border-border-subtle">
            <div className="text-3xl font-bold text-success-600 mb-1">
              <AnimatedCounter end={metrics.summary.visibility} />
            </div>
            <p className="text-text-muted text-sm">Visibility Score</p>
            <p className="text-xs text-text-muted mt-1">Weighted ranking quality</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="bg-bg-card p-6 rounded-lg shadow border border-border-subtle">
            <div className="text-3xl font-bold text-accent-600 mb-1">
              {metrics.confidence.score}
              <span className="text-lg text-text-tertiary">%</span>
            </div>
            <p className="text-text-muted text-sm">Data Confidence</p>
            <p className="text-xs text-text-muted mt-1">
              {metrics.confidence.level === 'high' ? '🟢' :
               metrics.confidence.level === 'medium' ? '🟡' : '🔴'} {metrics.confidence.level}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="bg-bg-card p-6 rounded-lg shadow border border-border-subtle">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              <AnimatedCounter end={Math.round(metrics.summary.averagePosition)} />
            </div>
            <p className="text-text-muted text-sm">Avg Position</p>
            <p className="text-xs text-text-muted mt-1">
              Across {metrics.summary.totalKeywords} keywords
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Keyword Rankings Table */}
      <ScrollReveal delay={500}>
        <div className="bg-bg-card rounded-lg shadow border border-border-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-bg-hover">
            <h2 className="text-xl font-bold text-text-primary">Keyword Rankings</h2>
            <p className="text-sm text-text-muted mt-1">
              Tracking {metrics.rankings.length} primary keywords for Synthex.social
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-hover border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-card divide-y divide-border-subtle">
                {metrics.rankings.map((ranking, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{ranking.keyword}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          ranking.position <= 3
                            ? 'bg-success-100 text-success-800'
                            : ranking.position <= 10
                            ? 'bg-info-100 text-info-800'
                            : ranking.position <= 20
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-bg-hover text-text-primary'
                        }`}
                      >
                        #{ranking.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-text-muted">
                      {ranking.searchVolume.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-bg-hover rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              ranking.difficulty <= 30
                                ? 'bg-success-500'
                                : ranking.difficulty <= 70
                                ? 'bg-warning-500'
                                : 'bg-error-500'
                            }`}
                            style={{ width: `${ranking.difficulty}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-muted">{ranking.difficulty}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                          ranking.confidence >= 85
                            ? 'bg-success-100 text-success-700'
                            : ranking.confidence >= 70
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-error-100 text-error-700'
                        }`}
                      >
                        {ranking.confidence}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl">
                        {ranking.trend === 'up' ? '📈' :
                         ranking.trend === 'down' ? '📉' : '➡️'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* Footer Info */}
      <ScrollReveal delay={600}>
        <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-lg">
          <h3 className="font-semibold text-info-900 mb-2">No Bluff Policy</h3>
          <p className="text-sm text-info-800">
            All metrics on this dashboard are verified through DataForSEO and Semrush APIs.
            We practice what we preach - no fake scarcity, no unverifiable claims, just data.
          </p>
          <p className="text-xs text-info-700 mt-2">
            Confidence score represents agreement between providers: 95% = both agree within 2 positions,
            75% = single provider data, 50% = uncertain/incomplete data.
          </p>
        </div>
      </ScrollReveal>

      {/* Sync Button (Manual Trigger) */}
      <ScrollReveal delay={700}>
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                // Manual sync would require admin authentication
                alert('Manual sync requires CRON_SECRET. Use automated daily sync instead.');
              } finally {
                setLoading(false);
              }
            }}
            className="px-6 py-2 bg-bg-raised text-white rounded-lg hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Manual Sync (Admin Only)
          </button>
          <p className="text-xs text-text-tertiary mt-2">
            Automatic daily sync runs at 6:00 AM UTC via Vercel Cron
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
