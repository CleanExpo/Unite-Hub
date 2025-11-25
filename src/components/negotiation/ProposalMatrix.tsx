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
    return <p className="text-sm text-gray-600 dark:text-gray-400">Loading proposals...</p>;
  }

  if (proposals.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">No proposals available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Agent</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
            <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Confidence</th>
            <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Risk</th>
            <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Cost</th>
            <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Benefit</th>
            <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">Safety</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr
              key={proposal.agentId}
              className={`border-b border-gray-200 dark:border-gray-700 ${
                isSafetyVetoed(proposal.riskScore)
                  ? 'bg-red-50 dark:bg-red-900/10 opacity-60'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                {proposal.agentId}
              </td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{proposal.action}</td>
              <td className="px-3 py-2 text-center">
                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                  {proposal.confidence.toFixed(0)}%
                </span>
              </td>
              <td className={`px-3 py-2 text-center font-semibold ${getRiskColor(proposal.riskScore)}`}>
                {proposal.riskScore.toFixed(0)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                ${proposal.estimatedCost.toFixed(4)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
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
