'use client';

import React from 'react';
import type { ConsensusScore } from '@/state/useNegotiationStore';

interface ConsensusScoreChartProps {
  agentScores: ConsensusScore[];
  finalConsensusScore: number;
}

export const ConsensusScoreChart: React.FC<ConsensusScoreChartProps> = ({
  agentScores,
  finalConsensusScore,
}) => {
  const getBarColor = (score: number) => {
    if (score >= 65) {
return 'bg-green-500';
}
    if (score >= 50) {
return 'bg-yellow-500';
}
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary">Consensus Scores</h3>

      <div className="space-y-3">
        {agentScores.map((score) => (
          <div key={score.agentId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-secondary">{score.agentId}</span>
              <span className="text-text-secondary">{score.overallConsensus.toFixed(0)}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getBarColor(score.overallConsensus)}`}
                style={{ width: `${score.overallConsensus}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-bg-raised rounded-lg border border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">Overall Consensus</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                finalConsensusScore >= 65
                  ? 'bg-green-500'
                  : finalConsensusScore >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span
              className={`text-xl font-bold ${
                finalConsensusScore >= 65
                  ? 'text-green-600 dark:text-green-400'
                  : finalConsensusScore >= 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {finalConsensusScore.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {finalConsensusScore >= 65
            ? '✓ Consensus achieved'
            : finalConsensusScore >= 50
            ? '⚠ Moderate agreement'
            : '✗ Low consensus'}
        </p>
      </div>
    </div>
  );
};
