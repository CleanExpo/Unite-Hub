'use client';

import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { isSafetyVetoed } from '@/lib/negotiation/negotiationClient';
import type { ArbitrationDecision } from '@/state/useNegotiationStore';

interface ArbitrationDecisionPanelProps {
  decision: ArbitrationDecision | null;
  rationale?: string;
  alternatives?: Array<{ agentId: string; action: string; score: number }>;
  loading?: boolean;
}

export const ArbitrationDecisionPanel: React.FC<ArbitrationDecisionPanelProps> = ({
  decision,
  rationale,
  alternatives,
  loading,
}) => {
  if (loading) {
    return <p className="text-sm text-text-secondary">Computing arbitration...</p>;
  }

  if (!decision) {
    return <p className="text-sm text-text-secondary">No decision available</p>;
  }

  const isSafetyOverride = isSafetyVetoed(decision.riskScore);
  const consensusAchieved = decision.consensusPercentage >= 65;

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${
        isSafetyOverride
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : consensusAchieved
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-start gap-3 mb-3">
          {isSafetyOverride ? (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          ) : consensusAchieved ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-text-primary">
              {decision.selectedAgent} - {decision.selectedAction}
            </p>
            <p className={`text-xs font-medium mt-1 ${
              isSafetyOverride
                ? 'text-red-700 dark:text-red-300'
                : consensusAchieved
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {isSafetyOverride
                ? '⚠️ Safety Override: Risk ≥ 80'
                : consensusAchieved
                ? '✓ Consensus Achieved'
                : '⚠️ Moderate Agreement'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-text-secondary text-xs">Confidence</p>
            <p className="font-semibold text-text-primary">{decision.confidenceScore.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Risk Score</p>
            <p className={`font-semibold ${
              isSafetyVetoed(decision.riskScore)
                ? 'text-red-600 dark:text-red-400'
                : 'text-text-primary'
            }`}>
              {decision.riskScore.toFixed(0)}/100
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Consensus</p>
            <p className="font-semibold text-text-primary">{decision.consensusPercentage.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {alternatives && alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary">Alternatives Considered</p>
          {alternatives.map((alt) => (
            <div key={`${alt.agentId}-${alt.action}`} className="p-2 bg-bg-raised rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary">{alt.agentId}</span>
                <span className="text-text-secondary">{alt.score.toFixed(0)} points</span>
              </div>
              <p className="text-text-secondary">{alt.action}</p>
            </div>
          ))}
        </div>
      )}

      {rationale && (
        <div className="p-3 bg-bg-raised rounded border border-border-subtle">
          <p className="text-xs font-medium text-text-secondary mb-2">Rationale</p>
          <p className="text-xs text-text-secondary whitespace-pre-wrap">{rationale}</p>
        </div>
      )}
    </div>
  );
};
