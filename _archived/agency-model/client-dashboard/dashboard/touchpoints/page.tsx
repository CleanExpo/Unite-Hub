'use client';

/**
 * Client Touchpoints Dashboard
 * Phase 75: View scheduled story touchpoints
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Calendar,
  Clock,
  RefreshCw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StoryTouchpointCard } from '@/ui/components/StoryTouchpointCard';
import { StoryTouchpointList } from '@/ui/components/StoryTouchpointList';
import { CalloutHint, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import {
  StoryTouchpoint,
  TouchpointTimeframe,
} from '@/lib/storytelling/storyTouchpointEngine';
import {
  generateWeeklyTouchpointForClient,
  generateMonthlyTouchpointForClient,
  generate90DayTouchpointForClient,
} from '@/lib/storytelling/storyTouchpointEngine';

export default function ClientTouchpointsPage() {
  const router = useRouter();
  const [touchpoints, setTouchpoints] = useState<StoryTouchpoint[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TouchpointTimeframe | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadTouchpoints();
  }, []);

  const loadTouchpoints = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API
      // For now, generate on-demand
      const workspaceId = 'ws_demo';
      const clientId = 'contact_demo';
      const clientName = 'Your Business';

      const weekly = generateWeeklyTouchpointForClient(workspaceId, clientId, clientName);
      const monthly = generateMonthlyTouchpointForClient(workspaceId, clientId, clientName);
      const ninetyDay = generate90DayTouchpointForClient(workspaceId, clientId, clientName);

      setTouchpoints([weekly, monthly, ninetyDay]);
    } catch (error) {
      console.error('Failed to load touchpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (touchpoint: StoryTouchpoint) => {
    setIsRegenerating(true);
    try {
      // Call API to regenerate
      const response = await fetch('/api/storytelling/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_single',
          workspace_id: touchpoint.workspace_id,
          client_id: touchpoint.client_id,
          client_name: touchpoint.client_name,
          timeframe: touchpoint.timeframe,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update touchpoints list
        setTouchpoints(prev =>
          prev.map(tp =>
            tp.timeframe === touchpoint.timeframe ? data.touchpoint : tp
          )
        );
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleViewStory = (touchpoint: StoryTouchpoint) => {
    router.push('/client/dashboard/stories');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const filteredTouchpoints = selectedTimeframe === 'all'
    ? touchpoints
    : touchpoints.filter(tp => tp.timeframe === selectedTimeframe);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Touchpoints</h1>
          <p className="text-muted-foreground">
            Scheduled updates about your journey progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/client/dashboard/stories')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Full Stories
          </Button>
          <Button
            variant="outline"
            onClick={loadTouchpoints}
            disabled={isRegenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">
                Touchpoints are regular story summaries generated from your journey data.
                They help you track progress without needing to read full reports each time.
              </p>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Weekly: Every Monday</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Monthly: 1st of month</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>90-Day: At milestones</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <Tabs
        value={selectedTimeframe}
        onValueChange={(v) => setSelectedTimeframe(v as TouchpointTimeframe | 'all')}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="ninety_day">90-Day</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="mt-6">
          {filteredTouchpoints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTouchpoints.map((touchpoint) => (
                <StoryTouchpointCard
                  key={touchpoint.touchpoint_id}
                  touchpoint={touchpoint}
                  onView={() => handleViewStory(touchpoint)}
                  onRegenerate={() => handleRegenerate(touchpoint)}
                />
              ))}
            </div>
          ) : (
            <NoDataPlaceholder
              message="No touchpoints for this timeframe"
              suggestion="Select a different filter or check back later"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Link to journey */}
      <CalloutHint
        variant="explore"
        title="See Your Full Journey"
        description="View the complete 90-day map and all your milestones"
        actionLabel="Open Journey"
        onAction={() => router.push('/client/dashboard/journey')}
      />
    </div>
  );
}
