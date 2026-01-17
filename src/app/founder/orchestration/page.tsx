'use client';

/**
 * Founder Orchestration Console
 * Phase 84: Campaign orchestration dashboard with schedules, channel health, conflicts, and decision log
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  RefreshCw,
  Play,
  Calendar,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { OrchestrationScheduleTable } from '@/components/orchestration/OrchestrationScheduleTable';
import { OrchestrationChannelHealth } from '@/components/orchestration/OrchestrationChannelHealth';
import { OrchestrationConflictMap } from '@/components/orchestration/OrchestrationConflictMap';
import { OrchestrationDecisionLog } from '@/components/orchestration/OrchestrationDecisionLog';

// Demo workspace ID
const DEMO_WORKSPACE_ID = 'demo-workspace';

interface OrchestrationOverview {
  total_schedules: number;
  pending_schedules: number;
  completed_today: number;
  blocked_schedules: number;
  active_channels: number;
  avg_confidence: number;
}

export default function FounderOrchestrationPage() {
  const [overview, setOverview] = useState<OrchestrationOverview | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [channelSummaries, setChannelSummaries] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [overviewRes, schedulesRes, channelsRes, actionsRes] = await Promise.all([
        fetch(`/api/orchestration/schedules?workspaceId=${DEMO_WORKSPACE_ID}&type=overview`),
        fetch(`/api/orchestration/schedules?workspaceId=${DEMO_WORKSPACE_ID}`),
        fetch(`/api/orchestration/schedules?workspaceId=${DEMO_WORKSPACE_ID}&type=channels`),
        fetch(`/api/orchestration/scheduler?workspaceId=${DEMO_WORKSPACE_ID}&type=actions&limit=50`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }

      if (schedulesRes.ok) {
        const data = await schedulesRes.json();
        setSchedules(data.data || []);
        // Extract conflicts from schedules
        const blockedSchedules = (data.data || []).filter((s: any) => s.status === 'blocked');
        setConflicts(blockedSchedules.map((s: any) => ({
          id: s.id,
          type: 'schedule_blocked',
          severity: s.risk_level === 'high' ? 'high' : 'medium',
          description: s.blocked_reason || 'Schedule blocked',
          affected_items: [s.channel],
          resolution_suggestion: 'Review and adjust schedule timing or content',
          detected_at: s.updated_at,
        })));
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannelSummaries(data.data || []);
      }

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runDailyPass = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/orchestration/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: 'daily',
        }),
      });

      if (res.ok) {
        // Reload data after running
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to run daily pass:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runWeeklyPlanning = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/orchestration/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          action: 'weekly',
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to run weekly planning:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/orchestration/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          scheduleId: id,
          action: 'approve',
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to approve schedule:', error);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/orchestration/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEMO_WORKSPACE_ID,
          scheduleId: id,
          action: 'cancel',
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Campaign Orchestration
          </h1>
          <p className="text-muted-foreground">
            Multi-agent campaign coordination and scheduling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" onClick={runDailyPass} disabled={isRunning}>
            <Play className="h-4 w-4 mr-2" />
            Run Daily
          </Button>

          <Button onClick={runWeeklyPlanning} disabled={isRunning}>
            <Calendar className="h-4 w-4 mr-2" />
            Plan Week
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{overview.total_schedules}</div>
              <p className="text-xs text-muted-foreground">Total Schedules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-warning-500">
                {overview.pending_schedules}
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success-500">
                {overview.completed_today}
              </div>
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-error-500">
                {overview.blocked_schedules}
              </div>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{overview.active_channels}</div>
              <p className="text-xs text-muted-foreground">Active Channels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {Math.round(overview.avg_confidence * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
            {schedules.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {schedules.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Channel Health
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conflicts
            {conflicts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {conflicts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Decision Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          <OrchestrationScheduleTable
            schedules={schedules}
            onApprove={handleApproveSchedule}
            onCancel={handleCancelSchedule}
          />
        </TabsContent>

        <TabsContent value="channels">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelSummaries.length > 0 ? (
              channelSummaries.map(summary => (
                <OrchestrationChannelHealth
                  key={summary.channel}
                  channel={summary.channel}
                  state={summary.state || {
                    fatigue_score: 0,
                    momentum_score: 0.5,
                    visibility_score: 0.5,
                    engagement_score: 0.5,
                    last_post_at: null,
                  }}
                  stats={{
                    pending: summary.pending_count || 0,
                    completed: summary.completed_count || 0,
                    blocked: summary.blocked_count || 0,
                  }}
                />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No channel data available. Run weekly planning to generate schedules.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conflicts">
          <OrchestrationConflictMap
            conflicts={conflicts}
            onResolve={id => console.log('Resolve conflict:', id)}
          />
        </TabsContent>

        <TabsContent value="decisions">
          <OrchestrationDecisionLog actions={actions} />
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="border-info-500/30 bg-info-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Brain className="h-4 w-4 text-info-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Phase 84 Mode:</strong> The orchestration engine creates draft posts only.
              Actual publishing is disabled until Phase 85+ when integration with social media
              APIs is complete.
            </p>
            <p className="mt-2">
              All decisions are logged with full context, confidence scores, and truth notes
              for transparency and audit purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
