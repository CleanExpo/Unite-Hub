'use client';

/**
 * Topic Radar Panel
 *
 * Displays discovered topics, trends, and opportunities for founder decision-making.
 * Shows emerging topics, trending keywords, and actionable opportunities.
 *
 * @module ui/components/founder/TopicRadarPanel
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Sparkles, Target, RefreshCw, AlertCircle } from 'lucide-react';
import type { TopicRadar, TopicSignal, TrendOpportunity } from '@/lib/intel/topicDiscoveryEngine';

interface TopicRadarPanelProps {
  workspaceId: string;
  industryContext?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function TopicRadarPanel({
  workspaceId,
  industryContext,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: TopicRadarPanelProps) {
  const [radar, setRadar] = useState<TopicRadar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch topic radar data
  const fetchRadar = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/founder/topic-radar?workspaceId=${workspaceId}${
          industryContext ? `&industry=${industryContext}` : ''
        }`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch topic radar');
      }

      const data = await response.json();
      setRadar(data.radar);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRadar();
  }, [workspaceId, industryContext]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
return;
}

    const interval = setInterval(() => {
      fetchRadar();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, workspaceId, industryContext]);

  if (loading && !radar) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Topic Radar
          </CardTitle>
          <CardDescription>Discovering topics and trends...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Topic Radar Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchRadar} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!radar) {
return null;
}

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Topic Radar
            </CardTitle>
            <CardDescription>
              {radar.summary.total_signals} signals detected •{' '}
              {radar.summary.high_priority_opportunities} high priority
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={fetchRadar} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="opportunities">
              Opportunities
              {radar.summary.high_priority_opportunities > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {radar.summary.high_priority_opportunities}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="emerging">
              Emerging
              <Badge variant="default" className="ml-2">
                {radar.emerging_topics.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="trending">
              Trending
              <Badge variant="secondary" className="ml-2">
                {radar.trending_topics.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="declining">
              Declining
              <Badge variant="outline" className="ml-2">
                {radar.declining_topics.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <OpportunitiesList opportunities={radar.opportunities} />
          </TabsContent>

          <TabsContent value="emerging" className="space-y-4">
            <SignalsList signals={radar.emerging_topics} type="emerging" />
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <SignalsList signals={radar.trending_topics} type="trending" />
          </TabsContent>

          <TabsContent value="declining" className="space-y-4">
            <SignalsList signals={radar.declining_topics} type="declining" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Opportunities List Component
function OpportunitiesList({ opportunities }: { opportunities: TrendOpportunity[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No opportunities detected yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.slice(0, 10).map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}

// Opportunity Card Component (simplified, full version in TrendOpportunityCard.tsx)
function OpportunityCard({ opportunity }: { opportunity: TrendOpportunity }) {
  const priorityColors = {
    critical: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  } as const;

  const urgencyIcons = {
    immediate: '🔥',
    this_week: '⚡',
    this_month: '📅',
    this_quarter: '📆',
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{opportunity.topic}</h4>
            <Badge variant={priorityColors[opportunity.priority]}>
              {opportunity.priority.toUpperCase()}
            </Badge>
            <span className="text-lg">{urgencyIcons[opportunity.time_window.urgency]}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {opportunity.opportunity_type.replace(/_/g, ' ')} • Confidence: {opportunity.confidence_score}%
          </p>
          <div className="flex flex-wrap gap-2">
            {opportunity.recommended_actions.slice(0, 2).map((action, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {action.action_type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </div>
    </div>
  );
}

// Signals List Component
function SignalsList({
  signals,
  type,
}: {
  signals: TopicSignal[];
  type: 'emerging' | 'trending' | 'declining';
}) {
  if (signals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No {type} topics detected</p>
      </div>
    );
  }

  const Icon = type === 'declining' ? TrendingDown : TrendingUp;

  return (
    <div className="space-y-2">
      {signals.slice(0, 15).map((signal) => (
        <div key={signal.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Icon className={`h-4 w-4 ${type === 'declining' ? 'text-destructive' : 'text-green-500'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{signal.topic}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {signal.source.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Strength: {signal.strength}/100
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Velocity: {signal.velocity > 0 ? '+' : ''}{signal.velocity}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
