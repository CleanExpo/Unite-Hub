/**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <string | null> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <Activity className="h-4 w-4 text-blue-500 animate-pulse" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <CheckCircle2 className="h-4 w-4 text-green-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <XCircle className="h-4 w-4 text-red-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <XCircle className="h-3 w-3 text-red-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <AlertTriangle className="h-3 w-3 text-yellow-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <CheckCircle2 className="h-3 w-3 text-blue-500" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" /> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span> /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => /**
 * Execution Log Component
 * Displays real-time execution logs and monitoring for the AI agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  Download,
  Filter,
  Search,
  Trash2,
  Eye
} from 'lucide-react';

import { ExecutionContext } from '../types';

export interface ExecutionLogProps {
  executions: ExecutionContext[];
  queuedCommands: number;
  onCancelExecution?: (executionId: string) => void;
  onClearLogs?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  executionId?: string;
  source?: string;
}

export function ExecutionLog({ 
  executions, 
  queuedCommands, 
  onCancelExecution,
  onClearLogs,
  className 
}: ExecutionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate log generation for active executions
  useEffect(() => {
    const interval = setInterval(() => {
      executions.forEach(execution => {
        if (execution.status === 'running') {
          // Simulate log entries
          const logMessages = [
            `Starting ${execution.command} execution`,
            `Processing command arguments: ${execution.metadata?.args?.join(' ') || 'none'}`,
            `Executing phase: ${execution.metadata?.phase || 'unknown'}`,
            `Docker container initializing...`,
            `Running tests for current phase`,
            `Validation checks in progress`,
            `Command execution proceeding normally`
          ];

          const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
          const newLog: LogEntry = {
            id: `${execution.execution_id}-${Date.now()}`,
            timestamp: new Date(),
            level: Math.random() > 0.8 ? 'warn' : 'info',
            message: randomMessage,
            executionId: execution.execution_id,
            source: 'agent-executor'
          };

          setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [executions]);

  // Add completion logs when executions finish
  useEffect(() => {
    executions.forEach(execution => {
      if (execution.status === 'completed' || execution.status === 'failed') {
        const completionLog: LogEntry = {
          id: `${execution.execution_id}-complete`,
          timestamp: new Date(),
          level: execution.status === 'completed' ? 'info' : 'error',
          message: `Execution ${execution.status}: ${execution.command}`,
          executionId: execution.execution_id,
          source: 'agent-manager'
        };

        setLogs(prev => {
          // Check if we already have this completion log
          if (prev.some(log => log.id === completionLog.id)) {
            return prev;
          }
          return [...prev.slice(-49), completionLog];
        });
      }
    });
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'debug':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExecution = !selectedExecution || log.executionId === selectedExecution;
    
    return matchesLevel && matchesSearch && matchesExecution;
  });

  const getExecutionProgress = (execution: ExecutionContext): number => {
    if (execution.status === 'completed') return 100;
    if (execution.status === 'failed' || execution.status === 'cancelled') return 0;
    
    const elapsed = Date.now() - execution.start_time.getTime();
    const timeout = execution.metadata?.timeout || 30000;
    return Math.min((elapsed / timeout) * 0.95, 95); // Cap at 95% while running
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!onClearLogs) {
      return;
    }

    try {
      const logData = filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        executionId: log.executionId,
        source: log.source
      }));

      const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Execution Monitor</h3>
          <p className="text-sm text-muted-foreground">
            {executions.length} active • {queuedCommands} queued • {filteredLogs.length} logs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {onClearLogs && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Executions</CardTitle>
          <CardDescription>Currently running and queued commands</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.execution_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium text-sm">{execution.command}</span>
                      <Badge variant={getStatusBadgeVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.start_time, execution.end_time)}
                      </span>
                      {onCancelExecution && execution.status === 'running' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancelExecution(execution.execution_id)}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {execution.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={getExecutionProgress(execution)} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        Progress: {Math.round(getExecutionProgress(execution))}%
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {execution.error}
                    </div>
                  )}

                  {execution.output && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      {execution.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active executions</p>
            </div>
          )}

          {queuedCommands > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{queuedCommands} command{queuedCommands !== 1 ? 's' : ''} queued</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="log-search" className="text-xs">
                Search Logs
                <span className="text-xs text-gray-500 ml-1">(Search messages...)</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="log-search"
                  Unite Group="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-level" className="text-xs">
                Log Level
                <span className="text-xs text-gray-500 ml-1">(All Levels)</span>
              </Label>
              <select
                id="filter-level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by log level"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filter-execution" className="text-xs">
                Execution
                <span className="text-xs text-gray-500 ml-1">(All Executions)</span>
              </Label>
              <select
                id="filter-execution"
                value={selectedExecution || 'all'}
                onChange={(e) => setSelectedExecution(e.target.value === 'all' ? null : e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-8"
                aria-label="Filter by execution"
              >
                <option value="all">All Executions</option>
                {executions.map(execution => (
                  <option key={execution.execution_id} value={execution.execution_id}>
                    {execution.command} ({execution.execution_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setSelectedExecution(null);
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
.Value -replace "'", "'" <Filter className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Logs</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-scroll" className="text-xs">
                Auto-scroll
                <span className="text-xs text-gray-500 ml-1">(Toggle auto-scroll)</span>
              </Label>
              <input
                id="auto-scroll"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-3 w-3"
                aria-label="Auto-scroll to new logs"
              />
            </div>
          </div>
          <CardDescription>Real-time execution logs and output</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] font-mono text-xs">
            {filteredLogs.length > 0 ? (
              <div className="space-y-1">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.source && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.executionId && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {log.executionId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs match current filters</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutionLog;
