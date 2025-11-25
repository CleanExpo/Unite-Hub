'use client';

/**
 * AgentPlanViewer
 * Full breakdown of the agent's reasoning trace, steps, risk analysis, and approval status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, Zap, Code } from 'lucide-react';

export interface PlanStep {
  step_number: number;
  action_type: string;
  command: Record<string, any>;
  description: string;
  promised_outcome: string;
  estimated_duration_ms?: number;
}

export interface AgentPlanViewerProps {
  planId: string;
  workspaceId: string;
  accessToken: string;
  plan?: {
    objective: string;
    reasoning_trace?: string;
    steps: PlanStep[];
    step_count: number;
    has_approval_commands: boolean;
    uncertainty_level: number;
    estimated_total_duration_ms: number;
  };
  complexity_score?: number;
  confidence_score?: number;
  safety_validation?: {
    valid: boolean;
    risk_score: number;
    requires_approval: boolean;
    warnings: string[];
    risk_factors: string[];
  };
  status?: string;
}

const getRiskColor = (riskScore: number) => {
  if (riskScore < 30) return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200';
  if (riskScore < 60) return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
  return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200';
    case 'pending_approval':
      return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200';
    case 'rejected':
      return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200';
    default:
      return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
  }
};

export function AgentPlanViewer({
  planId,
  workspaceId,
  accessToken,
  plan,
  complexity_score,
  confidence_score,
  safety_validation,
  status,
}: AgentPlanViewerProps) {
  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Plan: {planId.substring(0, 8)}...</CardTitle>
              <CardDescription className="mt-2">{plan?.objective}</CardDescription>
            </div>
            {status && (
              <Badge className={getStatusColor(status)}>
                {status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Scores & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Complexity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {complexity_score || 0}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {confidence_score || 0}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${safety_validation?.risk_score || 0 < 30 ? 'text-green-600' : safety_validation?.risk_score || 0 < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {safety_validation?.risk_score || 0}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">/100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reasoning Trace */}
      {plan?.reasoning_trace && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Reasoning Trace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {plan.reasoning_trace}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {safety_validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Safety Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Validation Status</h4>
              <Badge className={safety_validation.valid ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200'}>
                {safety_validation.valid ? '✓ Valid' : '✗ Invalid'}
              </Badge>
            </div>

            {safety_validation.risk_factors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Risk Factors</h4>
                <ul className="space-y-1">
                  {safety_validation.risk_factors.map((factor, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                      <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {safety_validation.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Warnings</h4>
                {safety_validation.warnings.map((warning, i) => (
                  <Alert key={i} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 mb-2">
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                      {warning}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {safety_validation.requires_approval && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  This plan requires founder approval before execution due to high risk factors.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Steps */}
      {plan?.steps && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Execution Steps ({plan.steps.length})
            </CardTitle>
            <CardDescription>
              Estimated total duration: {(plan.estimated_total_duration_ms / 1000).toFixed(1)}s
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.steps.map((step) => (
                <div
                  key={step.step_number}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">
                        Step {step.step_number}: {step.action_type}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                    {step.estimated_duration_ms && (
                      <Badge variant="outline" className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {(step.estimated_duration_ms / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Command:</span>
                      <pre className="mt-1 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(step.command, null, 2)}
                      </pre>
                    </div>

                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Expected Outcome:</span>
                      <p className="mt-1 italic">{step.promised_outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uncertainty Info */}
      {plan && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Uncertainty Level:</strong> {plan.uncertainty_level}% - This plan has a {
              plan.uncertainty_level < 30
                ? 'low'
                : plan.uncertainty_level < 70
                ? 'moderate'
                : 'high'
            } level of uncertainty in execution.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
