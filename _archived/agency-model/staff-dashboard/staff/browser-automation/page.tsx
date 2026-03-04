'use client';

/**
 * Browser Automation Page
 *
 * Manage replay tasks and learned patterns.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  Zap,
  Brain,
  Layers,
  History,
  Settings,
} from 'lucide-react';

type TaskStatus = 'active' | 'paused' | 'archived';
type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
type PatternCategory = 'login' | 'form_fill' | 'data_extraction' | 'navigation' | 'custom';
type PatternStatus = 'active' | 'draft' | 'deprecated';

interface ReplayTask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  schedule: {
    cron: string;
    timezone: string;
    enabled: boolean;
  } | null;
  stepsCount: number;
  lastRunAt: string | null;
  lastRunStatus: RunStatus | null;
  successRate: number;
  totalRuns: number;
  createdAt: string;
}

interface ReplayRun {
  id: string;
  taskId: string;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  stepsCompleted: number;
  stepsTotal: number;
  error: string | null;
}

interface LearnedPattern {
  id: string;
  name: string;
  category: PatternCategory;
  status: PatternStatus;
  domain: string;
  urlPattern: string;
  confidence: number;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
}

interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  scheduledTasks: number;
  totalRuns: number;
  successRate: number;
}

interface PatternStats {
  totalPatterns: number;
  activePatterns: number;
  avgConfidence: number;
  totalUsage: number;
}

export default function BrowserAutomationPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [tasks, setTasks] = useState<ReplayTask[]>([]);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [runHistory, setRunHistory] = useState<ReplayRun[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [patternStats, setPatternStats] = useState<PatternStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/browser-automation/replay?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.data) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token]);

  const fetchTaskStats = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch(`/api/browser-automation/replay?workspaceId=${workspaceId}&type=stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.stats) {
        setTaskStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchPatterns = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch(`/api/browser-automation/patterns?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.data) {
        setPatterns(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchPatternStats = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;

    try {
      const response = await fetch(`/api/browser-automation/patterns?workspaceId=${workspaceId}&type=stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.stats) {
        setPatternStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch pattern stats:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchRunHistory = useCallback(async (taskId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        `/api/browser-automation/replay?workspaceId=${workspaceId}&type=history&taskId=${taskId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      const data = await response.json();
      if (data.history) {
        setRunHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch run history:', error);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
    fetchPatterns();
    fetchPatternStats();
  }, [fetchTasks, fetchTaskStats, fetchPatterns, fetchPatternStats]);

  useEffect(() => {
    if (selectedTask) {
      fetchRunHistory(selectedTask);
    }
  }, [selectedTask, fetchRunHistory]);

  const handleRunTask = async (taskId: string) => {
    if (!session?.access_token) return;

    try {
      await fetch('/api/browser-automation/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'run',
          taskId,
        }),
      });

      fetchTasks();
      if (selectedTask === taskId) {
        fetchRunHistory(taskId);
      }
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
    if (!session?.access_token) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await fetch('/api/browser-automation/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'duplicate',
          taskId,
          newName: `${task.name} (Copy)`,
        }),
      });

      fetchTasks();
    } catch (error) {
      console.error('Failed to duplicate task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.access_token) return;

    try {
      await fetch('/api/browser-automation/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          taskId,
        }),
      });

      fetchTasks();
      if (selectedTask === taskId) {
        setSelectedTask(null);
        setRunHistory([]);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: PatternCategory) => {
    switch (category) {
      case 'login':
        return '🔐';
      case 'form_fill':
        return '📝';
      case 'data_extraction':
        return '📊';
      case 'navigation':
        return '🧭';
      case 'custom':
        return '⚙️';
      default:
        return '📌';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    return t.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPatterns = patterns.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Browser Automation</h1>
          <p className="text-muted-foreground">
            Manage replay tasks and learned patterns for browser automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTasks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{taskStats?.totalTasks || tasks.length}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{taskStats?.activeTasks || 0}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{taskStats?.scheduledTasks || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{((taskStats?.successRate || 0) * 100).toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patterns</p>
                <p className="text-2xl font-bold">{patternStats?.totalPatterns || patterns.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{((patternStats?.avgConfidence || 0) * 100).toFixed(0)}%</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Replay Tasks</TabsTrigger>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Replay Tasks</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTask === task.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTask(task.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{task.name}</p>
                              <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                                {task.status}
                              </Badge>
                              {task.schedule?.enabled && (
                                <Badge variant="outline">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{task.stepsCount} steps</span>
                              <span>{task.totalRuns} runs</span>
                              <span>{(task.successRate * 100).toFixed(0)}% success</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.lastRunStatus && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(task.lastRunStatus)}
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunTask(task.id);
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {tasks.length === 0
                          ? 'No tasks created yet. Create your first replay task.'
                          : 'No tasks match your search.'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Details */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Task Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTask ? (
                    (() => {
                      const task = tasks.find((t) => t.id === selectedTask);
                      if (!task) return null;

                      return (
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium text-lg">{task.name}</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Steps</p>
                              <p className="font-medium">{task.stepsCount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Runs</p>
                              <p className="font-medium">{task.totalRuns}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Success Rate</p>
                              <p className="font-medium">{(task.successRate * 100).toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Last Run</p>
                              <p className="font-medium">
                                {task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>

                          {task.schedule && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4" />
                                <p className="font-medium">Schedule</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{task.schedule.cron}</p>
                              <p className="text-sm text-muted-foreground">{task.schedule.timezone}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => handleRunTask(task.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDuplicateTask(task.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Recent Runs */}
                          <div>
                            <p className="font-medium mb-2">Recent Runs</p>
                            <div className="space-y-2">
                              {runHistory.slice(0, 5).map((run) => (
                                <div key={run.id} className="flex items-center justify-between text-sm p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(run.status)}
                                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                                  </div>
                                  <span className="text-muted-foreground">{formatDuration(run.duration)}</span>
                                </div>
                              ))}
                              {runHistory.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">No runs yet</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a task to view details
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Learned Patterns</CardTitle>
                  <CardDescription>AI-learned patterns for smart element selection</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patterns..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatterns.map((pattern) => (
                  <div key={pattern.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(pattern.category)}</span>
                        <div>
                          <p className="font-medium">{pattern.name}</p>
                          <p className="text-sm text-muted-foreground">{pattern.domain}</p>
                        </div>
                      </div>
                      <Badge variant={pattern.status === 'active' ? 'default' : 'secondary'}>
                        {pattern.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <div className="flex items-center gap-2">
                          <Progress value={pattern.confidence * 100} className="w-20 h-2" />
                          <span>{(pattern.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Usage</span>
                        <span>{pattern.usageCount} times</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last used</span>
                        <span>{pattern.lastUsed ? new Date(pattern.lastUsed).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPatterns.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    {patterns.length === 0
                      ? 'No patterns learned yet. Patterns are automatically learned from your browser sessions.'
                      : 'No patterns match your search.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
              <CardDescription>Complete history of all task executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Task</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Progress</th>
                      <th className="text-left py-3 px-4">Started</th>
                      <th className="text-right py-3 px-4">Duration</th>
                      <th className="text-left py-3 px-4">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runHistory.map((run) => {
                      const task = tasks.find((t) => t.id === run.taskId);
                      return (
                        <tr key={run.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <p className="font-medium">{task?.name || 'Unknown Task'}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(run.stepsCompleted / run.stepsTotal) * 100}
                                className="w-20 h-2"
                              />
                              <span className="text-sm text-muted-foreground">
                                {run.stepsCompleted}/{run.stepsTotal}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{new Date(run.startedAt).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{formatDuration(run.duration)}</td>
                          <td className="py-3 px-4">
                            {run.error && (
                              <span className="text-sm text-red-600 truncate max-w-48 block">{run.error}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {runHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No run history available. Run a task to see its history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
