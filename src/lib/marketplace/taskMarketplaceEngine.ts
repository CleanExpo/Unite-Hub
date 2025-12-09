/**
 * Task Marketplace Engine
 *
 * Orchestrates hybrid first-price weighted Vickrey auction model for task allocation.
 * - Agents submit private bids based on capability, confidence, success rate
 * - Safety filters applied before winner selection
 * - Winner selected with price discounting (Vickrey style)
 * - Full explainability tracking
 */

import { nanoid } from 'nanoid';

export interface MarketplaceTask {
  taskId: string;
  workspaceId: string;
  title: string;
  description: string;
  complexity: number; // 0-100
  domains: string[]; // knowledge domains required
  timeoutMs: number; // bid collection timeout
  createdAt: string;
}

export interface AgentBid {
  agentId: string;
  rawScore: number;
  finalBid: number;
  risk: number;
  confidence: number;
  loadFactor: number;
  capabilityMatch: number;
  successRate: number;
  contextRelevance: number;
  disqualified: boolean;
  disqualificationReason?: string;
  timestamp: string;
}

export interface AuctionSession {
  auctionId: string;
  taskId: string;
  workspaceId: string;
  status: 'PENDING' | 'BIDDING' | 'EVALUATING' | 'COMPLETED' | 'CANCELLED';
  bids: AgentBid[];
  winningAgentId?: string;
  winningBid?: number;
  pricePaid?: number;
  bundleUsed: boolean;
  safetyFilterTriggered: boolean;
  finalScore?: number;
  explainabilityReport?: {
    rationale: string;
    componentScores: Record<string, number>;
    riskAssessment: string;
    alternatives: Array<{
      agentId: string;
      bid: number;
      reason: string;
      margin: number;
    }>;
  };
  createdAt: string;
  completedAt?: string;
}

export interface BidResponse {
  agentId: string;
  taskId: string;
  capabilityMatch: number; // 0-100: how well agent matches task domains
  confidence: number; // 0-100: agent confidence in executing task
  pastSuccessRate: number; // 0-100: historical success rate
  contextRelevance: number; // 0-100: task context alignment
  risk: number; // 0-100: operational risk
  activeTasks: number; // current load
  recommendsCollaboration?: boolean;
  collaborationPartners?: string[];
}

/**
 * TaskMarketplaceEngine singleton
 * Manages entire auction lifecycle
 */
class TaskMarketplaceEngineImpl {
  private activeSessions = new Map<string, AuctionSession>();

  /**
   * Create new auction for a task
   */
  async createAuction(task: MarketplaceTask): Promise<AuctionSession> {
    const auctionId = nanoid();

    const session: AuctionSession = {
      auctionId,
      taskId: task.taskId,
      workspaceId: task.workspaceId,
      status: 'PENDING',
      bids: [],
      bundleUsed: false,
      safetyFilterTriggered: false,
      createdAt: new Date().toISOString(),
    };

    this.activeSessions.set(auctionId, session);
    return session;
  }

  /**
   * Run complete auction process
   */
  async runAuction(
    task: MarketplaceTask,
    agentBidResponses: BidResponse[]
  ): Promise<AuctionSession> {
    const session = await this.createAuction(task);

    // Process bids through evaluation pipeline
    const evaluatedBids = agentBidResponses.map((bid) =>
      this.evaluateBid(bid, task.complexity)
    );

    session.bids = evaluatedBids;
    session.status = 'EVALUATING';

    // Apply safety filters
    this.applySafetyFilters(session);

    // Check if collaboration recommended
    const qualifiedBids = session.bids.filter((b) => !b.disqualified);
    if (
      task.complexity >= 70 &&
      task.domains.length > 2 &&
      qualifiedBids.some((b) => b.risk >= 50)
    ) {
      session.bundleUsed = await this.evaluateMultiAgentBundle(
        task,
        qualifiedBids
      );
    }

    // Select winner
    this.selectWinner(session);
    session.status = 'COMPLETED';
    session.completedAt = new Date().toISOString();

    return session;
  }

  /**
   * Evaluate single bid
   * rawScore = (capability * 0.35) + (confidence * 0.25) + (success * 0.2) + (context * 0.2)
   */
  private evaluateBid(bid: BidResponse, taskComplexity: number): AgentBid {
    const baseScore =
      bid.capabilityMatch * 0.35 +
      bid.confidence * 0.25 +
      bid.pastSuccessRate * 0.2 +
      bid.contextRelevance * 0.2;

    let finalBid = baseScore;

    // Apply risk penalty
    let disqualified = false;
    let disqualificationReason: string | undefined;

    if (bid.risk >= 80) {
      disqualified = true;
      disqualificationReason = 'Risk threshold exceeded (≥80)';
    } else if (bid.risk >= 65) {
      finalBid *= 0.6;
    } else if (bid.risk >= 50) {
      finalBid *= 0.8;
    }

    // Apply load penalty
    let loadFactor = 1.0;
    if (bid.activeTasks >= 5) {
      loadFactor = 0.7;
    } else if (bid.activeTasks >= 3) {
      loadFactor = 0.9;
    }
    finalBid *= loadFactor;

    // Safety layer weight (1.2x for safety layer proposals)
    const safetyWeight = bid.agentId === 'safety_layer' ? 1.2 : 1.0;
    finalBid *= safetyWeight;

    return {
      agentId: bid.agentId,
      rawScore: baseScore,
      finalBid,
      risk: bid.risk,
      confidence: bid.confidence,
      loadFactor,
      capabilityMatch: bid.capabilityMatch,
      successRate: bid.pastSuccessRate,
      contextRelevance: bid.contextRelevance,
      disqualified,
      disqualificationReason,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply safety filters to all bids
   */
  private applySafetyFilters(session: AuctionSession): void {
    const highestDisqualified = session.bids
      .filter((b) => b.disqualified)
      .sort((a, b) => b.finalBid - a.finalBid)[0];

    if (highestDisqualified && highestDisqualified.finalBid > 0) {
      session.safetyFilterTriggered = true;
    }
  }

  /**
   * Evaluate multi-agent collaboration bundle
   */
  private async evaluateMultiAgentBundle(
    task: MarketplaceTask,
    qualifiedBids: AgentBid[]
  ): Promise<boolean> {
    if (qualifiedBids.length < 2) {
return false;
}

    // Sort by bid and take top 2-3
    const topBids = qualifiedBids.sort((a, b) => b.finalBid - a.finalBid).slice(0, 3);
    const bundleScore = topBids.reduce((sum, b) => sum + b.finalBid, 0) / topBids.length;

    // Synergy bonus: +15% if domains complement
    const synergy = 0.15;
    const bundleWithSynergy = bundleScore * (1 + synergy);

    // Bundle wins if synergy-enhanced score beats best individual bid
    const bestIndividual = qualifiedBids[0].finalBid;
    return bundleWithSynergy > bestIndividual;
  }

  /**
   * Select winner using Vickrey-discounted first-price rules
   */
  private selectWinner(session: AuctionSession): void {
    const qualifiedBids = session.bids.filter((b) => !b.disqualified);

    if (qualifiedBids.length === 0) {
      session.status = 'CANCELLED';
      return;
    }

    // Sort by final bid
    const sorted = [...qualifiedBids].sort((a, b) => b.finalBid - a.finalBid);
    const winner = sorted[0];
    const runnerUp = sorted.length > 1 ? sorted[1] : null;

    session.winningAgentId = winner.agentId;
    session.winningBid = winner.finalBid;

    // Price paid = winner's bid discounted by next-best (Vickrey style)
    // But minimum at 70% of winner's bid
    if (runnerUp) {
      session.pricePaid = Math.max(runnerUp.finalBid, winner.finalBid * 0.7);
    } else {
      session.pricePaid = winner.finalBid;
    }

    session.finalScore = winner.finalBid;

    // Generate explainability report
    session.explainabilityReport = {
      rationale: `${winner.agentId} selected based on composite score (capability: ${winner.capabilityMatch.toFixed(0)}%, confidence: ${winner.confidence.toFixed(0)}%, success rate: ${winner.successRate.toFixed(0)}%)`,
      componentScores: {
        capability: winner.capabilityMatch,
        confidence: winner.confidence,
        successRate: winner.successRate,
        contextRelevance: winner.contextRelevance,
        risk: winner.risk,
      },
      riskAssessment: `Risk score ${winner.risk.toFixed(0)}/100 ${
        winner.risk >= 65
          ? '- HIGH (penalty applied)'
          : winner.risk >= 50
          ? '- MODERATE (slight penalty)'
          : '- LOW (no penalty)'
      }`,
      alternatives: sorted.slice(1, 4).map((bid, idx) => ({
        agentId: bid.agentId,
        bid: bid.finalBid,
        reason: `${bid.confidence.toFixed(0)}% confidence, ${bid.successRate.toFixed(0)}% success rate`,
        margin: winner.finalBid - bid.finalBid,
      })),
    };
  }

  /**
   * Get current auction session
   */
  getSession(auctionId: string): AuctionSession | undefined {
    return this.activeSessions.get(auctionId);
  }

  /**
   * List all active auctions
   */
  listActiveSessions(workspaceId: string): AuctionSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (s) => s.workspaceId === workspaceId && s.status !== 'COMPLETED'
    );
  }

  /**
   * Get auction history
   */
  async getAuctionHistory(
    workspaceId: string,
    limit: number = 20
  ): Promise<AuctionSession[]> {
    return Array.from(this.activeSessions.values())
      .filter((s) => s.workspaceId === workspaceId && s.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const taskMarketplaceEngine = new TaskMarketplaceEngineImpl();
