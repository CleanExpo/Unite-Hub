'use client';

/**
 * Agent Console - Real-time command log viewer
 *
 * Displays live stream of desktop agent commands, results, and errors
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Trash2, Download } from 'lucide-react';
import { log } from '@/lib/logger-client';

interface ConsoleLog {
  id: string;
  timestamp: Date;
  type: 'command' | 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  details?: Record<string, any>;
}

interface AgentConsoleProps {
  workspaceId: string;
  accessToken: string;
  autoRefresh?: boolean;
  maxLogs?: number;
}

export function AgentConsole({
  workspaceId,
  accessToken,
  autoRefresh = true,
  maxLogs = 100,
}: AgentConsoleProps) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/desktop/logs?workspaceId=${workspaceId}&limit=${maxLogs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      log.error('Failed to fetch console logs', { error: err, workspaceId });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [workspaceId, accessToken]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, workspaceId, accessToken, maxLogs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'command':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      case 'success':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-bg-raised text-text-secondary';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'command':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const content = logs
      .map((log) => `[${log.timestamp.toISOString()}] ${log.type.toUpperCase()}: ${log.title} - ${log.message}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-console-${new Date().toISOString()}.log`;
    a.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Agent Console</CardTitle>
          <CardDescription>Real-time command execution log</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div
          ref={scrollRef}
          className="space-y-2 bg-gray-900 dark:bg-gray-950 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Agent commands will appear here...</div>
          ) : (
            logs.map((logEntry) => (
              <div
                key={logEntry.id}
                className={`p-2 rounded border-l-4 ${getLogColor(logEntry.type)}`}
              >
                <div className="flex items-start gap-2">
                  <Badge className={getBadgeVariant(logEntry.type)}>
                    {logEntry.type.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-semibold">{logEntry.title}</div>
                    <div className="text-xs opacity-75">
                      {logEntry.timestamp.toLocaleTimeString()}
                    </div>
                    {logEntry.message && (
                      <div className="mt-1">{logEntry.message}</div>
                    )}
                    {logEntry.details && (
                      <div className="mt-2 p-2 bg-gray-800 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        <pre>{JSON.stringify(logEntry.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-gray-500">
          {logs.length} log entries (max {maxLogs})
          {autoRefresh && ' • Auto-refreshing every 5s'}
        </div>
      </CardContent>
    </Card>
  );
}
