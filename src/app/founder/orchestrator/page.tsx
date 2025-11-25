'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrchestratorConsole } from '@/components/orchestrator/OrchestratorConsole';
import { TaskBreakdownView } from '@/components/orchestrator/TaskBreakdownView';
import { ExecutionFlowGraph } from '@/components/orchestrator/ExecutionFlowGraph';
import { OrchestratorSignalsPanel } from '@/components/orchestrator/OrchestratorSignalsPanel';
import { useOrchestratorStore, useOrchestratorPolling } from '@/state/useOrchestratorStore';
import { ArrowRight, RefreshCw, Play, Zap } from 'lucide-react';

export default function OrchestratorPage() {
  const {
    currentTask,
    setCurrentTask,
    activeTab,
    setActiveTab,
    isExecuting,
    setIsExecuting,
    objectiveInput,
    setObjectiveInput,
    descriptionInput,
    setDescriptionInput,
    recentTasks,
    addRecentTask,
    reset,
  } = useOrchestratorStore();

  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  // Setup polling for current task
  useOrchestratorPolling(currentTask?.taskId || null);

  const handlePlanWorkflow = async () => {
    if (!objectiveInput.trim()) {
      setPlanError('Objective is required');
      return;
    }

    setIsPlanning(true);
    setPlanError(null);

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const response = await fetch('/api/orchestrator/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          workspaceId: 'founder', // Founder workspace
          objective: objectiveInput,
          description: descriptionInput || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to plan workflow');
      }

      const plan = await response.json();

      const newTask = {
        taskId: plan.taskId,
        objective: objectiveInput,
        status: 'pending' as const,
        agentChain: plan.agentChain,
        steps: plan.steps,
        estimatedRisk: plan.estimatedRisk,
        riskScore: plan.estimatedRisk,
        uncertaintyScore: 50,
        signals: [],
        finalOutput: null,
        totalTimeMs: 0,
        createdAt: new Date().toISOString(),
      };

      setCurrentTask(newTask);
      addRecentTask(newTask);
      setActiveTab('execution');
      setObjectiveInput('');
      setDescriptionInput('');
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Failed to plan workflow');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!currentTask?.taskId) {
      setExecuteError('No task to execute');
      return;
    }

    setIsExecuting(true);
    setExecuteError(null);

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const response = await fetch('/api/orchestrator/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          workspaceId: 'founder',
          taskId: currentTask.taskId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute workflow');
      }

      const trace = await response.json();

      setCurrentTask({
        ...currentTask,
        status: trace.status,
        steps: trace.steps,
        riskScore: trace.riskScore,
        uncertaintyScore: trace.uncertaintyScore,
        signals: trace.signals,
        finalOutput: trace.finalOutput,
        totalTimeMs: trace.totalTimeMs,
      });
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : 'Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetDashboard = () => {
    reset();
    setObjectiveInput('');
    setDescriptionInput('');
    setPlanError(null);
    setExecuteError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orchestrator Intelligence Center</h1>
        <p className="text-gray-600 mt-2">
          Multi-agent workflow coordination with real-time monitoring and risk management
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTask ? 1 : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Completed workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {currentTask?.riskScore ?? 0}%
              </span>
              <Badge
                variant={
                  (currentTask?.riskScore ?? 0) >= 80
                    ? 'destructive'
                    : (currentTask?.riskScore ?? 0) >= 60
                    ? 'secondary'
                    : 'outline'
                }
              >
                {(currentTask?.riskScore ?? 0) >= 80
                  ? 'Critical'
                  : (currentTask?.riskScore ?? 0) >= 60
                  ? 'High'
                  : 'Normal'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Task assessment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Uncertainty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTask?.uncertaintyScore ?? 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Confidence level</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plan" className="text-xs sm:text-sm">
            Plan
          </TabsTrigger>
          <TabsTrigger value="execution" className="text-xs sm:text-sm">
            Execute
          </TabsTrigger>
          <TabsTrigger value="flow" className="text-xs sm:text-sm">
            Flow Graph
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-xs sm:text-sm">
            Signals
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            History
          </TabsTrigger>
        </TabsList>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Objective *</label>
                <Input
                  placeholder="e.g., Process email queue and score leads for outreach"
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  disabled={isPlanning || isExecuting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <Textarea
                  placeholder="Additional context for the orchestrator..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  disabled={isPlanning || isExecuting}
                  rows={3}
                />
              </div>

              {planError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {planError}
                </div>
              )}

              <Button
                onClick={handlePlanWorkflow}
                disabled={isPlanning || isExecuting}
                className="w-full gap-2"
              >
                {isPlanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Plan Workflow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Task Breakdown */}
          {currentTask && (
            <Card>
              <CardHeader>
                <CardTitle>Proposed Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskBreakdownView
                  steps={currentTask.steps}
                  agentChain={currentTask.agentChain}
                  estimatedRisk={currentTask.estimatedRisk}
                />

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleExecuteWorkflow}
                    disabled={isExecuting || currentTask.status === 'running'}
                    className="gap-2"
                    size="lg"
                  >
                    <Play className="w-4 h-4" />
                    Execute Workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetDashboard}
                    disabled={isExecuting}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution">
          {currentTask ? (
            <div className="space-y-4">
              {executeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {executeError}
                </div>
              )}
              <OrchestratorConsole task={currentTask} isExecuting={isExecuting} />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  Plan a workflow first using the Plan tab
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Flow Graph Tab */}
        <TabsContent value="flow">
          {currentTask ? (
            <Card>
              <CardContent className="pt-6">
                <ExecutionFlowGraph
                  agentChain={currentTask.agentChain}
                  steps={currentTask.steps}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  Plan a workflow first using the Plan tab
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals">
          {currentTask ? (
            <OrchestratorSignalsPanel
              signals={currentTask.signals || []}
              taskId={currentTask.taskId}
              isLoading={isExecuting}
              onResolve={async (signalId) => {
                // Resolve signal logic
                console.log('Resolving signal:', signalId);
              }}
              onPause={async () => {
                // Pause workflow logic
                if (currentTask) {
                  setCurrentTask({
                    ...currentTask,
                    status: 'paused',
                  });
                }
              }}
              onHalt={async () => {
                // Halt workflow logic
                if (currentTask) {
                  setCurrentTask({
                    ...currentTask,
                    status: 'halted',
                  });
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  Execute a workflow to view signals
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <p className="text-center text-gray-500">No recent workflows</p>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.taskId}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setCurrentTask(task);
                        setActiveTab('execution');
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.objective}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant={
                              task.status === 'completed'
                                ? 'default'
                                : task.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {task.status}
                          </Badge>
                          {task.riskScore && (
                            <Badge variant="outline">
                              {task.riskScore}% risk
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
