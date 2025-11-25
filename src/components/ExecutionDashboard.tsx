/**
 * Execution Dashboard Component
 * Phase 4: Task 3 - Frontend Execution UI
 *
 * Real-time visualization of autonomous strategy execution with:
 * - Execution status and progress
 * - Task queue and execution timeline
 * - Health metrics and performance graphs
 * - Agent performance breakdown
 * - Control buttons (pause, resume, cancel)
 * - Live event streaming
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react';
import { executionBridge, type BridgeEvent, type ExecutionState } from '@/lib/strategy/execution-bridge';

interface ExecutionDashboardProps {
  executionId: string;
  strategyId: string;
  workspaceId: string;
  onClose?: () => void;
}

export default function ExecutionDashboard({
  executionId,
  strategyId,
  workspaceId,
  onClose,
}: ExecutionDashboardProps) {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    'connecting'
  );
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial state
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/executions/${executionId}/status`);

        if (!response.ok) {
          throw new Error(`Failed to fetch execution status: ${response.status}`);
        }

        const data = await response.json();
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch execution status');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialState();
  }, [executionId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = executionBridge.subscribe(executionId, (newState) => {
      setState(newState);
    });

    // Update connection status
    const connectionStatus = executionBridge.getConnectionStatus(executionId);
    setConnectionStatus(connectionStatus);

    return () => {
      unsubscribe();
    };
  }, [executionId]);

  // Connect to bridge
  useEffect(() => {
    const connectBridge = async () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/executions/${executionId}/stream`;

        await executionBridge.connectWebSocket(executionId, wsUrl);
        setConnectionStatus('connected');
      } catch (error) {
        console.warn('WebSocket connection failed, using SSE fallback:', error);
        const baseUrl = window.location.origin;
        executionBridge.connectSSE(executionId, baseUrl);
      }
    };

    connectBridge();

    return () => {
      executionBridge.disconnect(executionId);
    };
  }, [executionId]);

  // Control handlers
  const handlePause = useCallback(async () => {
    try {
      setIsControlling(true);
      await executionBridge.pauseExecution(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause execution');
    } finally {
      setIsControlling(false);
    }
  }, [executionId]);

  const handleResume = useCallback(async () => {
    try {
      setIsControlling(true);
      await executionBridge.resumeExecution(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume execution');
    } finally {
      setIsControlling(false);
    }
  }, [executionId]);

  const handleCancel = useCallback(async () => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;

    try {
      setIsControlling(true);
      await executionBridge.cancelExecution(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel execution');
    } finally {
      setIsControlling(false);
    }
  }, [executionId]);

  const handleRefresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/executions/${executionId}/status`);
      if (response.ok) {
        const data = await response.json();
        setState(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    }
  }, [executionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin">
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load execution dashboard</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { execution, tasks, health, metrics } = state;
  const completionPercent =
    execution.totalTasks > 0 ? (execution.completedTasks / execution.totalTasks) * 100 : 0;
  const tasksByAgent = tasks?.reduce(
    (acc, task) => {
      acc[task.agent_type] = (acc[task.agent_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Strategy Execution
              </CardTitle>
              <CardDescription>Real-time autonomous execution monitoring</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {connectionStatus === 'connected' ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <span className="h-2 w-2 bg-green-600 rounded-full" />
                      Connected
                    </span>
                  ) : connectionStatus === 'connecting' ? (
                    <span className="text-yellow-600 flex items-center gap-1">
                      <span className="h-2 w-2 bg-yellow-600 rounded-full animate-pulse" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <span className="h-2 w-2 bg-red-600 rounded-full" />
                      Disconnected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{execution.status}</p>
            <p className="text-xs text-gray-500 mt-1">
              {execution.startedAt
                ? new Date(execution.startedAt).toLocaleString()
                : 'Not started'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(completionPercent)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {execution.completedTasks}/{execution.totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(health.score || 0)}/100</p>
            <p className="text-xs text-gray-500 mt-1">
              {health.completionRate !== undefined
                ? `${Math.round(health.completionRate * 100)}% completion`
                : 'Calculating...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{health.issues?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Errors/warnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercent} className="mb-2" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Completed: </span>
              <span className="text-green-600">{execution.completedTasks}</span>
            </div>
            <div>
              <span className="font-medium">Pending: </span>
              <span className="text-blue-600">
                {execution.totalTasks - execution.completedTasks - execution.failedTasks}
              </span>
            </div>
            <div>
              <span className="font-medium">Failed: </span>
              <span className="text-red-600">{execution.failedTasks}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {execution.status === 'running' && (
              <Button
                onClick={handlePause}
                disabled={isControlling}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}

            {(execution.status === 'paused' || execution.status === 'pending') && (
              <Button
                onClick={handleResume}
                disabled={isControlling}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}

            {execution.status !== 'completed' && execution.status !== 'cancelled' && (
              <Button
                onClick={handleCancel}
                disabled={isControlling}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}

            <Button
              onClick={handleRefresh}
              disabled={isControlling}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      {Object.keys(tasksByAgent).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tasksByAgent).map(([agent, count]) => (
                <div key={agent} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{agent}</span>
                  <span className="text-gray-600">{count} tasks</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues */}
      {health.issues && health.issues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {health.issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-red-700">
                  • {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
