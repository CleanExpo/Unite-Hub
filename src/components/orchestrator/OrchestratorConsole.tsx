'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Play, Pause, ChevronDown, Copy, Zap } from 'lucide-react';
import { useOrchestratorStore } from '@/state/useOrchestratorStore';

interface OrchestratorConsoleProps {
  workspaceId: string;
}

export function OrchestratorConsole({ workspaceId }: OrchestratorConsoleProps) {
  const store = useOrchestratorStore();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartExecution = async () => {
    if (!store.currentTaskId) {
return;
}

    setIsStarting(true);
    store.setIsExecuting(true);

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const response = await fetch('/api/orchestrator/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          workspaceId,
          taskId: store.currentTaskId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        store.setCurrentTask(result);
      } else {
        store.setError('Failed to start execution');
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsStarting(false);
      store.setIsExecuting(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) {
return 'bg-red-100 text-red-800';
}
    if (risk >= 60) {
return 'bg-orange-100 text-orange-800';
}
    if (risk >= 40) {
return 'bg-yellow-100 text-yellow-800';
}
    return 'bg-green-100 text-green-800';
  };

  if (!store.currentTask) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <p>No task loaded. Create or select a task from the Plan tab.</p>
        </CardContent>
      </Card>
    );
  }

  const task = store.currentTask;

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Execution Control</CardTitle>
            <Badge variant={task.status === 'running' ? 'default' : 'secondary'}>
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Risk Score</div>
              <div className={`text-2xl font-bold ${getRiskColor(task.riskScore)}`}>
                {task.riskScore}%
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Uncertainty</div>
              <div className="text-2xl font-bold text-orange-600">{task.uncertaintyScore}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Steps</div>
              <div className="text-2xl font-bold text-blue-600">{task.steps.length}</div>
            </div>
          </div>

          {task.status === 'paused' && task.riskScore >= 60 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-900">Approval Required</div>
                <div className="text-sm text-orange-800">
                  Risk score {task.riskScore}% exceeds threshold. Review and approve to continue.
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartExecution}
            disabled={isStarting || task.status === 'running'}
            className="w-full"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {isStarting ? 'Starting...' : task.status === 'completed' ? 'Restart Execution' : 'Start Execution'}
          </Button>
        </CardContent>
      </Card>

      {/* Steps Execution Log */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {task.steps.map((step) => (
              <div
                key={step.stepIndex}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === step.stepIndex ? null : step.stepIndex)}
                  className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="flex-shrink-0">
                      Step {step.stepIndex}
                    </Badge>
                    <span className="font-medium">{step.assignedAgent}</span>
                    {step.status === 'completed' && (
                      <span className="text-xs text-green-600">✓ Completed</span>
                    )}
                    {step.status === 'failed' && (
                      <span className="text-xs text-red-600">✗ Failed</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedStep === step.stepIndex ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedStep === step.stepIndex && (
                  <div className="bg-gray-50 border-t p-4 space-y-4">
                    {step.outputPayload && (
                      <div>
                        <div className="text-sm font-medium mb-2">Output</div>
                        <div className="bg-white p-3 rounded text-xs font-mono text-gray-700 max-h-48 overflow-auto">
                          {JSON.stringify(step.outputPayload, null, 2)}
                        </div>
                      </div>
                    )}

                    {step.riskScore !== undefined && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Risk</div>
                          <div className="font-semibold">{step.riskScore}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Uncertainty</div>
                          <div className="font-semibold">{step.uncertaintyScore}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signals */}
      {task.signals && task.signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signals ({task.signals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.signals.map((signal, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="font-semibold text-yellow-900">{signal.type}</div>
                  <div className="text-yellow-800">{signal.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
