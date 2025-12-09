'use client';

/**
 * AgentExecutionConsole
 * Real-time execution log with streaming updates from Synthex
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, Play, Pause } from 'lucide-react';

export interface ExecutionStep {
  step_number: number;
  action_type: string;
  status: string;
  promised_outcome: string;
  actual_outcome?: string;
  execution_time_ms?: number;
  error_message?: string;
}

export interface AgentExecutionConsoleProps {
  runId?: string;
  planId: string;
  workspaceId: string;
  accessToken: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200';
    case 'running':
      return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200';
    case 'failed':
      return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
    case 'pending':
      return 'bg-bg-raised text-text-primary';
    case 'skipped':
      return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200';
    default:
      return 'bg-bg-raised text-text-primary';
  }
};

export function AgentExecutionConsole({
  runId,
  planId,
  workspaceId,
  accessToken,
  autoRefresh = true,
  refreshInterval = 2000,
}: AgentExecutionConsoleProps) {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');

  // Fetch execution status
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        planId,
        ...(runId && { runId }),
      });

      const response = await fetch(`/api/agent/status?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch status');
        return;
      }

      const data = await response.json();
      setSteps(data.steps || []);
      setSummary(data.summary);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    // Fetch immediately
    fetchStatus();

    if (!isAutoRefreshing) {
return;
}

    const interval = setInterval(() => {
      fetchStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [workspaceId, planId, runId, accessToken, isAutoRefreshing, refreshInterval]);

  // Export logs
  const handleExport = () => {
    const logText = steps
      .map(
        (step) =>
          `[Step ${step.step_number}] ${step.action_type} - ${step.status}
    Promised: ${step.promised_outcome}
    Actual: ${step.actual_outcome || 'Pending'}
    Time: ${step.execution_time_ms}ms
    ${step.error_message ? `Error: ${step.error_message}` : ''}
`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-log-${planId.substring(0, 8)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Execution Console</CardTitle>
            <CardDescription>
              Real-time execution log - Last updated: {lastUpdate}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
            >
              {isAutoRefreshing ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={fetchStatus} disabled={isLoading}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-bg-raised rounded">
            <div>
              <p className="text-xs font-semibold text-text-secondary">Total Steps</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {summary.total_steps}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">Completed</p>
              <p className="text-lg font-bold text-green-600">{summary.completed_steps}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">Failed</p>
              <p className="text-lg font-bold text-red-600">{summary.failed_steps}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">Success Rate</p>
              <p className="text-lg font-bold text-blue-600">{summary.success_rate}</p>
            </div>
          </div>
        )}

        {/* Execution Steps */}
        <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
          {steps.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No steps to display. Fetching...
            </p>
          ) : (
            steps.map((step) => (
              <div
                key={step.step_number}
                className="border border-border-subtle rounded p-3 bg-bg-raised"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Step {step.step_number}: {step.action_type}</span>
                  <Badge className={getStatusBadgeColor(step.status)}>
                    {step.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-text-secondary">
                  <div>
                    <span className="font-semibold">Promised:</span> {step.promised_outcome}
                  </div>
                  {step.actual_outcome && (
                    <div>
                      <span className="font-semibold">Actual:</span> {step.actual_outcome}
                    </div>
                  )}
                  {step.execution_time_ms && (
                    <div>
                      <span className="font-semibold">Duration:</span> {step.execution_time_ms}ms
                    </div>
                  )}
                  {step.error_message && (
                    <div className="text-red-600 dark:text-red-400">
                      <span className="font-semibold">Error:</span> {step.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {isLoading && (
          <div className="text-center text-sm text-text-secondary">
            Updating...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
