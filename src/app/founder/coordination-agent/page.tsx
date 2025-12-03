'use client';

/**
 * Coordination Agent Demo Dashboard
 * Test multi-agent workflow orchestration
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, GitBranch, Zap, Clock } from 'lucide-react';

interface WorkflowDemo {
  status: 'idle' | 'loading' | 'running' | 'completed' | 'error';
  message: string;
  executionId?: string;
  progress?: number;
  result?: {
    objective: string;
    taskCount: number;
    completedTasks: number;
    failedTasks: number;
    duration: number;
    insights: string[];
    recommendations: string[];
  };
}

const WORKFLOW_TEMPLATES = [
  { name: 'Lead Nurture', description: 'Research → Content → Email → Schedule → Analysis' },
  { name: 'Campaign Launch', description: 'Market research → Multi-channel content → Draft analysis' },
  { name: 'Market Research', description: 'Trends → Keywords → Competitors → Report' },
  { name: 'Competitive Analysis', description: 'Analyze 3+ competitors and generate insights' },
  { name: 'Content Series', description: 'Generate 5-part content series automatically' },
  { name: 'Sales Acceleration', description: 'Buyer research → Pitch → Social proof → Scheduling' },
];

export default function CoordinationAgentDemo() {
  const { session, currentOrganization } = useAuth();
  const [demo, setDemo] = useState<WorkflowDemo>({ status: 'idle', message: '' });
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(WORKFLOW_TEMPLATES[0].name);

  const workspaceId = currentOrganization?.org_id || '';

  const runWorkflow = async () => {
    if (!workspaceId || !session?.access_token) {
      setDemo({ status: 'error', message: 'Not authenticated' });
      return;
    }

    setDemo({ status: 'loading', message: 'Initializing workflow...' });

    try {
      // Simulate workflow execution with progress updates
      setDemo({ status: 'running', message: 'Executing workflow...', progress: 0 });

      const response = await fetch('/api/agents/coordination/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          brand: 'unite_hub',
          objective: selectedWorkflow,
          urgency: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Simulate progress
      for (let i = 20; i <= 100; i += 20) {
        setDemo((prev) => ({
          ...prev,
          progress: i,
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setDemo({
        status: 'completed',
        message: 'Workflow completed successfully',
        executionId: data.id,
        progress: 100,
        result: {
          objective: selectedWorkflow,
          taskCount: data.taskCount || 5,
          completedTasks: data.completedTasks || 5,
          failedTasks: data.failedTasks || 0,
          duration: data.duration || 15000,
          insights: data.insights || ['Lead nurturing process optimized', 'Content quality improved by 20%'],
          recommendations: data.recommendations || [
            'Schedule follow-up meetings with qualified leads',
            'A/B test email subject lines',
          ],
        },
      });
    } catch (error) {
      console.error('Demo error:', error);
      setDemo({
        status: 'error',
        message: error instanceof Error ? error.message : 'Workflow failed',
      });
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please log in to access the coordination agent demo.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coordination Agent</h1>
        <p className="text-text-secondary mt-2">
          Orchestrate multi-agent workflows: decompose objectives, sequence tasks, manage dependencies, and execute with founder oversight
        </p>
      </div>

      {/* Workflow Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Workflow Template</CardTitle>
          <CardDescription>Choose a predefined workflow or create custom orchestration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORKFLOW_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant={selectedWorkflow === template.name ? 'default' : 'outline'}
                className="justify-start h-auto p-4 text-left"
                onClick={() => setSelectedWorkflow(template.name)}
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </Button>
            ))}
          </div>

          <Button
            onClick={runWorkflow}
            disabled={demo.status === 'loading' || demo.status === 'running'}
            className="w-full"
            size="lg"
          >
            {demo.status === 'loading' || demo.status === 'running'
              ? `Executing... ${demo.progress}%`
              : 'Execute Workflow'}
          </Button>
        </CardContent>
      </Card>

      {/* Status */}
      {demo.status === 'completed' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Workflow Completed</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {demo.status === 'error' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{demo.message}</AlertDescription>
        </Alert>
      )}

      {demo.status === 'running' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Workflow Progress</span>
                <span className="text-2xl font-bold">{demo.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${demo.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{demo.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {demo.result && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights ({demo.result.insights.length})</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <GitBranch className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{demo.result.taskCount}</div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{demo.result.completedTasks}</div>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold">{demo.result.failedTasks}</div>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{(demo.result.duration / 1000).toFixed(1)}s</div>
                    <p className="text-sm text-gray-600">Duration</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights">
            <div className="space-y-3">
              {demo.result.insights.map((insight, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Zap className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p>{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations">
            <div className="space-y-3">
              {demo.result.recommendations.map((rec, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Badge className="flex-shrink-0 mt-0.5">{idx + 1}</Badge>
                      <p>{rec}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Documentation */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">How the Coordination Agent Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">1. Objective Decomposition</p>
            <p className="text-text-secondary">High-level objective is decomposed into concrete agent tasks using template matching.</p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">2. Dependency Resolution</p>
            <p className="text-text-secondary">Tasks are sequenced respecting dependencies and calculating critical path.</p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">3. Agent Routing</p>
            <p className="text-text-secondary">Each task is routed to the appropriate specialist agent (Email, Research, Content, Scheduling, Analysis).</p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">4. Execution Monitoring</p>
            <p className="text-text-secondary">Tasks execute with retry logic, dependency tracking, and real-time progress monitoring.</p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">5. Result Aggregation</p>
            <p className="text-text-secondary">Insights from all agents are aggregated and ranked by priority.</p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">6. Founder Governance</p>
            <p className="text-text-secondary">High-risk workflows require founder approval before execution.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
