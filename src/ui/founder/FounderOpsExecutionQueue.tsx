'use client';

/**
 * Founder Ops Execution Queue
 *
 * Daily and weekly execution queue display with timeline view,
 * queue controls, and task management.
 *
 * @module ui/founder/FounderOpsExecutionQueue
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlayCircle,
  PauseCircle,
  SkipForward,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import type { FounderTask } from '@/lib/founderOps/founderOpsTaskLibrary';

interface FounderOpsExecutionQueueProps {
  workspaceId: string;
}

interface DailyQueue {
  date: string;
  tasks: ScheduledTask[];
  total_duration_minutes: number;
  capacity_used_percentage: number;
  by_brand: Record<string, number>;
  by_priority: Record<string, number>;
}

interface ScheduledTask extends FounderTask {
  scheduled_time?: string;
  scheduled_order?: number;
  estimated_duration_minutes: number;
}

interface QueueStatus {
  status: 'active' | 'paused' | 'completed';
  is_paused: boolean;
  current_task?: ScheduledTask;
  next_task?: ScheduledTask;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export default function FounderOpsExecutionQueue({ workspaceId }: FounderOpsExecutionQueueProps) {
  const [queue, setQueue] = useState<DailyQueue | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'today' | 'week'>('today');

  // Fetch queue
  const fetchQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        view === 'today'
          ? `/api/founder/ops/queue/daily?workspaceId=${workspaceId}`
          : `/api/founder/ops/queue/weekly?workspaceId=${workspaceId}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch execution queue');
      }

      const data = await response.json();
      setQueue(data.queue);
      setQueueStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Queue control actions
  const handlePauseQueue = async () => {
    try {
      await fetch(`/api/founder/ops/queue/pause?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      fetchQueue();
    } catch (err) {
      console.error('Failed to pause queue:', err);
    }
  };

  const handleResumeQueue = async () => {
    try {
      await fetch(`/api/founder/ops/queue/resume?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      fetchQueue();
    } catch (err) {
      console.error('Failed to resume queue:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQueue();
  }, [workspaceId, view]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !queue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Execution Queue Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No queue data available'}</p>
          <Button onClick={fetchQueue} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Execution Queue</CardTitle>
              <CardDescription>
                {queue.date} • {queue.tasks.length} tasks • {Math.round(queue.total_duration_minutes / 60)}h estimated
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={view} onValueChange={(v) => setView(v as 'today' | 'week')}>
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button size="sm" variant="outline" onClick={fetchQueue}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Queue Status */}
          {queueStatus && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Queue Status</div>
                  <Badge
                    variant={
                      queueStatus.status === 'active'
                        ? 'default'
                        : queueStatus.status === 'paused'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {queueStatus.status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
                    {queueStatus.status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
                    {queueStatus.status === 'completed' && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {queueStatus.status.charAt(0).toUpperCase() + queueStatus.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Progress</div>
                  <div className="text-sm text-muted-foreground">
                    {queueStatus.progress.completed} / {queueStatus.progress.total} tasks (
                    {queueStatus.progress.percentage}%)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {queueStatus.is_paused ? (
                  <Button size="sm" onClick={handleResumeQueue}>
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePauseQueue}>
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Capacity Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacity</span>
              <span className="text-sm text-muted-foreground">{queue.capacity_used_percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`rounded-full h-2 ${
                  queue.capacity_used_percentage > 90
                    ? 'bg-red-500'
                    : queue.capacity_used_percentage > 70
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, queue.capacity_used_percentage)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Task Timeline</CardTitle>
          <CardDescription>Scheduled execution order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.tasks.map((task, index) => (
            <TaskTimelineItem
              key={task.id}
              task={task}
              index={index}
              isCurrentTask={queueStatus?.current_task?.id === task.id}
              isNextTask={queueStatus?.next_task?.id === task.id}
            />
          ))}
          {queue.tasks.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No tasks scheduled for {view === 'today' ? 'today' : 'this week'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand and Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(queue.by_brand).map(([brand, count]) => (
              <div key={brand} className="flex items-center justify-between">
                <span className="text-sm">{brand}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(queue.by_priority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm capitalize">{priority}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Task Timeline Item Component
function TaskTimelineItem({
  task,
  index,
  isCurrentTask,
  isNextTask,
}: {
  task: ScheduledTask;
  index: number;
  isCurrentTask: boolean;
  isNextTask: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-4 p-3 border rounded-lg ${
        isCurrentTask
          ? 'border-primary bg-primary/5'
          : isNextTask
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
            : ''
      }`}
    >
      {/* Order Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>

      {/* Task Info */}
      <div className="flex-1 space-y-2">
        <div>
          <div className="font-medium text-sm">{task.title}</div>
          <div className="text-xs text-muted-foreground">{task.brand_slug}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {task.archetype.replace(/_/g, ' ')}
          </Badge>
          <Badge
            variant={
              task.priority === 'urgent'
                ? 'destructive'
                : task.priority === 'high'
                  ? 'default'
                  : 'secondary'
            }
            className="text-xs"
          >
            {task.priority}
          </Badge>
          {task.scheduled_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(task.scheduled_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
          <div className="text-xs text-muted-foreground">{task.estimated_duration_minutes} min</div>
        </div>

        {isCurrentTask && (
          <Badge variant="default" className="text-xs">
            <PlayCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )}
        {isNextTask && (
          <Badge variant="outline" className="text-xs text-orange-500">
            <SkipForward className="h-3 w-3 mr-1" />
            Next Up
          </Badge>
        )}
      </div>
    </div>
  );
}
