'use client';

/**
 * OptimizedStepPreview - Visual representation of optimized workflow steps
 */

import React from 'react';
import { Zap, Users, Brain, Layers } from 'lucide-react';

export interface OptimizedStep {
  stepId: string;
  agent: string;
}

export interface OptimizedStepPreviewProps {
  steps?: OptimizedStep[];
  parallelismLevel?: number;
  riskScore?: number;
  stepOrdering?: string[];
  selectedAgents?: OptimizedStep[];
  loading?: boolean;
}

const agentColors: Record<string, { bg: string; border: string; icon: string }> = {
  orchestrator: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '🎼',
  },
  reasoning_engine: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: '🧠',
  },
  email_agent: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: '📧',
  },
  desktop_agent: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: '🖥️',
  },
  synthex_agent: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: '🔄',
  },
};

export const OptimizedStepPreview: React.FC<OptimizedStepPreviewProps> = ({
  steps = [],
  parallelismLevel = 1,
  riskScore = 0,
  stepOrdering = [],
  selectedAgents = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary">Optimized Steps</h3>
        <div className="text-sm text-text-secondary">Loading step optimization...</div>
      </div>
    );
  }

  const displaySteps = selectedAgents.length > 0 ? selectedAgents : steps;
  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskBg = (score: number) => {
    if (score >= 75) return 'bg-red-50 dark:bg-red-900/20';
    if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-green-50 dark:bg-green-900/20';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">Optimized Steps</h3>
        </div>
        {parallelismLevel > 1 && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
            {parallelismLevel}x Parallel
          </span>
        )}
      </div>

      {/* Parallelism & Risk Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-text-secondary">Parallelism</span>
          </div>
          <p className="text-xl font-bold text-text-primary">{parallelismLevel}</p>
          <p className="text-xs text-text-secondary mt-0.5">concurrent agents</p>
        </div>

        <div className={`p-3 border rounded-lg ${getRiskBg(riskScore)} border-current`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-secondary">Risk Score</span>
          </div>
          <p className={`text-xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}</p>
          <p className={`text-xs mt-0.5 ${getRiskColor(riskScore)}`}>
            {riskScore >= 75 ? 'High' : riskScore >= 50 ? 'Moderate' : 'Low'}
          </p>
        </div>
      </div>

      {/* Step Execution Flow */}
      {displaySteps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Execution Flow</h4>
          <div className="space-y-1.5">
            {displaySteps.map((step, index) => {
              const agentConfig = agentColors[step.agent as keyof typeof agentColors] || {
                bg: 'bg-bg-raised/20',
                border: 'border-border-subtle',
                icon: '⚙️',
              };

              return (
                <div key={step.stepId}>
                  <div
                    className={`p-2 rounded-lg border ${agentConfig.bg} ${agentConfig.border} flex items-center gap-2`}
                  >
                    <span className="text-lg">{agentConfig.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-text-primary">
                        {step.stepId}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {step.agent.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-text-secondary">#{index + 1}</span>
                  </div>
                  {index < displaySteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="text-text-muted text-xs">↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Ordering Info */}
      {stepOrdering.length > 0 && (
        <div className="p-3 bg-bg-raised rounded-lg border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-text-secondary" />
            <h4 className="text-xs font-semibold text-text-primary">Execution Order</h4>
          </div>
          <p className="text-xs text-text-secondary break-all">
            {stepOrdering.join(' → ')}
          </p>
        </div>
      )}

      {displaySteps.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-text-secondary">No optimized steps available</p>
        </div>
      )}
    </div>
  );
};
