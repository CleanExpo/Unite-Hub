'use client';

import React, { useEffect, useState } from 'react';
import { useMarketplaceStore } from '@/state/useMarketplaceStore';
import {
  getRiskColor,
  getScoreColor,
  formatBid,
  formatConfidence,
  formatSuccessRate,
  getBidStatus,
  getDisqualificationContext,
} from '@/lib/marketplace/marketplaceClient';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Filter } from 'lucide-react';

export interface LiveBidPanelProps {
  workspaceId: string;
}

export function LiveBidPanel({ workspaceId }: LiveBidPanelProps) {
  const [filteredBids, setFilteredBids] = useState(0);
  const [filterShowDisqualified, setFilterShowDisqualified] = useState(false);

  const {
    currentBids,
    activeAuction,
    isLoadingBids,
    getQualifiedBids,
    getDisqualifiedBids,
  } = useMarketplaceStore();

  const qualifiedBids = getQualifiedBids();
  const disqualifiedBids = getDisqualifiedBids();
  const displayBids = filterShowDisqualified
    ? disqualifiedBids
    : qualifiedBids;

  useEffect(() => {
    setFilteredBids(displayBids.length);
  }, [displayBids]);

  if (!activeAuction) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No active auction. Bids will appear here when an auction starts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Live Bids ({qualifiedBids.length})</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <button
                onClick={() => setFilterShowDisqualified(!filterShowDisqualified)}
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  filterShowDisqualified
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {filterShowDisqualified ? 'Disqualified' : 'Qualified'}
              </button>
            </div>
            {isLoadingBids && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayBids.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {filterShowDisqualified
                ? 'No disqualified bids'
                : 'Waiting for bids...'}
            </p>
          </div>
        ) : (
          displayBids.map((bid) => (
            <BidRow key={bid.agentId} bid={bid} />
          ))
        )}
      </div>

      {/* Summary */}
      {displayBids.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {filterShowDisqualified
                ? `${disqualifiedBids.length} disqualified`
                : `${qualifiedBids.length} qualified bids`}
            </span>
            {!filterShowDisqualified && qualifiedBids.length > 0 && (
              <span>
                Top bid: {formatBid(Math.max(...qualifiedBids.map((b) => b.finalBid)))}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual bid row component
 */
function BidRow({ bid }: { bid: any }) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {bid.agentId}
            </span>
            <Badge
              variant="outline"
              className={`shrink-0 ${getRiskColor(bid.risk)}`}
            >
              {bid.risk}% Risk
            </Badge>
            {bid.disqualified && (
              <Badge variant="destructive" className="shrink-0">
                Disqualified
              </Badge>
            )}
          </div>

          {bid.disqualified && (
            <div className="mb-3 flex items-start gap-2 rounded bg-red-50 p-2 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">
                {getDisqualificationContext(bid)}
              </p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
              <p className={`text-sm font-medium ${getScoreColor(bid.confidence).split(' ')[1]}`}>
                {formatConfidence(bid.confidence)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatSuccessRate(bid.successRate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Capability Match</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {bid.capabilityMatch}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Context Relevance</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {bid.contextRelevance}%
              </p>
            </div>
          </div>

          {/* Score Visualization */}
          <div className="space-y-2 mb-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Raw Score</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {bid.rawScore.toFixed(2)}
                </span>
              </div>
              <Progress
                value={Math.min(bid.rawScore, 100)}
                className="h-1.5"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Load Factor</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {bid.loadFactor.toFixed(2)}x
                </span>
              </div>
              <Progress
                value={Math.min(bid.loadFactor * 50, 100)}
                className="h-1.5"
              />
            </div>
          </div>
        </div>

        {/* Bid Amount */}
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Final Bid</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatBid(bid.finalBid)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {getBidStatus(bid)}
          </p>
        </div>
      </div>
    </div>
  );
}
