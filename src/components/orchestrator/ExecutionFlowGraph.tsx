'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExecutionFlowGraphProps {
  agentChain: string[];
  steps: Array<{
    stepIndex: number;
    assignedAgent: string;
    status: string;
    riskScore?: number;
  }>;
}

export function ExecutionFlowGraph({ agentChain, steps }: ExecutionFlowGraphProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'running':
        return 'bg-blue-100 border-blue-300';
      case 'failed':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⟳';
      case 'failed':
        return '✕';
      default:
        return '○';
    }
  };

  return (
    <div className="space-y-6">
      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max p-4">
              {steps.map((step, idx) => (
                <div key={step.stepIndex} className="flex items-center gap-4">
                  {/* Node */}
                  <div
                    className={`w-24 h-24 rounded-lg border-2 flex flex-col items-center justify-center ${getStatusColor(
                      step.status
                    )} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="text-2xl font-bold">{getStatusIcon(step.status)}</div>
                    <div className="text-xs font-semibold text-center mt-1">{step.assignedAgent}</div>
                    {step.riskScore !== undefined && (
                      <div className="text-xs text-gray-600 mt-1">Risk: {step.riskScore}%</div>
                    )}
                  </div>

                  {/* Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="text-2xl text-gray-400">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Running</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.stepIndex} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className="flex-shrink-0">
                  <Badge variant="outline">Step {step.stepIndex}</Badge>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.assignedAgent}</div>
                  <div className="text-xs text-gray-600">Status: {step.status}</div>
                </div>
                {step.riskScore !== undefined && (
                  <Badge
                    className={
                      step.riskScore >= 60
                        ? 'bg-red-100 text-red-800'
                        : step.riskScore >= 40
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {step.riskScore}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
