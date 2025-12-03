'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getRiskColor, isSafetyVetoed } from '@/lib/negotiation/negotiationClient';
import type { AgentProposal } from '@/state/useNegotiationStore';

interface ProposalMatrixProps {
  proposals: AgentProposal[];
  loading?: boolean;
}

export const ProposalMatrix: React.FC<ProposalMatrixProps> = ({ proposals, loading }) => {
  if (loading) {
    return <p className="text-sm text-text-secondary">Loading proposals...</p>;
  }

  if (proposals.length === 0) {
    return <p className="text-sm text-text-secondary">No proposals available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-bg-raised border-b border-border-subtle">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-text-secondary">Agent</th>
            <th className="px-3 py-2 text-left font-medium text-text-secondary">Action</th>
            <th className="px-3 py-2 text-center font-medium text-text-secondary">Confidence</th>
            <th className="px-3 py-2 text-center font-medium text-text-secondary">Risk</th>
            <th className="px-3 py-2 text-right font-medium text-text-secondary">Cost</th>
            <th className="px-3 py-2 text-right font-medium text-text-secondary">Benefit</th>
            <th className="px-3 py-2 text-center font-medium text-text-secondary">Safety</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr
              key={proposal.agentId}
              className={`border-b border-border-subtle ${
                isSafetyVetoed(proposal.riskScore)
                  ? 'bg-red-50 dark:bg-red-900/10 opacity-60'
                  : 'hover:bg-bg-hover'
              }`}
            >
              <td className="px-3 py-2 font-medium text-text-primary">
                {proposal.agentId}
              </td>
              <td className="px-3 py-2 text-text-secondary">{proposal.action}</td>
              <td className="px-3 py-2 text-center">
                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                  {proposal.confidence.toFixed(0)}%
                </span>
              </td>
              <td className={`px-3 py-2 text-center font-semibold ${getRiskColor(proposal.riskScore)}`}>
                {proposal.riskScore.toFixed(0)}
              </td>
              <td className="px-3 py-2 text-right text-text-secondary">
                ${proposal.estimatedCost.toFixed(4)}
              </td>
              <td className="px-3 py-2 text-right text-text-secondary">
                ${proposal.estimatedBenefit.toFixed(4)}
              </td>
              <td className="px-3 py-2 text-center">
                {isSafetyVetoed(proposal.riskScore) && (
                  <div className="flex items-center justify-center gap-1" title="Safety veto: Risk ≥ 80">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-600">VETOED</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
