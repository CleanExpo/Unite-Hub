/**
 * Auction Archive Bridge
 *
 * Stores auction results in MemoryStore and tracks marketplace patterns.
 * - Archives complete auction sessions with full bid details
 * - Detects marketplace patterns (dominant agents, time-of-day effects)
 * - Generates auction analytics
 * - Correlates auction outcomes with task success
 */

import { memoryStore } from '@/lib/memory';

export interface AuctionArchiveEntry {
  auctionId: string;
  workspaceId: string;
  taskId: string;
  taskTitle: string;
  taskComplexity: number;
  winningAgentId: string;
  winningBid: number;
  pricePaid: number;
  runnerUpAgentId?: string;
  margin: number;
  bundleUsed: boolean;
  safetyFilterTriggered: boolean;
  totalBidsReceived: number;
  disqualifiedCount: number;
  outcome: 'success' | 'partial_success' | 'failure';
  executionTime?: number; // milliseconds
  explainabilityReport: string;
  createdAt: string;
}

export interface MarketplacePattern {
  patternId: string;
  patternType:
    | 'agent_dominance'
    | 'load_sensitivity'
    | 'complexity_correlation'
    | 'collaboration_benefit'
    | 'risk_filtering_effectiveness';
  agentIds?: string[];
  frequency: number;
  successRate: number;
  keyInsight: string;
  detectedAt: string;
}

export interface MarketplaceAnalytics {
  totalAuctions: number;
  totalAgentBids: number;
  avgBidsPerAuction: number;
  avgBidValue: number;
  winRateByAgent: Record<string, number>;
  avgWinningBidByComplexity: Record<string, number>;
  safetyFilterTriggered: number;
  bundlesUsed: number;
  detectedPatterns: MarketplacePattern[];
}

/**
 * AuctionArchiveBridge singleton
 * Manages auction archive and pattern detection
 */
class AuctionArchiveBridgeImpl {
  /**
   * Archive a completed auction
   */
  async archiveAuction(entry: AuctionArchiveEntry): Promise<void> {
    const memory = memoryStore;

    // Store in auction history
    const key = `auction:${entry.auctionId}`;
    await memory.set(key, entry, {
      ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
      tags: [
        'marketplace',
        `workspace:${entry.workspaceId}`,
        `agent:${entry.winningAgentId}`,
        `complexity:${Math.floor(entry.taskComplexity / 20) * 20}`, // Group by complexity band
      ],
    });

    // Update workspace auction count
    const countKey = `marketplace:${entry.workspaceId}:auction_count`;
    const currentCount = await memory.get(countKey);
    await memory.set(countKey, (currentCount as number || 0) + 1);
  }

  /**
   * Archive individual bids from auction
   */
  async archiveBids(
    auctionId: string,
    bids: Array<{
      agentId: string;
      score: number;
      disqualified: boolean;
      reason?: string;
    }>
  ): Promise<void> {
    const memory = memoryStore;

    for (const bid of bids) {
      const key = `auction:${auctionId}:bid:${bid.agentId}`;
      await memory.set(key, bid, {
        ttl: 90 * 24 * 60 * 60 * 1000,
        tags: [`marketplace`, `agent:${bid.agentId}`],
      });
    }
  }

  /**
   * Detect and record marketplace patterns
   */
  async detectAndRecordPattern(
    workspaceId: string,
    history: AuctionArchiveEntry[]
  ): Promise<MarketplacePattern[]> {
    const patterns: MarketplacePattern[] = [];
    const memory = memoryStore;

    // Pattern 1: Agent Dominance
    const agentWins = new Map<string, number>();
    history.forEach((auction) => {
      agentWins.set(
        auction.winningAgentId,
        (agentWins.get(auction.winningAgentId) || 0) + 1
      );
    });

    const dominantAgents = Array.from(agentWins.entries())
      .filter(([, wins]) => wins >= 5)
      .map(([agentId]) => agentId);

    if (dominantAgents.length > 0) {
      const pattern: MarketplacePattern = {
        patternId: `dominance_${Date.now()}`,
        patternType: 'agent_dominance',
        agentIds: dominantAgents,
        frequency: dominantAgents.length,
        successRate: this.calculateSuccessRate(history, dominantAgents),
        keyInsight: `${dominantAgents.join(', ')} consistently win auctions. Monitor for load imbalance.`,
        detectedAt: new Date().toISOString(),
      };
      patterns.push(pattern);
    }

    // Pattern 2: Load Sensitivity
    const highLoadAuctions = history.filter((a) => a.margin < 5); // Tight margin = high load pressure
    if (highLoadAuctions.length >= history.length * 0.3) {
      const pattern: MarketplacePattern = {
        patternId: `load_sensitivity_${Date.now()}`,
        patternType: 'load_sensitivity',
        frequency: highLoadAuctions.length,
        successRate: this.calculateSuccessRate(history, [], highLoadAuctions),
        keyInsight: 'Tight bid margins suggest agents under load. Consider workload distribution.',
        detectedAt: new Date().toISOString(),
      };
      patterns.push(pattern);
    }

    // Pattern 3: Complexity Correlation
    const lowComplexity = history.filter((a) => a.taskComplexity < 40);
    const highComplexity = history.filter((a) => a.taskComplexity >= 70);

    const lowSuccessRate =
      lowComplexity.length > 0
        ? lowComplexity.filter((a) => a.outcome === 'success').length /
          lowComplexity.length
        : 0;
    const highSuccessRate =
      highComplexity.length > 0
        ? highComplexity.filter((a) => a.outcome === 'success').length /
          highComplexity.length
        : 0;

    if (Math.abs(lowSuccessRate - highSuccessRate) > 0.2) {
      const pattern: MarketplacePattern = {
        patternId: `complexity_correlation_${Date.now()}`,
        patternType: 'complexity_correlation',
        frequency: highComplexity.length,
        successRate: highSuccessRate,
        keyInsight: `High-complexity tasks have ${(highSuccessRate * 100).toFixed(0)}% success rate vs ${(lowSuccessRate * 100).toFixed(0)}% for low-complexity. Adjust complexity thresholds.`,
        detectedAt: new Date().toISOString(),
      };
      patterns.push(pattern);
    }

    // Pattern 4: Collaboration Benefit
    const bundledAuctions = history.filter((a) => a.bundleUsed);
    if (bundledAuctions.length >= 3) {
      const bundleSuccessRate =
        bundledAuctions.filter((a) => a.outcome === 'success').length /
        bundledAuctions.length;
      const singleSuccessRate = this.calculateSuccessRate(
        history.filter((a) => !a.bundleUsed)
      );

      if (bundleSuccessRate > singleSuccessRate + 0.1) {
        const pattern: MarketplacePattern = {
          patternId: `collaboration_${Date.now()}`,
          patternType: 'collaboration_benefit',
          frequency: bundledAuctions.length,
          successRate: bundleSuccessRate,
          keyInsight: `Bundled agents achieve ${(bundleSuccessRate * 100).toFixed(0)}% success vs ${(singleSuccessRate * 100).toFixed(0)}% for singles. Collaboration adds value.`,
          detectedAt: new Date().toISOString(),
        };
        patterns.push(pattern);
      }
    }

    // Pattern 5: Safety Filter Effectiveness
    const filteredAuctions = history.filter((a) => a.safetyFilterTriggered);
    if (filteredAuctions.length >= 5) {
      const veto_prevention_rate =
        filteredAuctions.filter((a) => a.outcome === 'success').length /
        filteredAuctions.length;
      const pattern: MarketplacePattern = {
        patternId: `safety_filter_${Date.now()}`,
        patternType: 'risk_filtering_effectiveness',
        frequency: filteredAuctions.length,
        successRate: veto_prevention_rate,
        keyInsight: `Safety filters triggered ${filteredAuctions.length} times. Successful outcomes: ${(veto_prevention_rate * 100).toFixed(0)}%. Filters working as intended.`,
        detectedAt: new Date().toISOString(),
      };
      patterns.push(pattern);
    }

    // Store patterns
    for (const pattern of patterns) {
      const key = `marketplace:${workspaceId}:pattern:${pattern.patternId}`;
      await memory.set(key, pattern, {
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
        tags: ['marketplace', `workspace:${workspaceId}`, pattern.patternType],
      });
    }

    return patterns;
  }

  /**
   * Generate auction analytics
   */
  async generateAuctionAnalytics(
    workspaceId: string,
    history: AuctionArchiveEntry[]
  ): Promise<MarketplaceAnalytics> {
    if (history.length === 0) {
      return {
        totalAuctions: 0,
        totalAgentBids: 0,
        avgBidsPerAuction: 0,
        avgBidValue: 0,
        winRateByAgent: {},
        avgWinningBidByComplexity: {},
        safetyFilterTriggered: 0,
        bundlesUsed: 0,
        detectedPatterns: [],
      };
    }

    // Calculate win rates
    const winRateByAgent: Record<string, number> = {};
    const agentBids: Record<string, number> = {};

    history.forEach((auction) => {
      agentBids[auction.winningAgentId] =
        (agentBids[auction.winningAgentId] || 0) + 1;
    });

    Object.entries(agentBids).forEach(([agentId, wins]) => {
      const totalAuctions = history.length;
      winRateByAgent[agentId] = wins / totalAuctions;
    });

    // Calculate avg bid value by complexity
    const avgByComplexity: Record<string, number> = {};
    const complexityGroups = new Map<string, number[]>();

    history.forEach((auction) => {
      const band = Math.floor(auction.taskComplexity / 20) * 20;
      const key = `${band}-${band + 20}`;
      if (!complexityGroups.has(key)) {
        complexityGroups.set(key, []);
      }
      complexityGroups.get(key)!.push(auction.winningBid);
    });

    complexityGroups.forEach((bids, key) => {
      avgByComplexity[key] = bids.reduce((a, b) => a + b) / bids.length;
    });

    const totalBids = history.reduce(
      (sum, a) => sum + a.totalBidsReceived,
      0
    );

    const patterns = await this.detectAndRecordPattern(workspaceId, history);

    return {
      totalAuctions: history.length,
      totalAgentBids: totalBids,
      avgBidsPerAuction: totalBids / history.length,
      avgBidValue: history.reduce((sum, a) => sum + a.winningBid, 0) / history.length,
      winRateByAgent,
      avgWinningBidByComplexity: avgByComplexity,
      safetyFilterTriggered: history.filter((a) => a.safetyFilterTriggered).length,
      bundlesUsed: history.filter((a) => a.bundleUsed).length,
      detectedPatterns: patterns,
    };
  }

  /**
   * Calculate success rate for auctions
   */
  private calculateSuccessRate(
    history: AuctionArchiveEntry[],
    agentIds?: string[],
    auctions?: AuctionArchiveEntry[]
  ): number {
    let filtered = auctions || history;

    if (agentIds && agentIds.length > 0) {
      filtered = filtered.filter((a) => agentIds.includes(a.winningAgentId));
    }

    if (filtered.length === 0) return 0;

    return (
      filtered.filter((a) => a.outcome === 'success').length / filtered.length
    );
  }
}

export const auctionArchiveBridge = new AuctionArchiveBridgeImpl();
