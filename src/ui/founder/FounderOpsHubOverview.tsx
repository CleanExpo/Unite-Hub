'use client';

/**
 * Founder Ops Hub Overview
 *
 * Dashboard overview showing summary cards and key metrics for the Founder Ops Hub.
 * Displays brand workload distribution, pending approvals, upcoming deadlines, and queue status.
 *
 * @module ui/founder/FounderOpsHubOverview
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  PlayCircle,
  PauseCircle,
  RefreshCw,
} from 'lucide-react';

interface FounderOpsHubOverviewProps {
  workspaceId: string;
}

interface OverviewMetrics {
  total_tasks: number;
  pending_approvals: number;
  scheduled_today: number;
  completed_today: number;
  overdue_tasks: number;
  queue_status: 'active' | 'paused' | 'completed';
  by_brand: Record<string, number>;
  by_priority: Record<string, number>;
  next_deadline?: {
    task_id: string;
    title: string;
    deadline: string;
    brand: string;
  };
}

export default function FounderOpsHubOverview({ workspaceId }: FounderOpsHubOverviewProps) {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch overview metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/founder/ops/overview?workspaceId=${workspaceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch overview metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
  }, [workspaceId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ops Hub Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Overview Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No metrics available'}</p>
          <Button onClick={fetchMetrics} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{metrics.total_tasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Across all brands</div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Approvals
            </CardDescription>
            <CardTitle className="text-3xl">{metrics.pending_approvals}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.pending_approvals > 0 ? (
              <Button size="sm" variant="outline" className="w-full">
                Review Now
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">All caught up!</div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Today
            </CardDescription>
            <CardTitle className="text-3xl">{metrics.scheduled_today}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {metrics.completed_today} completed
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className={metrics.overdue_tasks > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Overdue Tasks
            </CardDescription>
            <CardTitle className="text-3xl">{metrics.overdue_tasks}</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.overdue_tasks > 0 ? (
              <div className="text-xs text-destructive">Requires attention</div>
            ) : (
              <div className="text-xs text-green-600">On track</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Execution Queue Status</CardTitle>
            <Badge
              variant={
                metrics.queue_status === 'active'
                  ? 'default'
                  : metrics.queue_status === 'paused'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {metrics.queue_status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
              {metrics.queue_status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
              {metrics.queue_status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {metrics.queue_status.charAt(0).toUpperCase() + metrics.queue_status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {metrics.completed_today} / {metrics.scheduled_today} tasks
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2"
                style={{
                  width: `${metrics.scheduled_today > 0 ? (metrics.completed_today / metrics.scheduled_today) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Distribution</CardTitle>
          <CardDescription>Active tasks per brand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.by_brand).map(([brand, count]) => (
              <div key={brand} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{brand}</span>
                </div>
                <Badge variant="outline">{count} tasks</Badge>
              </div>
            ))}
            {Object.keys(metrics.by_brand).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No tasks scheduled
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <CardDescription>Tasks by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-500">{metrics.by_priority.urgent || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Urgent</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{metrics.by_priority.high || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">High</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">{metrics.by_priority.medium || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Medium</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{metrics.by_priority.low || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Deadline */}
      {metrics.next_deadline && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Next Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{metrics.next_deadline.title}</div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{metrics.next_deadline.brand}</Badge>
                <span>Due: {new Date(metrics.next_deadline.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
