/**
 * Marketplace API Client
 *
 * Utilities for interacting with the task marketplace auction system.
 * Provides functions for starting auctions, fetching status, and retrieving history.
 * Includes helper utilities for UI formatting and color coding.
 */

import { AuctionSession, AuctionBid, AuctionWinner, HistoricalAuction } from '@/state/useMarketplaceStore';

/**
 * Start a new marketplace auction
 * POST /api/marketplace/start
 */
export async function startAuction(task: {
  taskId: string;
  taskTitle: string;
  taskComplexity: number;
  requiredCapabilities?: string[];
  budgetLimit?: number;
  deadline?: string;
  workspaceId: string;
}) {
  try {
    const response = await fetch('/api/marketplace/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start auction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting auction:', error);
    throw error;
  }
}

/**
 * Get current marketplace auction status
 * GET /api/marketplace/status?workspaceId=<id>
 */
export async function getAuctionStatus(workspaceId: string) {
  try {
    const response = await fetch(`/api/marketplace/status?workspaceId=${workspaceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch auction status');
    }

    const data = await response.json();
    return {
      hasActiveAuction: data.hasActiveAuction,
      auction: data.auction || null,
      bidDetails: data.bidDetails || [],
      recentAuctions: data.recentAuctions || [],
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching auction status:', error);
    throw error;
  }
}

/**
 * Get marketplace auction history and analytics
 * GET /api/marketplace/history?workspaceId=<id>&limit=<limit>
 */
export async function getAuctionHistory(
  workspaceId: string,
  limit: number = 50
) {
  try {
    const response = await fetch(
      `/api/marketplace/history?workspaceId=${workspaceId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch auction history');
    }

    const data = await response.json();
    return {
      analytics: {
        totalAuctions: data.analytics.totalAuctions,
        successRate: data.analytics.successRate,
        totalBids: data.analytics.totalBids,
        avgBidsPerAuction: data.analytics.avgBidsPerAuction,
        avgAuctionValue: data.analytics.avgAuctionValue,
        safetyFiltersTriggered: data.analytics.safetyFiltersTriggered,
        bundlesUsed: data.analytics.bundlesUsed,
        agentWinStats: data.analytics.agentWinStats || [],
      },
      recentAuctions: data.recentAuctions || [],
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching auction history:', error);
    throw error;
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Get color coding for risk levels
 * 0-49: green (low risk)
 * 50-64: yellow (moderate risk)
 * 65-79: orange (high risk)
 * 80-100: red (disqualifying risk)
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore < 50) {
return 'bg-emerald-100 text-emerald-800';
} // Green
  if (riskScore < 65) {
return 'bg-yellow-100 text-yellow-800';
} // Yellow
  if (riskScore < 80) {
return 'bg-orange-100 text-orange-800';
} // Orange
  return 'bg-red-100 text-red-800'; // Red (disqualified)
}

/**
 * Get color coding for confidence/score levels
 * 0-40: red (low confidence)
 * 41-60: yellow (moderate confidence)
 * 61-80: blue (high confidence)
 * 81-100: green (very high confidence)
 */
export function getScoreColor(score: number): string {
  if (score < 41) {
return 'bg-red-100 text-red-800';
} // Red
  if (score < 61) {
return 'bg-yellow-100 text-yellow-800';
} // Yellow
  if (score < 81) {
return 'bg-blue-100 text-blue-800';
} // Blue
  return 'bg-emerald-100 text-emerald-800'; // Green
}

/**
 * Get color coding for outcome results
 */
export function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800';
    case 'partial_success':
      return 'bg-blue-100 text-blue-800';
    case 'failure':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format bid value for display
 * Rounds to 2 decimal places, adds currency symbol
 */
export function formatBid(bid: number): string {
  if (bid === 0) {
return '$0.00';
}
  if (bid < 0.01) {
return '<$0.01';
}
  return `$${bid.toFixed(2)}`;
}

/**
 * Format price paid for display
 * Same as formatBid but used for clarity in context
 */
export function formatPrice(price: number): string {
  return formatBid(price);
}

/**
 * Format confidence percentage for display
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}%`;
}

/**
 * Format success rate for display
 */
export function formatSuccessRate(rate: number): string {
  return `${Math.round(rate)}%`;
}

/**
 * Get bid status label
 */
export function getBidStatus(bid: AuctionBid): string {
  if (bid.disqualified) {
    return 'Disqualified';
  }
  return 'Active';
}

/**
 * Get disqualification reason with context
 */
export function getDisqualificationContext(bid: AuctionBid): string {
  if (!bid.disqualified) {
return '';
}

  const reason = bid.disqualificationReason || 'Unknown reason';

  if (bid.risk >= 80) {
    return `Risk Level Too High (${bid.risk}%) - ${reason}`;
  }

  return reason;
}

/**
 * Calculate margin between two bids
 */
export function calculateMargin(winningBid: number, runnerUpBid: number): number {
  if (runnerUpBid === 0) {
return 0;
}
  return Math.abs(winningBid - runnerUpBid);
}

/**
 * Format margin as percentage
 */
export function formatMarginPercentage(winningBid: number, runnerUpBid: number): string {
  if (runnerUpBid === 0) {
return '—';
}
  const percentage = ((Math.abs(winningBid - runnerUpBid) / runnerUpBid) * 100).toFixed(1);
  return `${percentage}%`;
}

/**
 * Get complexity label
 */
export function getComplexityLabel(complexity: number): string {
  if (complexity < 30) {
return 'Simple';
}
  if (complexity < 50) {
return 'Moderate';
}
  if (complexity < 70) {
return 'Complex';
}
  return 'Very Complex';
}

/**
 * Get auction status label
 */
export function getAuctionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    BIDDING: 'Bidding Open',
    EVALUATING: 'Evaluating',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Check if auction is active
 */
export function isAuctionActive(auction: AuctionSession | null): boolean {
  if (!auction) {
return false;
}
  return auction.status === 'PENDING' || auction.status === 'BIDDING' || auction.status === 'EVALUATING';
}

/**
 * Check if bid should be highlighted (qualified and not marked as winner)
 */
export function shouldHighlightBid(bid: AuctionBid, winningAgentId?: string): boolean {
  return !bid.disqualified && bid.agentId !== winningAgentId;
}

/**
 * Get bundle display text
 */
export function getBundleDisplayText(agents: string[]): string {
  if (!agents || agents.length === 0) {
return 'Single Agent';
}
  if (agents.length === 1) {
return agents[0];
}
  return `Bundle: ${agents.length} agents`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Calculate time elapsed since auction creation
 */
export function getTimeElapsed(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
return 'Just now';
}
  if (diffMins < 60) {
return `${diffMins}m ago`;
}
  if (diffHours < 24) {
return `${diffHours}h ago`;
}
  return `${diffDays}d ago`;
}

/**
 * Get success rate color for outcome
 */
export function getSuccessRateColor(successRate: number): string {
  if (successRate < 60) {
return 'text-red-600';
}
  if (successRate < 80) {
return 'text-yellow-600';
}
  return 'text-emerald-600';
}
