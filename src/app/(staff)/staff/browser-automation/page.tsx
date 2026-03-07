'use client';

/**
 * Browser Automation Page
 *
 * Manage replay tasks and learned patterns.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
        return <CheckCircle className="h-4 w-4" style={{ color: '#00FF88' }} />;
      case 'failed':
        return <XCircle className="h-4 w-4" style={{ color: '#FF4444' }} />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#00F5FF' }} />;
      case 'pending':
        return <Clock className="h-4 w-4" style={{ color: '#FFB800' }} />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-white/40" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return 'border border-[#00FF88]/30 text-[#00FF88]';
      case 'failed':
        return 'border border-[#FF4444]/30 text-[#FF4444]';
      case 'running':
        return 'border border-[#00F5FF]/30 text-[#00F5FF]';
      case 'pending':
        return 'border border-[#FFB800]/30 text-[#FFB800]';
      case 'cancelled':
        return 'border border-white/10 text-white/40';
      default:
        return 'border border-white/10 text-white/40';
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

  const tabs = ['tasks', 'patterns', 'history'];
  const tabLabels: Record<string, string> = { tasks: 'Replay Tasks', patterns: 'Learned Patterns', history: 'Run History' };

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">Browser Automation</h1>
            <p className="text-white/40 mt-1 font-mono text-sm">
              Manage replay tasks and learned patterns for browser automation
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchTasks}
              disabled={isLoading}
              className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90">
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Total Tasks', value: taskStats?.totalTasks || tasks.length, icon: <Layers className="h-6 w-6" style={{ color: '#00F5FF' }} /> },
            { label: 'Active', value: taskStats?.activeTasks || 0, icon: <Play className="h-6 w-6" style={{ color: '#00FF88' }} /> },
            { label: 'Scheduled', value: taskStats?.scheduledTasks || 0, icon: <Calendar className="h-6 w-6" style={{ color: '#FF00FF' }} /> },
            { label: 'Success Rate', value: `${((taskStats?.successRate || 0) * 100).toFixed(0)}%`, icon: <CheckCircle className="h-6 w-6" style={{ color: '#00FF88' }} /> },
            { label: 'Patterns', value: patternStats?.totalPatterns || patterns.length, icon: <Brain className="h-6 w-6" style={{ color: '#FF00FF' }} /> },
            { label: 'Avg Confidence', value: `${((patternStats?.avgConfidence || 0) * 100).toFixed(0)}%`, icon: <Zap className="h-6 w-6" style={{ color: '#FFB800' }} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-white/[0.06] mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-mono text-sm px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#00F5FF] text-[#00F5FF]'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h2 className="font-mono text-white font-bold">Replay Tasks</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        placeholder="Search tasks..."
                        className="bg-white/[0.04] border border-white/[0.06] rounded-sm pl-9 pr-3 py-1.5 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                          selectedTask === task.id
                            ? 'border-[#00F5FF]/40 bg-[#00F5FF]/5'
                            : 'border-white/[0.06] hover:border-white/20'
                        }`}
                        onClick={() => setSelectedTask(task.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-mono font-medium text-white">{task.name}</p>
                              <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                                task.status === 'active'
                                  ? 'border-[#00FF88]/30 text-[#00FF88]'
                                  : 'border-white/10 text-white/40'
                              }`}>
                                {task.status}
                              </span>
                              {task.schedule?.enabled && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Scheduled
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/40 font-mono">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-white/30 font-mono">
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
                            <button
                              className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-1.5 hover:bg-white/[0.08]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunTask(task.id);
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="text-center py-8 text-white/30 font-mono text-sm">
                        {tasks.length === 0
                          ? 'No tasks created yet. Create your first replay task.'
                          : 'No tasks match your search.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="lg:col-span-1">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm sticky top-6">
                  <div className="p-4 border-b border-white/[0.06]">
                    <h2 className="font-mono text-white font-bold">Task Details</h2>
                  </div>
                  <div className="p-4">
                    {selectedTask ? (
                      (() => {
                        const task = tasks.find((t) => t.id === selectedTask);
                        if (!task) return null;

                        return (
                          <div className="space-y-4">
                            <div>
                              <p className="font-mono font-medium text-white text-lg">{task.name}</p>
                              <p className="text-sm text-white/40 font-mono">{task.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: 'Steps', value: task.stepsCount },
                                { label: 'Total Runs', value: task.totalRuns },
                                { label: 'Success Rate', value: `${(task.successRate * 100).toFixed(0)}%` },
                                { label: 'Last Run', value: task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : 'Never' },
                              ].map((item) => (
                                <div key={item.label}>
                                  <p className="text-xs text-white/40 font-mono">{item.label}</p>
                                  <p className="font-mono font-medium text-white">{item.value}</p>
                                </div>
                              ))}
                            </div>

                            {task.schedule && (
                              <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="h-4 w-4 text-white/40" />
                                  <p className="font-mono font-medium text-white text-sm">Schedule</p>
                                </div>
                                <p className="text-xs text-white/40 font-mono">{task.schedule.cron}</p>
                                <p className="text-xs text-white/40 font-mono">{task.schedule.timezone}</p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                className="flex-1 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#00F5FF]/90"
                                onClick={() => handleRunTask(task.id)}
                              >
                                <Play className="h-4 w-4" />
                                Run Now
                              </button>
                              <button
                                className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-2 hover:bg-white/[0.08]"
                                onClick={() => handleDuplicateTask(task.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-2 hover:bg-white/[0.08]">
                                <Settings className="h-4 w-4" />
                              </button>
                              <button
                                className="bg-white/[0.04] border border-[#FF4444]/20 text-[#FF4444] rounded-sm p-2 hover:bg-[#FF4444]/10"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div>
                              <p className="font-mono font-medium text-white mb-2 text-sm">Recent Runs</p>
                              <div className="space-y-2">
                                {runHistory.slice(0, 5).map((run) => (
                                  <div key={run.id} className="flex items-center justify-between text-sm p-2 border border-white/[0.06] rounded-sm">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(run.status)}
                                      <span className="font-mono text-xs text-white/60">{new Date(run.startedAt).toLocaleString()}</span>
                                    </div>
                                    <span className="text-white/30 font-mono text-xs">{formatDuration(run.duration)}</span>
                                  </div>
                                ))}
                                {runHistory.length === 0 && (
                                  <p className="text-sm text-white/30 font-mono text-center py-2">No runs yet</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-8 text-white/30 font-mono text-sm">
                        Select a task to view details
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-white font-bold">Learned Patterns</h2>
                  <p className="text-xs text-white/40 font-mono mt-0.5">AI-learned patterns for smart element selection</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    placeholder="Search patterns..."
                    className="bg-white/[0.04] border border-white/[0.06] rounded-sm pl-9 pr-3 py-1.5 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatterns.map((pattern) => (
                    <div key={pattern.id} className="p-4 border border-white/[0.06] rounded-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(pattern.category)}</span>
                          <div>
                            <p className="font-mono font-medium text-white">{pattern.name}</p>
                            <p className="text-xs text-white/40 font-mono">{pattern.domain}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                          pattern.status === 'active'
                            ? 'border-[#00FF88]/30 text-[#00FF88]'
                            : 'border-white/10 text-white/40'
                        }`}>
                          {pattern.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/40">Confidence</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00F5FF] rounded-full"
                                style={{ width: `${pattern.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-white/60">{(pattern.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/40">Usage</span>
                          <span className="text-white/60">{pattern.usageCount} times</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/40">Last used</span>
                          <span className="text-white/60">{pattern.lastUsed ? new Date(pattern.lastUsed).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredPatterns.length === 0 && (
                    <div className="col-span-full text-center py-8 text-white/30 font-mono text-sm">
                      {patterns.length === 0
                        ? 'No patterns learned yet. Patterns are automatically learned from your browser sessions.'
                        : 'No patterns match your search.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Run History</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">Complete history of all task executions</p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-3 px-4 font-mono text-xs text-white/40 font-normal">Task</th>
                        <th className="text-center py-3 px-4 font-mono text-xs text-white/40 font-normal">Status</th>
                        <th className="text-center py-3 px-4 font-mono text-xs text-white/40 font-normal">Progress</th>
                        <th className="text-left py-3 px-4 font-mono text-xs text-white/40 font-normal">Started</th>
                        <th className="text-right py-3 px-4 font-mono text-xs text-white/40 font-normal">Duration</th>
                        <th className="text-left py-3 px-4 font-mono text-xs text-white/40 font-normal">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runHistory.map((run) => {
                        const task = tasks.find((t) => t.id === run.taskId);
                        return (
                          <tr key={run.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <p className="font-mono font-medium text-white text-sm">{task?.name || 'Unknown Task'}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${getStatusColor(run.status)}`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#00F5FF] rounded-full"
                                    style={{ width: `${(run.stepsCompleted / run.stepsTotal) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/30 font-mono">
                                  {run.stepsCompleted}/{run.stepsTotal}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-white/60">{new Date(run.startedAt).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-xs font-mono text-white/60">{formatDuration(run.duration)}</td>
                            <td className="py-3 px-4">
                              {run.error && (
                                <span className="text-xs font-mono truncate max-w-48 block" style={{ color: '#FF4444' }}>{run.error}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {runHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-white/30 font-mono text-sm">
                            No run history available. Run a task to see its history.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
