"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lightbulb, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FailureAnalysisPanelProps {
  taskId: string;
}

export function FailureAnalysisPanel({ taskId }: FailureAnalysisPanelProps) {
  const { currentOrganization } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [taskMetadata, setTaskMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [taskId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = currentOrganization?.org_id;
      if (!workspaceId) {
        setError('No workspace selected');
        return;
      }

      const response = await fetch(
        `/api/orchestrator/dashboard/tasks/${taskId}/failures?workspaceId=${workspaceId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setTaskMetadata(data.taskMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load failure analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Analyzing failure...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          Error: {error}
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No failure analysis available
        </CardContent>
      </Card>
    );
  }

  const priorityColors = {
    high: 'border-red-500 bg-red-50 dark:bg-red-950',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  };

  return (
    <div className="space-y-4">
      {/* Root Cause Card */}
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            Root Cause Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Failure Type */}
          <div>
            <p className="text-sm font-semibold mb-2">Failure Type:</p>
            <Badge variant="destructive" className="text-sm">
              {analysis.failureType.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Root Cause */}
          <div>
            <p className="text-sm font-semibold mb-2">Root Cause:</p>
            <Alert>
              <AlertDescription className="text-sm">{analysis.rootCause}</AlertDescription>
            </Alert>
          </div>

          {/* Task Context */}
          {taskMetadata && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Objective</p>
                <p className="text-sm">{taskMetadata.objective}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Steps</p>
                <p className="text-sm">
                  {taskMetadata.completedSteps} / {taskMetadata.totalSteps} completed
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Steps */}
      {analysis.failedSteps && analysis.failedSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Failed Steps ({analysis.failedSteps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.failedSteps.map((step: any) => (
              <div key={step.stepIndex} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    Step {step.stepIndex + 1}: {step.assignedAgent}
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    {step.verificationAttempts} / 3 attempts
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Error:</p>
                  <code className="block bg-muted p-2 rounded text-xs break-all">
                    {step.error}
                  </code>
                </div>
                {step.lastVerificationError && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Verification Error:</p>
                    <code className="block bg-muted p-2 rounded text-xs break-all">
                      {step.lastVerificationError}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Impacted Steps */}
      {analysis.impactedSteps && analysis.impactedSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Downstream Impact</CardTitle>
            <CardDescription>
              Steps blocked by the failure (all-or-nothing enforcement)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.impactedSteps.map((step: any) => (
                <div
                  key={step.stepIndex}
                  className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                >
                  <span className="text-muted-foreground">Step {step.stepIndex + 1}:</span>
                  <Badge variant="outline">{step.assignedAgent}</Badge>
                  <Badge variant="secondary">{step.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence from Failure */}
      {analysis.failureEvidence && analysis.failureEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence from Failure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.failureEvidence.map((evidence: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="destructive" className="text-xs">
                    {evidence.criterion}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {evidence.checked_at
                      ? new Date(evidence.checked_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  {evidence.proof}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recovery Suggestions */}
      {analysis.recoverySuggestions && analysis.recoverySuggestions.length > 0 && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Lightbulb className="h-5 w-5" />
              Recovery Suggestions
            </CardTitle>
            <CardDescription>
              Recommended actions to resolve this failure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.recoverySuggestions.map((suggestion: any, idx: number) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded ${
                  priorityColors[suggestion.priority as keyof typeof priorityColors]
                }`}
              >
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{suggestion.action}</p>
                      <Badge
                        variant={
                          suggestion.priority === 'high'
                            ? 'destructive'
                            : suggestion.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
