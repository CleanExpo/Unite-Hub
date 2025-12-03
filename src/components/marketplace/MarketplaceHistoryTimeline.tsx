'use client';

import React, { useState } from 'react';
import { useMarketplaceStore } from '@/state/useMarketplaceStore';
import {
  getOutcomeColor,
  formatBid,
  formatPrice,
  getComplexityLabel,
  formatDate,
  getTimeElapsed,
} from '@/lib/marketplace/marketplaceClient';
import { Badge } from '@/components/ui/badge';
import { History, Filter, ChevronDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface MarketplaceHistoryTimelineProps {
  workspaceId: string;
}

type FilterType = 'all' | 'success' | 'partial' | 'failure';

export function MarketplaceHistoryTimeline({ workspaceId }: MarketplaceHistoryTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { historicalAuctions, isLoadingHistory } = useMarketplaceStore();

  // Filter auctions
  const filteredAuctions = historicalAuctions.filter((auction) => {
    if (filterType === 'all') return true;
    if (filterType === 'success') return auction.outcome === 'success';
    if (filterType === 'partial') return auction.outcome === 'partial_success';
    if (filterType === 'failure') return auction.outcome === 'failure';
    return true;
  });

  const toggleExpanded = (auctionId: string) => {
    setExpandedId(expandedId === auctionId ? null : auctionId);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-text-secondary" />
            <h3 className="text-lg font-semibold">Auction History</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="text-sm px-3 py-1 rounded border border-gray-300 bg-bg-card dark:border-gray-600"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="partial">Partial Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-border-subtle">
        {isLoadingHistory ? (
          <div className="px-6 py-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
            <p className="text-text-secondary">Loading history...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-text-secondary">
              {historicalAuctions.length === 0
                ? 'No auction history yet'
                : 'No auctions match the selected filter'}
            </p>
          </div>
        ) : (
          filteredAuctions.map((auction) => (
            <AuctionTimelineEntry
              key={auction.auctionId}
              auction={auction}
              isExpanded={expandedId === auction.auctionId}
              onToggle={() => toggleExpanded(auction.auctionId)}
            />
          ))
        )}
      </div>

      {/* Summary */}
      {filteredAuctions.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-text-secondary">Total Auctions</p>
              <p className="font-semibold text-text-primary">
                {filteredAuctions.length}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Total Value</p>
              <p className="font-semibold text-text-primary">
                {formatPrice(
                  filteredAuctions.reduce((sum, a) => sum + (a.winningBid || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Avg Complexity</p>
              <p className="font-semibold text-text-primary">
                {(
                  filteredAuctions.reduce((sum, a) => sum + a.taskComplexity, 0) /
                  filteredAuctions.length
                ).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Success Rate</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {(
                  (filteredAuctions.filter((a) => a.outcome === 'success').length /
                    filteredAuctions.length) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual auction timeline entry
 */
function AuctionTimelineEntry({
  auction,
  isExpanded,
  onToggle,
}: {
  auction: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      {/* Collapsed View */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Timeline marker + Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
              <OutcomeIcon outcome={auction.outcome} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-text-primary truncate">
                  {auction.taskTitle}
                </h4>
                <Badge
                  variant="outline"
                  className={getOutcomeColor(auction.outcome)}
                >
                  {auction.outcome.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                <span>{getComplexityLabel(auction.taskComplexity)}</span>
                <span>•</span>
                <span>{getTimeElapsed(auction.completedAt)}</span>
                {auction.safetyFilterTriggered && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 dark:text-orange-400">Safety filter</span>
                  </>
                )}
                {auction.bundleUsed && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400">Bundle used</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Bid amount + Winner + Chevron */}
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-text-primary">
              {formatBid(auction.winningBid)}
            </p>
            <p className="text-xs text-text-secondary">
              {auction.winningAgent}
            </p>
          </div>

          <ChevronDown
            className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border-subtle bg-bg-raised/50 px-6 py-4">
          <div className="space-y-4">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-text-secondary">Task ID</p>
                <p className="text-sm font-medium text-text-primary break-all">
                  {auction.auctionId}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Complexity</p>
                <p className="text-sm font-medium text-text-primary">
                  {auction.taskComplexity}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Completed</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(auction.completedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Winning Bid</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatPrice(auction.winningBid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Winner</p>
                <p className="text-sm font-medium text-text-primary">
                  {auction.winningAgent}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Outcome</p>
                <Badge className={getOutcomeColor(auction.outcome)}>
                  {auction.outcome.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Indicators */}
            <div className="flex flex-wrap gap-2">
              {auction.safetyFilterTriggered && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                  Safety Filter Triggered
                </Badge>
              )}
              {auction.bundleUsed && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  Multi-Agent Bundle
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Outcome icon component
 */
function OutcomeIcon({ outcome }: { outcome: string }) {
  switch (outcome) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    case 'partial_success':
      return <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'failure':
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    default:
      return <History className="h-5 w-5 text-gray-400" />;
  }
}
