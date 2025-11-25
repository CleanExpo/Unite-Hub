'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Step {
  stepIndex: number;
  assignedAgent: string;
  inputContext: Record<string, any>;
  expectedOutput?: string;
  riskScore?: number;
}

interface TaskBreakdownViewProps {
  steps: Step[];
  agentChain: string[];
  estimatedRisk: number;
}

export function TaskBreakdownView({ steps, agentChain, estimatedRisk }: TaskBreakdownViewProps) {
  const agentEmojis: Record<string, string> = {
    'email-agent': '📧',
    'content-agent': '✍️',
    'contact-intelligence': '🎯',
    'analysis': '📊',
    'reasoning': '🧠',
    'orchestrator': '🎪',
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Task Breakdown Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Total Steps</div>
              <div className="text-3xl font-bold text-blue-900">{steps.length}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">Estimated Risk</div>
              <div className="text-3xl font-bold text-red-900">{Math.round(estimatedRisk)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {agentChain.map((agent, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                <Badge className="whitespace-nowrap">
                  {agentEmojis[agent] || '🤖'} {agent}
                </Badge>
                {idx < agentChain.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={step.stepIndex} className="pb-4 border-b last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="flex-shrink-0">
                      Step {step.stepIndex}
                    </Badge>
                    <span className="font-semibold">{step.assignedAgent}</span>
                  </div>
                  {step.riskScore !== undefined && (
                    <Badge
                      className={
                        step.riskScore >= 60
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      Risk: {step.riskScore}%
                    </Badge>
                  )}
                </div>

                <div className="ml-12 text-sm text-gray-700 space-y-2">
                  <div>
                    <div className="text-gray-600">Input Requirements:</div>
                    <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                      {Object.keys(step.inputContext).length > 0
                        ? Object.keys(step.inputContext).join(', ')
                        : 'Global context'}
                    </div>
                  </div>

                  {step.expectedOutput && (
                    <div>
                      <div className="text-gray-600">Expected Output:</div>
                      <div className="text-xs text-gray-700">{step.expectedOutput}</div>
                    </div>
                  )}
                </div>

                {idx < steps.length - 1 && (
                  <div className="ml-6 mt-4 flex items-center gap-2 text-gray-400">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-xs">Next step</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      {estimatedRisk >= 60 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">⚠️ Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800">
            <p>
              This workflow has an estimated risk of {Math.round(estimatedRisk)}%. Consider reviewing
              high-risk steps before execution.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
