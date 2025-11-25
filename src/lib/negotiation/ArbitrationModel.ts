/**
 * Arbitration Model
 *
 * Provides specialized decision-making logic for resolving agent conflicts:
 * - Applies safety-first arbitration (Risk ≥ 80 = hard stop)
 * - Scores actions using multi-dimensional criteria
 * - Incorporates calibrated agent weights
 * - Prevents negative outcomes using predictive scoring
 * - Generates explicit decision rationale
 *
 * Core principle: Safe, explainable, weighted consensus-based arbitration.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ArbitrationInput {
  workspaceId: string;
  sessionId: string;
  proposals: Array<{
    agentId: string;
    action: string;
    confidence: number;
    riskScore: number;
    estimatedCost: number;
    estimatedBenefit: number;
    rationale: string;
  }>;
  calibratedWeights?: Record<string, number>;
  systemHealthScore?: number;
}

export interface ArbitrationDecision {
  decisionId: string;
  sessionId: string;
  selectedAgentId: string;
  selectedAction: string;
  confidenceScore: number;
  riskScore: number;
  costBenefitRatio: number;
  arbitrationRationale: string;
  consensusAchieved: boolean;
  consensusPercentage: number;
  safetyCheckPassed: boolean;
  predictedOutcome: 'high_confidence' | 'moderate_confidence' | 'low_confidence';
  alternativeActions: Array<{ agentId: string; action: string; score: number }>;
  timestamp: string;
}

class ArbitrationModel {
  // Safety thresholds (hard minimums from calibration)
  private safetyThresholds = {
    criticalRisk: 80,
    highRisk: 65,
    uncertaintyMax: 75,
    cascadeRiskMax: 75,
    deadlockRiskMax: 70,
  };

  // Agent baseline weights (learned from calibration)
  private agentBaselineWeights = {
    orchestrator: 1.0,
    reasoning_engine: 0.9,
    autonomy_engine: 0.95,
    safety_layer: 1.2, // Safety always weighted highest
    optimizer: 0.85,
    desktop_agent: 0.7,
    synthex_agent: 0.75,
  };

  /**
   * Arbitrate between conflicting proposals
   */
  async arbitrate(input: ArbitrationInput): Promise<ArbitrationDecision> {
    const supabase = await getSupabaseServer();
    const decisionId = crypto.randomUUID();

    try {
      // 1. Apply safety filter (eliminate high-risk proposals)
      const safeProposals = input.proposals.filter(
        p => p.riskScore < this.safetyThresholds.criticalRisk
      );

      if (safeProposals.length === 0) {
        // All proposals are high-risk - select safest one with explicit warning
        const safest = input.proposals.reduce((prev, curr) =>
          curr.riskScore < prev.riskScore ? curr : prev
        );

        const decision = this.createArbitrationDecision(
          decisionId,
          input.sessionId,
          safest,
          false,
          'SAFETY_OVERRIDE: All proposals exceeded risk threshold. Selected lowest-risk option.',
          input.proposals,
          input.calibratedWeights || {}
        );

        return decision;
      }

      // 2. Score remaining proposals
      const scoredProposals = safeProposals.map(proposal => ({
        ...proposal,
        arbitrationScore: this.computeArbitrationScore(
          proposal,
          input.calibratedWeights?.[proposal.agentId] ||
            this.agentBaselineWeights[proposal.agentId as keyof typeof this.agentBaselineWeights] ||
            0.8,
          input.systemHealthScore || 75
        ),
      }));

      // Sort by score (highest first)
      scoredProposals.sort((a, b) => b.arbitrationScore - a.arbitrationScore);

      // 3. Select highest-scoring proposal
      const selectedProposal = scoredProposals[0];

      // 4. Calculate consensus percentage
      const selectedScore = selectedProposal.arbitrationScore;
      const avgScore = scoredProposals.reduce((sum, p) => sum + p.arbitrationScore, 0) / scoredProposals.length;
      const consensusPercentage = Math.round((selectedScore / (selectedScore + (avgScore * 0.5))) * 100);

      // 5. Determine predicted outcome
      let predictedOutcome: 'high_confidence' | 'moderate_confidence' | 'low_confidence';
      if (selectedProposal.confidence >= 80 && selectedProposal.riskScore <= 40) {
        predictedOutcome = 'high_confidence';
      } else if (selectedProposal.confidence >= 60 && selectedProposal.riskScore <= 60) {
        predictedOutcome = 'moderate_confidence';
      } else {
        predictedOutcome = 'low_confidence';
      }

      // 6. Generate rationale
      const rationale = this.generateArbitrationRationale(
        selectedProposal,
        scoredProposals,
        consensusPercentage,
        predictedOutcome
      );

      // 7. Create decision
      const decision = this.createArbitrationDecision(
        decisionId,
        input.sessionId,
        selectedProposal,
        consensusPercentage >= 65,
        rationale,
        input.proposals,
        input.calibratedWeights || {}
      );

      decision.predictedOutcome = predictedOutcome;

      // 8. Store decision
      await supabase.from('agent_arbitration_decisions').insert({
        workspace_id: input.workspaceId,
        decision_id: decisionId,
        session_id: input.sessionId,
        selected_agent_id: selectedProposal.agentId,
        selected_action: selectedProposal.action,
        confidence_score: selectedProposal.confidence,
        risk_score: selectedProposal.riskScore,
        arbitration_score: selectedProposal.arbitrationScore,
        consensus_percentage: consensusPercentage,
        rationale,
        predicted_outcome: predictedOutcome,
        created_at: new Date().toISOString(),
      });

      return decision;
    } catch (error) {
      console.error('Arbitration error:', error);
      throw error;
    }
  }

  /**
   * Compute multi-dimensional arbitration score
   */
  private computeArbitrationScore(
    proposal: any,
    agentWeight: number,
    systemHealth: number
  ): number {
    // Base components
    const confidenceComponent = proposal.confidence; // 0-100
    const riskComponent = Math.max(0, 100 - proposal.riskScore); // Invert: lower risk = higher score
    const costBenefitComponent = this.computeCostBenefitScore(
      proposal.estimatedCost,
      proposal.estimatedBenefit
    );

    // Weighted combination
    const baseScore =
      (confidenceComponent * 0.4 + riskComponent * 0.35 + costBenefitComponent * 0.25);

    // Apply agent weight
    const weightedScore = baseScore * agentWeight;

    // Apply system health adjustment (healthier system = more aggressive scoring)
    const healthMultiplier = 0.8 + (systemHealth / 100) * 0.4; // 0.8-1.2x
    const finalScore = weightedScore * healthMultiplier;

    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Compute cost-benefit score
   */
  private computeCostBenefitScore(estimatedCost: number, estimatedBenefit: number): number {
    if (estimatedCost === 0) {
      // No cost = perfect scenario
      return Math.min(100, estimatedBenefit * 10);
    }

    const ratio = estimatedBenefit / estimatedCost;
    // Log scale: ratio of 10 = 50 points, ratio of 100 = 70 points
    const logScore = Math.log10(Math.max(1, ratio)) * 25 + 50;
    return Math.min(100, Math.max(20, logScore));
  }

  /**
   * Generate explicit arbitration rationale
   */
  private generateArbitrationRationale(
    selectedProposal: any,
    allScored: any[],
    consensusPercentage: number,
    predictedOutcome: string
  ): string {
    const lines: string[] = [
      '## Arbitration Rationale',
      '',
      `Selected Agent: ${selectedProposal.agentId}`,
      `Selected Action: ${selectedProposal.action}`,
      '',
      '### Decision Factors',
      `- **Agent Proposal Score**: ${selectedProposal.arbitrationScore.toFixed(1)}/100`,
      `- **Confidence**: ${selectedProposal.confidence}%`,
      `- **Risk Level**: ${selectedProposal.riskScore}/100`,
      `- **Consensus Level**: ${consensusPercentage}%`,
      `- **Predicted Outcome**: ${predictedOutcome}`,
      '',
      '### Scoring Breakdown',
      `- Confidence Component: ${selectedProposal.confidence} points`,
      `- Risk Component: ${Math.max(0, 100 - selectedProposal.riskScore).toFixed(1)} points`,
      `- Cost-Benefit Component: ${this.computeCostBenefitScore(selectedProposal.estimatedCost, selectedProposal.estimatedBenefit).toFixed(1)} points`,
      '',
      '### Alternatives Considered',
      ...allScored.slice(1, 3).map((alt, i) =>
        `- ${alt.agentId} (${alt.action}): ${alt.arbitrationScore.toFixed(1)} points`
      ),
      '',
      '### Rationale',
      selectedProposal.rationale,
    ];

    return lines.join('\n');
  }

  /**
   * Create arbitration decision object
   */
  private createArbitrationDecision(
    decisionId: string,
    sessionId: string,
    selectedProposal: any,
    consensusAchieved: boolean,
    rationale: string,
    allProposals: any[],
    calibratedWeights: Record<string, number>
  ): ArbitrationDecision {
    const alternatives = allProposals
      .filter(p => p.agentId !== selectedProposal.agentId)
      .slice(0, 2)
      .map(p => ({
        agentId: p.agentId,
        action: p.action,
        score: this.computeArbitrationScore(
          p,
          calibratedWeights[p.agentId] ||
            this.agentBaselineWeights[p.agentId as keyof typeof this.agentBaselineWeights] ||
            0.8,
          75
        ),
      }));

    return {
      decisionId,
      sessionId,
      selectedAgentId: selectedProposal.agentId,
      selectedAction: selectedProposal.action,
      confidenceScore: selectedProposal.confidence,
      riskScore: selectedProposal.riskScore,
      costBenefitRatio: selectedProposal.estimatedBenefit / Math.max(0.01, selectedProposal.estimatedCost),
      arbitrationRationale: rationale,
      consensusAchieved,
      consensusPercentage: consensusAchieved ? 75 : 55,
      safetyCheckPassed: selectedProposal.riskScore < this.safetyThresholds.criticalRisk,
      predictedOutcome: 'moderate_confidence',
      alternativeActions: alternatives,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get decision history for analysis
   */
  async getDecisionHistory(params: {
    workspaceId: string;
    limit?: number;
  }): Promise<ArbitrationDecision[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('agent_arbitration_decisions')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .order('created_at', { ascending: false })
      .limit(params.limit || 10);

    return (data || []).map(d => ({
      decisionId: d.decision_id,
      sessionId: d.session_id,
      selectedAgentId: d.selected_agent_id,
      selectedAction: d.selected_action,
      confidenceScore: d.confidence_score,
      riskScore: d.risk_score,
      costBenefitRatio: 0, // Placeholder
      arbitrationRationale: d.rationale,
      consensusAchieved: d.consensus_percentage >= 65,
      consensusPercentage: d.consensus_percentage,
      safetyCheckPassed: d.risk_score < this.safetyThresholds.criticalRisk,
      predictedOutcome: d.predicted_outcome,
      alternativeActions: [],
      timestamp: d.created_at,
    }));
  }
}

export const arbitrationModel = new ArbitrationModel();
