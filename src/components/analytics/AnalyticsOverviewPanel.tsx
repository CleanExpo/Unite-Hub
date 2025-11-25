'use client';

/**
 * Analytics Overview Panel
 * Displays comprehensive analytics from Search Console, GA4, and SEO data
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

      // Refresh overview after sync
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
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !overview) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchOverview} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
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
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-muted-foreground">
            {overview.dateStart} to {overview.dateEnd}
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Search Console Metrics */}
      {overview.searchConsole && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Search Console Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Impressions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {overview.searchConsole.totalImpressions.toLocaleString()}
                  </span>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                {overview.searchConsole.google && overview.searchConsole.bing && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Google: {overview.searchConsole.google.impressions.toLocaleString()} • Bing:{' '}
                    {overview.searchConsole.bing.impressions.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Clicks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {overview.searchConsole.totalClicks.toLocaleString()}
                  </span>
                  <MousePointerClick className="h-5 w-5 text-muted-foreground" />
                </div>
                {overview.searchConsole.google && overview.searchConsole.bing && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Google: {overview.searchConsole.google.clicks.toLocaleString()} • Bing:{' '}
                    {overview.searchConsole.bing.clicks.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average CTR</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {(overview.searchConsole.averageCtr * 100).toFixed(2)}%
                  </span>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {overview.searchConsole.averagePosition.toFixed(1)}
                  </span>
                  {overview.searchConsole.averagePosition <= 5 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Queries */}
          {overview.searchConsole.topQueries && overview.searchConsole.topQueries.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Top Performing Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overview.searchConsole.topQueries.slice(0, 5).map((query: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{query.query}</p>
                        <p className="text-xs text-muted-foreground">
                          Position {query.position.toFixed(1)} • {query.source}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{query.impressions.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{query.clicks} clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Google Analytics Metrics */}
      {overview.analytics && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Website Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{overview.analytics.sessions.toLocaleString()}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{overview.analytics.users.toLocaleString()}</span>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pageviews</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{overview.analytics.pageviews.toLocaleString()}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bounce Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  {(overview.analytics.bounceRate * 100).toFixed(1)}%
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Keyword Opportunities */}
      {overview.keywords && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Opportunities</CardTitle>
            <CardDescription>{overview.keywords.totalKeywords} keywords tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {overview.keywords.totalSearchVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Search Volume</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{overview.keywords.averageDifficulty.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg Difficulty</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">${overview.keywords.averageCpc.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Avg CPC</p>
                </div>
              </div>

              {overview.keywords.lowHangingFruit && overview.keywords.lowHangingFruit.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Low-Hanging Fruit (Easy Wins)</h4>
                  <div className="space-y-2">
                    {overview.keywords.lowHangingFruit.map((kw: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{kw.keyword}</p>
                          <p className="text-xs text-muted-foreground">{kw.opportunity}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{kw.searchVolume.toLocaleString()}/mo</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Difficulty: {kw.difficulty}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {overview.insights && overview.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.insights.map((insight: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success'
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : insight.type === 'warning'
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {insight.category.replace(/_/g, ' ')}
                      </Badge>
                      <p className="font-medium mb-1">{insight.message}</p>
                      <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                      {insight.keywords && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {insight.keywords.map((kw: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Status */}
      {overview.cacheStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Search Console</p>
                <p className="text-muted-foreground">
                  {overview.cacheStatus.search_console?.valid_entries || 0} entries cached
                </p>
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-muted-foreground">
                  {overview.cacheStatus.analytics?.valid_entries || 0} entries cached
                </p>
              </div>
              <div>
                <p className="font-medium">DataForSEO</p>
                <p className="text-muted-foreground">
                  {overview.cacheStatus.dataforseo?.valid_entries || 0} entries cached
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
