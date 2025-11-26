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
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SEO metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Metrics</h2>
          <p className="text-gray-600 mb-4">{error || 'No metrics available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Synthex.social SEO Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time keyword rankings tracking our own performance (DataForSEO + Semrush)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated || 'Never'} • Confidence: {metrics.confidence.level}
          </p>
        </div>
      </ScrollReveal>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <ScrollReveal delay={100}>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              <AnimatedCounter end={metrics.summary.top10Count} />
            </div>
            <p className="text-gray-600 text-sm">Top 10 Rankings</p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((metrics.summary.top10Count / metrics.summary.totalKeywords) * 100)}%
              of tracked keywords
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              <AnimatedCounter end={metrics.summary.visibility} />
            </div>
            <p className="text-gray-600 text-sm">Visibility Score</p>
            <p className="text-xs text-gray-400 mt-1">Weighted ranking quality</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {metrics.confidence.score}
              <span className="text-lg text-gray-500">%</span>
            </div>
            <p className="text-gray-600 text-sm">Data Confidence</p>
            <p className="text-xs text-gray-400 mt-1">
              {metrics.confidence.level === 'high' ? '🟢' :
               metrics.confidence.level === 'medium' ? '🟡' : '🔴'} {metrics.confidence.level}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              <AnimatedCounter end={Math.round(metrics.summary.averagePosition)} />
            </div>
            <p className="text-gray-600 text-sm">Avg Position</p>
            <p className="text-xs text-gray-400 mt-1">
              Across {metrics.summary.totalKeywords} keywords
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Keyword Rankings Table */}
      <ScrollReveal delay={500}>
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Keyword Rankings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tracking {metrics.rankings.length} primary keywords for Synthex.social
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.rankings.map((ranking, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ranking.keyword}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          ranking.position <= 3
                            ? 'bg-green-100 text-green-800'
                            : ranking.position <= 10
                            ? 'bg-blue-100 text-blue-800'
                            : ranking.position <= 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        #{ranking.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {ranking.searchVolume.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              ranking.difficulty <= 30
                                ? 'bg-green-500'
                                : ranking.difficulty <= 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${ranking.difficulty}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{ranking.difficulty}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                          ranking.confidence >= 85
                            ? 'bg-green-100 text-green-700'
                            : ranking.confidence >= 70
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
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
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">No Bluff Policy</h3>
          <p className="text-sm text-blue-800">
            All metrics on this dashboard are verified through DataForSEO and Semrush APIs.
            We practice what we preach - no fake scarcity, no unverifiable claims, just data.
          </p>
          <p className="text-xs text-blue-700 mt-2">
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
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Manual Sync (Admin Only)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Automatic daily sync runs at 6:00 AM UTC via Vercel Cron
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
