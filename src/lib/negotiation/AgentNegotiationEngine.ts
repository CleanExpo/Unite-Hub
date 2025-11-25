/**
 * Agent Negotiation Engine
 *
 * Manages multi-agent negotiation and consensus building:
 * - Collects action proposals from all agents
 * - Evaluates proposals against multi-dimensional scoring criteria
 * - Detects conflicts and areas of agreement
 * - Calculates consensus scores
 * - Archives negotiation transcripts to memory
 * - Publishes arbitration decisions
 *
 * Core principle: Enable cooperative multi-agent planning instead of single-agent dominance.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface AgentProposal {
  agentId: string;
  proposalId: string;
  action: string;
  actionType: 'execute' | 'skip' | 'defer' | 'escalate';
  confidence: number; // 0-100
  riskScore: number; // 0-100
  estimatedCost: number;
  estimatedBenefit: number;
  rationale: string;
  supportingEvidence: string[];
  timestamp: string;
}

export interface ConsensusScore {
  agentId: string;
  confidenceScore: number;
  riskAdjustedScore: number;
  weightedScore: number;
  overallConsensus: number; // 0-100
}

export interface NegotiationSession {
  sessionId: string;
  workspaceId: string;
  status: 'active' | 'resolved' | 'deadlocked' | 'escalated';
  participatingAgents: string[];
  objective: string;
  proposals: AgentProposal[];
  consensusScores: ConsensusScore[];
  conflicts: Array<{
    agentIds: string[];
    conflictType: 'action_mismatch' | 'risk_disagreement' | 'cost_disagreement';
    severity: number;
  }>;
  negotiationTranscript: string;
  finalDecision?: {
    selectedAction: string;
    selectedAgent: string;
    rationale: string;
    consensusAchieved: boolean;
  };
  createdAt: string;
  resolvedAt?: string;
}

class AgentNegotiationEngine {
  private memoryStore = new MemoryStore();
  private agentWeights = {
    orchestrator: 1.0,
    reasoning_engine: 0.9,
    autonomy_engine: 0.95,
    safety_layer: 1.2, // Safety gets higher weight in conflicts
    optimizer: 0.85,
    desktop_agent: 0.7,
    synthex_agent: 0.75,
  };

  /**
   * Start negotiation session with agent proposals
   */
  async startNegotiationSession(params: {
    workspaceId: string;
    objective: string;
    participatingAgents: string[];
    proposals: AgentProposal[];
  }): Promise<NegotiationSession> {
    const supabase = await getSupabaseServer();
    const sessionId = crypto.randomUUID();

    try {
      // 1. Store session
      const session: NegotiationSession = {
        sessionId,
        workspaceId: params.workspaceId,
        status: 'active',
        participatingAgents: params.participatingAgents,
        objective: params.objective,
        proposals: params.proposals,
        consensusScores: [],
        conflicts: [],
        negotiationTranscript: this.generateInitialTranscript(params),
        createdAt: new Date().toISOString(),
      };

      // 2. Evaluate proposals
      const consensusScores = await this.evaluateProposals(
        params.proposals,
        params.workspaceId
      );
      session.consensusScores = consensusScores;

      // 3. Detect conflicts
      session.conflicts = this.detectConflicts(params.proposals);

      // 4. Store in database
      await supabase.from('agent_negotiation_sessions').insert({
        workspace_id: params.workspaceId,
        session_id: sessionId,
        objective: params.objective,
        participating_agents: params.participatingAgents,
        status: 'active',
        proposals: params.proposals,
        consensus_scores: consensusScores,
        conflicts: session.conflicts,
        transcript: session.negotiationTranscript,
        created_at: session.createdAt,
      });

      // 5. Archive to memory
      await this.memoryStore.store({
        workspaceId: params.workspaceId,
        agent: 'negotiation-engine',
        memoryType: 'negotiation_session_start',
        content: {
          session_id: sessionId,
          objective: params.objective,
          agents_count: params.participatingAgents.length,
          proposals_count: params.proposals.length,
          timestamp: new Date().toISOString(),
        },
        importance: 75,
        confidence: 90,
        keywords: ['negotiation', 'multi-agent', 'consensus', 'arbitration'],
      });

      return session;
    } catch (error) {
      console.error('Negotiation session error:', error);
      throw error;
    }
  }

  /**
   * Evaluate proposals and compute consensus scores
   */
  private async evaluateProposals(
    proposals: AgentProposal[],
    workspaceId: string
  ): Promise<ConsensusScore[]> {
    const consensusScores: ConsensusScore[] = [];

    for (const proposal of proposals) {
      // Get agent weight (default 0.8 if unknown)
      const agentWeight = this.agentWeights[proposal.agentId as keyof typeof this.agentWeights] || 0.8;

      // Confidence score (from proposal, normalized 0-100)
      const confidenceScore = Math.min(100, Math.max(0, proposal.confidence));

      // Risk-adjusted score (higher confidence - higher risk = lower score)
      const riskAdjustment = (proposal.riskScore / 100) * 40; // Risk can reduce score by up to 40%
      const riskAdjustedScore = Math.max(0, confidenceScore - riskAdjustment);

      // Cost-benefit weighted score
      const benefitToCostRatio = proposal.estimatedBenefit / Math.max(0.01, proposal.estimatedCost);
      const costAdjustment = Math.min(20, benefitToCostRatio * 10); // Benefit-to-cost can add up to 20 points
      const costWeightedScore = Math.min(100, riskAdjustedScore + costAdjustment);

      // Final weighted score incorporating agent weight
      const weightedScore = costWeightedScore * agentWeight;

      // Overall consensus (normalized)
      const overallConsensus = Math.min(100, Math.round(weightedScore));

      consensusScores.push({
        agentId: proposal.agentId,
        confidenceScore,
        riskAdjustedScore: Math.round(riskAdjustedScore),
        weightedScore: Math.round(weightedScore),
        overallConsensus,
      });
    }

    return consensusScores;
  }

  /**
   * Detect conflicts between proposals
   */
  private detectConflicts(proposals: AgentProposal[]): NegotiationSession['conflicts'] {
    const conflicts: NegotiationSession['conflicts'] = [];

    // Check for action mismatches
    const actionGroups: Record<string, string[]> = {};
    for (const proposal of proposals) {
      if (!actionGroups[proposal.action]) {
        actionGroups[proposal.action] = [];
      }
      actionGroups[proposal.action].push(proposal.agentId);
    }

    // If proposals are split, there's disagreement
    const uniqueActions = Object.keys(actionGroups).length;
    if (uniqueActions > 1) {
      const agentIds = proposals.map(p => p.agentId);
      conflicts.push({
        agentIds,
        conflictType: 'action_mismatch',
        severity: (uniqueActions / proposals.length) * 100,
      });
    }

    // Check for risk disagreement
    const riskScores = proposals.map(p => p.riskScore);
    const riskMean = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    const riskVariance = riskScores.reduce((sum, r) => sum + Math.pow(r - riskMean, 2), 0) / riskScores.length;
    const riskStdDev = Math.sqrt(riskVariance);

    if (riskStdDev > 20) {
      conflicts.push({
        agentIds: proposals.map(p => p.agentId),
        conflictType: 'risk_disagreement',
        severity: Math.min(100, riskStdDev),
      });
    }

    // Check for cost disagreement
    const costs = proposals.map(p => p.estimatedCost);
    const costMean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const costVariance = costs.reduce((sum, c) => sum + Math.pow(c - costMean, 2), 0) / costs.length;
    const costStdDev = Math.sqrt(costVariance);
    const costCoeffVariation = costStdDev / Math.max(0.01, costMean);

    if (costCoeffVariation > 0.5) {
      conflicts.push({
        agentIds: proposals.map(p => p.agentId),
        conflictType: 'cost_disagreement',
        severity: Math.min(100, costCoeffVariation * 50),
      });
    }

    return conflicts;
  }

  /**
   * Generate initial negotiation transcript
   */
  private generateInitialTranscript(params: {
    objective: string;
    participatingAgents: string[];
    proposals: AgentProposal[];
  }): string {
    const lines: string[] = [
      '# Agent Negotiation Transcript',
      '',
      `## Objective`,
      `${params.objective}`,
      '',
      `## Participating Agents (${params.participatingAgents.length})`,
      params.participatingAgents.map(a => `- ${a}`).join('\n'),
      '',
      `## Initial Proposals (${params.proposals.length})`,
    ];

    for (const proposal of params.proposals) {
      lines.push(
        '',
        `### ${proposal.agentId} - ${proposal.action}`,
        `- **Type**: ${proposal.actionType}`,
        `- **Confidence**: ${proposal.confidence}%`,
        `- **Risk**: ${proposal.riskScore}/100`,
        `- **Est. Cost**: $${proposal.estimatedCost.toFixed(4)}`,
        `- **Est. Benefit**: $${proposal.estimatedBenefit.toFixed(4)}`,
        `- **Rationale**: ${proposal.rationale}`
      );
    }

    lines.push('', '## Negotiation Status', '**Status**: Evaluation in progress');

    return lines.join('\n');
  }

  /**
   * Get active negotiation session
   */
  async getActiveNegotiation(params: {
    workspaceId: string;
    sessionId?: string;
  }): Promise<NegotiationSession | null> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('agent_negotiation_sessions')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .in('status', ['active', 'deadlocked']);

    if (params.sessionId) {
      query = query.eq('session_id', params.sessionId);
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(1);

    if (!data || data.length === 0) return null;

    const session = data[0];
    return {
      sessionId: session.session_id,
      workspaceId: session.workspace_id,
      status: session.status,
      participatingAgents: session.participating_agents,
      objective: session.objective,
      proposals: session.proposals,
      consensusScores: session.consensus_scores,
      conflicts: session.conflicts,
      negotiationTranscript: session.transcript,
      finalDecision: session.final_decision,
      createdAt: session.created_at,
      resolvedAt: session.resolved_at,
    };
  }

  /**
   * Calculate overall consensus metric
   */
  calculateOverallConsensus(consensusScores: ConsensusScore[]): number {
    if (consensusScores.length === 0) return 0;
    const avgConsensus = consensusScores.reduce((sum, cs) => sum + cs.overallConsensus, 0) / consensusScores.length;
    return Math.round(avgConsensus);
  }

  /**
   * Archive negotiation session with insights
   */
  async archiveNegotiationSession(params: {
    workspaceId: string;
    sessionId: string;
    finalDecision: {
      selectedAction: string;
      selectedAgent: string;
      rationale: string;
      consensusAchieved: boolean;
    };
    outcome: 'success' | 'partial' | 'failed';
  }): Promise<void> {
    const supabase = await getSupabaseServer();

    // Archive to memory
    await this.memoryStore.store({
      workspaceId: params.workspaceId,
      agent: 'negotiation-engine',
      memoryType: 'negotiation_resolved',
      content: {
        session_id: params.sessionId,
        decision_agent: params.finalDecision.selectedAgent,
        action: params.finalDecision.selectedAction,
        consensus: params.finalDecision.consensusAchieved,
        outcome: params.outcome,
        timestamp: new Date().toISOString(),
      },
      importance: Math.max(60, params.finalDecision.consensusAchieved ? 80 : 50),
      confidence: 85,
      keywords: ['negotiation', 'consensus', 'decision', 'arbitration'],
    });
  }
}

export const agentNegotiationEngine = new AgentNegotiationEngine();
