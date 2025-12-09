'use client';

/**
 * Founder Ops Task Board
 *
 * Kanban-style task board for managing Founder Ops tasks.
 * Displays tasks in columns by status with drag-and-drop support.
 *
 * @module ui/founder/FounderOpsTaskBoard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  Plus,
  MoreVertical,
} from 'lucide-react';
import type { FounderTask, TaskStatus, TaskPriority } from '@/lib/founderOps/founderOpsTaskLibrary';

interface FounderOpsTaskBoardProps {
  workspaceId: string;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'draft', label: 'Draft', color: 'gray' },
  { status: 'scheduled', label: 'Scheduled', color: 'blue' },
  { status: 'in_progress', label: 'In Progress', color: 'yellow' },
  { status: 'pending_review', label: 'Pending Review', color: 'orange' },
  { status: 'approved', label: 'Approved', color: 'green' },
  { status: 'completed', label: 'Completed', color: 'green' },
];

export default function FounderOpsTaskBoard({ workspaceId }: FounderOpsTaskBoardProps) {
  const [tasks, setTasks] = useState<FounderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ workspaceId });
      if (filterBrand !== 'all') {
params.append('brand', filterBrand);
}
      if (filterPriority !== 'all') {
params.append('priority', filterPriority);
}

      const response = await fetch(`/api/founder/ops/tasks?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, [workspaceId, filterBrand, filterPriority]);

  // Group tasks by status
  const tasksByStatus = STATUS_COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = tasks.filter((task) => task.status === col.status);
      return acc;
    },
    {} as Record<TaskStatus, FounderTask[]>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
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
            Task Board Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchTasks} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Board</CardTitle>
              <CardDescription>{tasks.length} total tasks</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Button>
              <Button size="sm" variant="outline" onClick={fetchTasks}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="disaster-recovery">Disaster Recovery</SelectItem>
                <SelectItem value="synthex">Synthex</SelectItem>
                <SelectItem value="unite-group">Unite Group</SelectItem>
                <SelectItem value="carsi">CARSI</SelectItem>
                <SelectItem value="nrpg">NRPG</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATUS_COLUMNS.map((column) => (
          <Card key={column.status} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.label}</CardTitle>
                <Badge variant="outline">{tasksByStatus[column.status]?.length || 0}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {tasksByStatus[column.status]?.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {(!tasksByStatus[column.status] || tasksByStatus[column.status].length === 0) && (
                <div className="text-center py-8 text-xs text-muted-foreground">No tasks</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task }: { task: FounderTask }) {
  const priorityColors: Record<TaskPriority, string> = {
    urgent: 'border-red-500 bg-red-50 dark:bg-red-950',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  };

  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${priorityColors[task.priority]}`}>
      <CardContent className="p-3 space-y-2">
        {/* Priority Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {task.priority}
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>

        {/* Title */}
        <div className="font-medium text-sm line-clamp-2">{task.title}</div>

        {/* Brand */}
        <div className="text-xs text-muted-foreground">{task.brand_slug}</div>

        {/* Archetype */}
        <Badge variant="secondary" className="text-xs">
          {task.archetype.replace(/_/g, ' ')}
        </Badge>

        {/* Channels */}
        <div className="flex flex-wrap gap-1">
          {task.channels.slice(0, 2).map((channel) => (
            <Badge key={channel} variant="outline" className="text-xs">
              {channel}
            </Badge>
          ))}
          {task.channels.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{task.channels.length - 2}
            </Badge>
          )}
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
