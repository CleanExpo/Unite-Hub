'use client';

import React from 'react';
import { useMarketplaceStore } from '@/state/useMarketplaceStore';
import {
  formatBid,
  formatConfidence,
  formatMarginPercentage,
  getScoreColor,
  getBundleDisplayText,
} from '@/lib/marketplace/marketplaceClient';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingDown, AlertCircle, Users } from 'lucide-react';

export interface AuctionWinnerPanelProps {
  workspaceId: string;
}

export function AuctionWinnerPanel({ workspaceId }: AuctionWinnerPanelProps) {
  const { currentWinner, activeAuction, isLoadingWinner } = useMarketplaceStore();

  if (isLoadingWinner) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!currentWinner) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center py-8">
          <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Auction winner will be displayed here once evaluation is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 dark:border-gray-700 dark:bg-gradient-to-r dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Auction Winner
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Winner Agent */}
        <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Selected Agent</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentWinner.selectedAgent}
            </p>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              Winner
            </Badge>
          </div>
        </div>

        {/* Selected Action */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Selected Action</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {currentWinner.selectedAction}
          </p>
        </div>

        {/* Decision Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Confidence Score</p>
            <p className={`text-lg font-bold ${getScoreColor(currentWinner.confidenceScore).split(' ')[1]}`}>
              {currentWinner.confidenceScore.toFixed(1)}%
            </p>
            <Progress
              value={currentWinner.confidenceScore}
              className="h-1.5 mt-2"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Risk Score</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {currentWinner.riskScore.toFixed(1)}%
            </p>
            <Progress
              value={currentWinner.riskScore}
              className="h-1.5 mt-2"
            />
          </div>
        </div>

        {/* Consensus */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Consensus Percentage</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentWinner.consensusPercentage.toFixed(0)}%
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">agent agreement</span>
          </div>
          <Progress
            value={currentWinner.consensusPercentage}
            className="h-2 mt-3"
          />
        </div>

        {/* Rationale */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Decision Rationale</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {currentWinner.rationale}
          </p>
        </div>

        {/* Alternative Actions */}
        {currentWinner.alternativeActions && currentWinner.alternativeActions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Alternatives Considered
            </h4>
            <div className="space-y-2">
              {currentWinner.alternativeActions.map((alt, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alt.agentId}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alt.reason}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bid</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatBid(alt.bid)}
                    </p>
                    {alt.margin > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center justify-end gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {formatMarginPercentage(currentWinner.confidenceScore, alt.bid)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Agent Bundle Indicator */}
        {activeAuction?.bundleUsed && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Multi-Agent Bundle Selected
              </p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This auction resulted in a collaborative bundle due to high complexity and knowledge span requirements.
            </p>
          </div>
        )}

        {/* Safety Filter Indicator */}
        {activeAuction?.safetyFilterTriggered && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Safety Filter Triggered
              </p>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Some bids were disqualified due to high risk scores (≥80%).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
