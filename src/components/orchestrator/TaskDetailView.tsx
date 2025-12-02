"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { ExecutionTimeline } from './ExecutionTimeline';
import { VerificationStatusPanel } from './VerificationStatusPanel';
import { EvidencePackageViewer } from './EvidencePackageViewer';
import { FailureAnalysisPanel } from './FailureAnalysisPanel';
import { formatAbsoluteTime, formatDuration } from '@/lib/orchestrator/dashboard-service';

interface TaskDetailViewProps {
  task: any;
  steps: any[];
  timeline: any[];
  verificationResults: any[];
  loading: boolean;
  onBack: () => void;
  onRetry: () => void;
  onViewEvidence: () => void;
}

export function TaskDetailView({
  task,
  steps,
  timeline,
  verificationResults,
  loading,
  onBack,
  onRetry,
  onViewEvidence,
}: TaskDetailViewProps) {
  const [activeTab, setActiveTab] = useState('timeline');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading task details...
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Task not found
        </CardContent>
      </Card>
    );
  }

  const statusColor =
    task.status === 'completed'
      ? 'bg-green-500'
      : task.status === 'failed' || task.status === 'halted'
      ? 'bg-red-500'
      : task.status === 'running'
      ? 'bg-blue-500'
      : 'bg-yellow-500';

  const statusIcon =
    task.status === 'completed'
      ? '✅'
      : task.status === 'failed' || task.status === 'halted'
      ? '❌'
      : task.status === 'running'
      ? '🔄'
      : '⏳';

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
            <div className="flex gap-2">
              {(task.status === 'failed' || task.status === 'halted') && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Task
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onViewEvidence}>
                <FileText className="mr-2 h-4 w-4" />
                View Evidence
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{statusIcon}</span>
              <div>
                <h2 className="text-2xl font-bold">{task.objective}</h2>
                <p className="text-sm text-muted-foreground">Task ID: {task.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={statusColor}>{task.status}</Badge>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Created: {formatAbsoluteTime(task.createdAt)}
              </Badge>
              {task.completedAt && (
                <Badge variant="outline">
                  <Clock className="mr-1 h-3 w-3" />
                  Completed: {formatAbsoluteTime(task.completedAt)}
                </Badge>
              )}
              {task.totalDuration && (
                <Badge variant="outline">
                  Duration: {formatDuration(task.totalDuration)}
                </Badge>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Risk Score</p>
              <p
                className={`text-2xl font-bold ${
                  task.riskScore > 0.7
                    ? 'text-red-500'
                    : task.riskScore > 0.4
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              >
                {Math.round(task.riskScore * 100)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Confidence Score</p>
              <p
                className={`text-2xl font-bold ${
                  task.confidenceScore > 0.7
                    ? 'text-green-500'
                    : task.confidenceScore > 0.4
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {Math.round(task.confidenceScore * 100)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Uncertainty</p>
              <p className="text-2xl font-bold">
                {Math.round(task.uncertaintyScore * 100)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agent Chain</p>
              <p className="text-2xl font-bold">{task.agentChain.length}</p>
            </div>
          </div>

          {/* Agent Chain */}
          {task.agentChain.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Agent Chain:</p>
              <div className="flex flex-wrap gap-2">
                {task.agentChain.map((agent: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {idx + 1}. {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="analysis">
            {task.status === 'failed' || task.status === 'halted' ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Failure Analysis
              </>
            ) : (
              'Analysis'
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <ExecutionTimeline timeline={timeline} />
        </TabsContent>

        <TabsContent value="verification" className="mt-4">
          <VerificationStatusPanel steps={steps} />
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <EvidencePackageViewer taskId={task.id} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          {task.status === 'failed' || task.status === 'halted' ? (
            <FailureAnalysisPanel taskId={task.id} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Task completed successfully - no failure analysis needed
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
