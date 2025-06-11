/**
 * Agent Dashboard Component
 * Main dashboard for monitoring and controlling the AI agent
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square,
  RefreshCw,
  Settings,
  Terminal,
  GitBranch,
  TestTube,
  Zap
} from 'lucide-react';

import { useAgentState } from '../hooks/use-agent-state';
import { PhaseStatus, AgentStatus } from '../types';
import { AgentControls } from './agent-controls';
import { TaskList } from './task-list';
import { ExecutionLog } from './execution-log';

export interface AgentDashboardProps {
  className?: string;
}

export function AgentDashboard({ className }: AgentDashboardProps) {
  const {
    state,
    isInitialized,
    isLoading,
    error,
    activeExecutions,
    queuedCommands,
    getAllTasks,
    getTasksByPhase,
    refresh,
    isReady
  } = useAgentState();

  const getStatusBadgeVariant = (status: PhaseStatus | AgentStatus) => {
    switch (status) {
      case PhaseStatus.COMPLETE:
      case AgentStatus.IDLE:
        return 'default';
      case PhaseStatus.IN_PROGRESS:
      case AgentStatus.RUNNING:
        return 'secondary';
      case PhaseStatus.TESTING:
        return 'outline';
      case PhaseStatus.FAILED:
      case AgentStatus.ERROR:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getProgressPercentage = () => {
    const totalPhases = 4; // foundation, implementation, integration, deployment
    const completedPhases = state.completed_phases.length;
    return (completedPhases / totalPhases) * 100;
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'foundation':
        return <GitBranch className="h-4 w-4" />;
      case 'implementation':
        return <Terminal className="h-4 w-4" />;
      case 'integration':
        return <TestTube className="h-4 w-4" />;
      case 'deployment':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Initializing AI Agent...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and control your hybrid AI development agent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant={getStatusBadgeVariant(state.agent_status)}>
            {state.agent_status}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            {state.current_phase && getPhaseIcon(state.current_phase)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.current_phase || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(state.phase_status)}>
                {state.phase_status}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.completed_phases.length}/4
            </div>
            <Progress value={getProgressPercentage()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeExecutions.length}</div>
            <p className="text-xs text-muted-foreground">
              {queuedCommands} queued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Results</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.test_results.length}</div>
            <p className="text-xs text-muted-foreground">
              {state.test_results.filter(t => t.status === 'passed').length} passed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Phase Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Progress</CardTitle>
                <CardDescription>Development phase completion status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['foundation', 'implementation', 'integration', 'deployment'].map((phase) => {
                  const isCompleted = state.completed_phases.includes(phase);
                  const isCurrent = state.current_phase === phase;
                  
                  return (
                    <div key={phase} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPhaseIcon(phase)}
                        <span className={`capitalize ${isCurrent ? 'font-semibold' : ''}`}>
                          {phase}
                        </span>
                      </div>
                      <Badge variant={isCompleted ? 'default' : isCurrent ? 'secondary' : 'outline'}>
                        {isCompleted ? 'Complete' : isCurrent ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest agent actions and responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {state.test_results.slice(-5).map((result, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                        <span className="text-sm">{result.test_name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {result.duration.toFixed(2)}s
                        </span>
                      </div>
                    ))}
                    {state.test_results.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <TaskList 
            tasks={getAllTasks()} 
            currentPhase={state.current_phase}
          />
        </TabsContent>

        <TabsContent value="executions">
          <ExecutionLog 
            executions={activeExecutions}
            queuedCommands={queuedCommands}
          />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from automated tests across all phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {state.test_results.map((result, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{result.test_name}</span>
                        <Badge variant={getStatusBadgeVariant(result.status as any)}>
                          {result.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {result.duration.toFixed(2)}s
                      </div>
                      {result.error_message && (
                        <div className="text-sm text-destructive mt-2">
                          {result.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                  {state.test_results.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No test results available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls">
          <AgentControls />
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last Updated: {state.last_update.toLocaleTimeString()}</span>
              <span>Version: {state.roadmap_version}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isReady ? 'Ready' : 'Not Ready'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentDashboard;
