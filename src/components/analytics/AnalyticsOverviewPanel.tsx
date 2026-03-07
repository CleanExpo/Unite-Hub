'use client';

/**
 * Analytics Overview Panel
 * Displays comprehensive analytics from Search Console, GA4, and SEO data
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Eye, MousePointerClick, Target, Users } from 'lucide-react';

interface AnalyticsOverviewProps {
  workspaceId: string;
  brandSlug?: string;
}

export function AnalyticsOverviewPanel({ workspaceId, brandSlug }: AnalyticsOverviewProps) {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ workspaceId });
      if (brandSlug) params.append('brandSlug', brandSlug);

      const response = await fetch(`/api/analytics/overview?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics overview');
      }

      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const params = new URLSearchParams({ workspaceId });
      const body: any = {};
      if (brandSlug) body.brandSlug = brandSlug;

      const response = await fetch(`/api/analytics/sync?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [workspaceId, brandSlug]);

  if (loading && !overview) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-white/20" />
          <span className="ml-3 text-white/40 font-mono text-xs uppercase tracking-widest">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12">
        <div className="text-center">
          <p className="text-[#FF4444] font-mono text-sm mb-4">{error}</p>
          <button
            onClick={fetchOverview}
            className="px-4 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white/90">Analytics Overview</h2>
          <p className="text-white/30 font-mono text-sm">
            {overview.dateStart} to {overview.dateEnd}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Search Console Metrics */}
      {overview.searchConsole && (
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-4">Search Console Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Total Impressions</p>
                <Eye className="h-4 w-4 text-white/20" />
              </div>
              <span className="text-2xl font-bold font-mono text-white/90">
                {overview.searchConsole.totalImpressions.toLocaleString()}
              </span>
              {overview.searchConsole.google && overview.searchConsole.bing && (
                <div className="mt-2 text-xs font-mono text-white/20">
                  Google: {overview.searchConsole.google.impressions.toLocaleString()} · Bing:{' '}
                  {overview.searchConsole.bing.impressions.toLocaleString()}
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Total Clicks</p>
                <MousePointerClick className="h-4 w-4 text-white/20" />
              </div>
              <span className="text-2xl font-bold font-mono text-white/90">
                {overview.searchConsole.totalClicks.toLocaleString()}
              </span>
              {overview.searchConsole.google && overview.searchConsole.bing && (
                <div className="mt-2 text-xs font-mono text-white/20">
                  Google: {overview.searchConsole.google.clicks.toLocaleString()} · Bing:{' '}
                  {overview.searchConsole.bing.clicks.toLocaleString()}
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Average CTR</p>
                <Target className="h-4 w-4 text-white/20" />
              </div>
              <span className="text-2xl font-bold font-mono text-white/90">
                {(overview.searchConsole.averageCtr * 100).toFixed(2)}%
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Average Position</p>
                {overview.searchConsole.averagePosition <= 5 ? (
                  <TrendingUp className="h-4 w-4 text-[#00FF88]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#FFB800]" />
                )}
              </div>
              <span className="text-2xl font-bold font-mono text-white/90">
                {overview.searchConsole.averagePosition.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Top Queries */}
          {overview.searchConsole.topQueries && overview.searchConsole.topQueries.length > 0 && (
            <div className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h4 className="text-sm font-mono font-bold text-white/90">Top Performing Queries</h4>
              </div>
              <div className="p-4 space-y-2">
                {overview.searchConsole.topQueries.slice(0, 5).map((query: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-white/90">{query.query}</p>
                      <p className="text-xs font-mono text-white/20">
                        Position {query.position.toFixed(1)} · {query.source}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-white/90">{query.impressions.toLocaleString()}</p>
                      <p className="text-xs font-mono text-white/20">{query.clicks} clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Google Analytics Metrics */}
      {overview.analytics && (
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-4">Website Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Sessions</p>
              <span className="text-2xl font-bold font-mono text-white/90">{overview.analytics.sessions.toLocaleString()}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Users</p>
                <Users className="h-4 w-4 text-white/20" />
              </div>
              <span className="text-2xl font-bold font-mono text-white/90">{overview.analytics.users.toLocaleString()}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Pageviews</p>
              <span className="text-2xl font-bold font-mono text-white/90">{overview.analytics.pageviews.toLocaleString()}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Bounce Rate</p>
              <span className="text-2xl font-bold font-mono text-white/90">
                {(overview.analytics.bounceRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Opportunities */}
      {overview.keywords && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90 mb-1">Keyword Opportunities</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">{overview.keywords.totalKeywords} keywords tracked</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold font-mono text-white/90">
                  {overview.keywords.totalSearchVolume.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Total Search Volume</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white/90">{overview.keywords.averageDifficulty.toFixed(1)}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Avg Difficulty</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white/90">${overview.keywords.averageCpc.toFixed(2)}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Avg CPC</p>
              </div>
            </div>

            {overview.keywords.lowHangingFruit && overview.keywords.lowHangingFruit.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Low-Hanging Fruit (Easy Wins)</h4>
                <div className="space-y-2">
                  {overview.keywords.lowHangingFruit.map((kw: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/[0.02] rounded-sm">
                      <div>
                        <p className="font-mono text-sm text-white/90">{kw.keyword}</p>
                        <p className="text-xs font-mono text-white/30">{kw.opportunity}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60">
                          {kw.searchVolume.toLocaleString()}/mo
                        </span>
                        <p className="text-[10px] font-mono text-white/20 mt-1">
                          Difficulty: {kw.difficulty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {overview.insights && overview.insights.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Insights & Recommendations</h3>
          </div>
          <div className="p-4 space-y-3">
            {overview.insights.map((insight: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-sm border ${
                  insight.type === 'success'
                    ? 'border-[#00FF88]/20 bg-[#00FF88]/[0.04]'
                    : insight.type === 'warning'
                      ? 'border-[#FFB800]/20 bg-[#FFB800]/[0.04]'
                      : 'border-[#00F5FF]/20 bg-[#00F5FF]/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/40 mb-2 inline-block">
                      {insight.category.replace(/_/g, ' ')}
                    </span>
                    <p className="font-mono text-sm text-white/90 mb-1">{insight.message}</p>
                    <p className="text-xs font-mono text-white/40">{insight.recommendation}</p>
                    {insight.keywords && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {insight.keywords.map((kw: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/40">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Status */}
      {overview.cacheStatus && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Cache Status</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-mono text-sm text-white/90">Search Console</p>
                <p className="text-xs font-mono text-white/30">
                  {overview.cacheStatus.search_console?.valid_entries || 0} entries cached
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-white/90">Analytics</p>
                <p className="text-xs font-mono text-white/30">
                  {overview.cacheStatus.analytics?.valid_entries || 0} entries cached
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-white/90">DataForSEO</p>
                <p className="text-xs font-mono text-white/30">
                  {overview.cacheStatus.dataforseo?.valid_entries || 0} entries cached
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
