/**
 * Coalition Formation Engine
 *
 * Determines which agents should form a coalition for a task,
 * computes synergy scores, assigns roles, and validates via safety layer.
 *
 * Algorithm: Synergy Score = (capability_overlap * 0.35) + (skill_complement * 0.25)
 *                           + (historical_success * 0.2) + (safety_profile * 0.2)
 */

import { memoryStore } from '@/lib/memory';
import { AuctionSession } from '@/state/useMarketplaceStore';

export interface Agent {
  agentId: string;
  capabilities: string[];
  successRate: number;
  riskScore: number;
  loadFactor: number;
  pastCoalitions: CoalitionHistory[];
}

export interface CoalitionCandidate {
  agentId: string;
  synergyCon: number;
  capabilityOverlap: number;
  skillComplement: number;
  historicalSuccess: number;
  safetyProfile: number;
  riskVeto: boolean;
  vetoReason?: string;
}

export interface CoalitionProposal {
  coalitionId: string;
  taskId: string;
  taskComplexity: number;
  agentIds: string[];
  synergyCandidates: CoalitionCandidate[];
  coalitionSynergyScore: number;
  recommendedLeader: string;
  estimatedOutcome: number;
  safetyApproved: boolean;
  safetyVetoes: string[];
  timestamp: string;
}

export interface CoalitionHistory {
  coalitionId: string;
  taskId: string;
  agentIds: string[];
  synergyScore: number;
  outcome: 'success' | 'partial_success' | 'failure';
  executionTime: number;
  completedAt: string;
}

/**
 * Coalition Formation Engine - Determines coalition viability and composition
 */
export class CoalitionFormationEngine {
  private minSynergyThreshold = 65;
  private maxRiskForMember = 80;

  /**
   * Evaluate if agents should form a coalition
   */
  async evaluateCoalition(
    taskId: string,
    taskComplexity: number,
    requiredCapabilities: string[],
    candidateAgents: Agent[]
  ): Promise<CoalitionProposal> {
    const coalitionId = `coalition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Filter agents by risk threshold
    const eligibleAgents = candidateAgents.filter((a) => a.riskScore < this.maxRiskForMember);
    const vetoed = candidateAgents.filter((a) => a.riskScore >= this.maxRiskForMember);

    if (eligibleAgents.length < 2) {
      return {
        coalitionId,
        taskId,
        taskComplexity,
        agentIds: [],
        synergyCandidates: [],
        coalitionSynergyScore: 0,
        recommendedLeader: '',
        estimatedOutcome: 0,
        safetyApproved: false,
        safetyVetoes: vetoed.map((a) => a.agentId),
        timestamp: new Date().toISOString(),
      };
    }

    // Score each candidate
    const synergyScores = await Promise.all(
      eligibleAgents.map((agent) =>
        this.calculateAgentSynergy(agent, requiredCapabilities, eligibleAgents)
      )
    );

    // Select top candidates (typically 2-4 agents)
    const selectedCount = Math.min(Math.ceil(requiredCapabilities.length / 2) + 1, eligibleAgents.length);
    const ranked = eligibleAgents
      .map((agent, idx) => ({
        ...synergyScores[idx],
        agentId: agent.agentId,
      }))
      .sort((a, b) => b.synergyCon - a.synergyCon)
      .slice(0, selectedCount);

    // Compute coalition-level synergy
    const coalitionSynergy = this.calculateCoalitionSynergy(ranked);

    // Recommend leader (highest synergy + success rate)
    const recommendedLeader = ranked[0].agentId;

    // Check safety approval
    const safetyApproved = coalitionSynergy >= this.minSynergyThreshold && vetoed.length === 0;

    return {
      coalitionId,
      taskId,
      taskComplexity,
      agentIds: ranked.map((r) => r.agentId),
      synergyCandidates: ranked,
      coalitionSynergyScore: coalitionSynergy,
      recommendedLeader,
      estimatedOutcome: this.estimateCoalitionOutcome(ranked, coalitionSynergy, taskComplexity),
      safetyApproved,
      safetyVetoes: vetoed.map((a) => a.agentId),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate synergy score for a single agent in context of coalition
   */
  private async calculateAgentSynergy(
    agent: Agent,
    requiredCapabilities: string[],
    allEligible: Agent[]
  ): Promise<CoalitionCandidate> {
    // Capability overlap: how many required capabilities does agent have?
    const capabilityOverlap = this.calculateCapabilityOverlap(agent.capabilities, requiredCapabilities);

    // Skill complement: how well does agent fill gaps others don't?
    const skillComplement = this.calculateSkillComplement(agent, allEligible, requiredCapabilities);

    // Historical success: past coalition success rate
    const historicalSuccess = this.calculateHistoricalSuccess(agent);

    // Safety profile: inverse of risk score (normalized 0-100)
    const safetyProfile = Math.max(0, 100 - agent.riskScore);

    // Weighted synergy score
    const synergyCon =
      capabilityOverlap * 0.35 + skillComplement * 0.25 + historicalSuccess * 0.2 + safetyProfile * 0.2;

    return {
      agentId: agent.agentId,
      synergyCon,
      capabilityOverlap,
      skillComplement,
      historicalSuccess,
      safetyProfile,
      riskVeto: agent.riskScore >= this.maxRiskForMember,
      vetoReason: agent.riskScore >= this.maxRiskForMember ? `Risk ${agent.riskScore}% >= threshold` : undefined,
    };
  }

  /**
   * Calculate how many required capabilities agent brings
   */
  private calculateCapabilityOverlap(agentCapabilities: string[], requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 0;

    const matches = requiredCapabilities.filter((req) =>
      agentCapabilities.some((cap) => cap.toLowerCase().includes(req.toLowerCase()))
    ).length;

    return (matches / requiredCapabilities.length) * 100;
  }

  /**
   * Calculate how well agent fills gaps others don't cover
   */
  private calculateSkillComplement(
    agent: Agent,
    allEligible: Agent[],
    requiredCapabilities: string[]
  ): number {
    // Count how many other agents have agent's capabilities
    const overlappingAgents = allEligible.filter(
      (other) =>
        other.agentId !== agent.agentId &&
        other.capabilities.some((cap) =>
          agent.capabilities.some((agentCap) => agentCap.toLowerCase() === cap.toLowerCase())
        )
    ).length;

    // Unique capabilities (not shared by many others)
    const uniqueCapabilityScore = Math.max(0, 100 - overlappingAgents * 20);

    // Coverage of required capabilities others don't have
    const uncoveredByOthers = requiredCapabilities.filter((req) => {
      const coveredByOthers = allEligible.some(
        (other) =>
          other.agentId !== agent.agentId &&
          other.capabilities.some((cap) => cap.toLowerCase().includes(req.toLowerCase()))
      );
      return !coveredByOthers;
    }).length;

    const agentCovers = agent.capabilities.filter((cap) =>
      requiredCapabilities.some((req) => cap.toLowerCase().includes(req.toLowerCase()))
    ).length;

    const gapFillingScore = agentCovers > 0 ? (agentCovers / Math.max(1, uncoveredByOthers)) * 100 : 0;

    return (uniqueCapabilityScore + gapFillingScore) / 2;
  }

  /**
   * Calculate agent's historical coalition success rate
   */
  private calculateHistoricalSuccess(agent: Agent): number {
    if (agent.pastCoalitions.length === 0) {
      return agent.successRate; // Use individual success rate
    }

    const successCount = agent.pastCoalitions.filter((c) => c.outcome === 'success').length;
    const partialCount = agent.pastCoalitions.filter((c) => c.outcome === 'partial_success').length;

    const coalitionSuccessRate = (successCount + partialCount * 0.5) / agent.pastCoalitions.length;

    // Average with individual success rate
    return (coalitionSuccessRate + agent.successRate) / 2 * 100;
  }

  /**
   * Calculate coalition-level synergy from member scores
   */
  private calculateCoalitionSynergy(candidates: CoalitionCandidate[]): number {
    if (candidates.length === 0) return 0;

    // Average of individual scores
    const avgSynergy = candidates.reduce((sum, c) => sum + c.synergyCon, 0) / candidates.length;

    // Diversity bonus: more agents = higher diversity potential (up to 4 agents)
    const diversityBonus = Math.min(candidates.length - 1, 3) * 5; // +5 per agent, max +15

    // Variance bonus: if scores are varied (not all same), there's complementarity
    const variance =
      candidates.length > 1
        ? candidates.reduce((sum, c) => sum + Math.pow(c.synergyCon - avgSynergy, 2), 0) / candidates.length
        : 0;
    const varianceBonus = Math.min(variance / 10, 10); // Cap at +10

    return Math.min(avgSynergy + diversityBonus + varianceBonus, 100);
  }

  /**
   * Estimate coalition outcome probability based on synergy and complexity
   */
  private estimateCoalitionOutcome(
    candidates: CoalitionCandidate[],
    coalitionSynergy: number,
    taskComplexity: number
  ): number {
    if (candidates.length === 0) return 0;

    // Base success probability from synergy
    const synergyContribution = coalitionSynergy / 100;

    // Complexity adjustment (higher complexity reduces success probability)
    const complexityPenalty = 1 - Math.max(0, Math.min(1, taskComplexity / 100));

    // Average candidate success rates
    const avgHistoricalSuccess = candidates.reduce((sum, c) => sum + c.historicalSuccess, 0) / candidates.length / 100;

    // Ensemble effect: multiple agents reduce single-point failure
    const ensembleBonus = 0.1 * Math.min(candidates.length - 1, 2); // +10% per extra agent, max +20%

    const outcome =
      (synergyContribution * 0.4 + avgHistoricalSuccess * 0.3 + complexityPenalty * 0.3 + ensembleBonus) * 100;

    return Math.min(Math.max(outcome, 0), 100);
  }

  /**
   * Archive coalition formation decision to memory
   */
  async archiveCoalitionProposal(proposal: CoalitionProposal): Promise<void> {
    try {
      const archive = await memoryStore.retrieve('coalitions_archive', {});

      if (!archive.coalitions) {
        archive.coalitions = [];
      }

      archive.coalitions.push({
        coalitionId: proposal.coalitionId,
        taskId: proposal.taskId,
        agentIds: proposal.agentIds,
        synergyScore: proposal.coalitionSynergyScore,
        safetyApproved: proposal.safetyApproved,
        safetyVetoes: proposal.safetyVetoes,
        timestamp: proposal.timestamp,
      });

      await memoryStore.store('coalitions_archive', archive);
    } catch (error) {
      console.error('Error archiving coalition proposal:', error);
    }
  }

  /**
   * Get formation engine status for diagnostics
   */
  getEngineStatus(): Record<string, any> {
    return {
      minSynergyThreshold: this.minSynergyThreshold,
      maxRiskForMember: this.maxRiskForMember,
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
}

export const coalitionFormationEngine = new CoalitionFormationEngine();
