/**
 * Bid Evaluation Model
 *
 * Advanced bid scoring and evaluation logic for marketplace auctions.
 * - Multi-dimensional capability matching
 * - Risk-adjusted scoring
 * - Load balancing penalties
 * - Explainability breakdowns
 */

export interface BidScoringInput {
  agentId: string;
  capabilityMatch: number; // 0-100: task domain alignment
  confidence: number; // 0-100: agent confidence
  pastSuccessRate: number; // 0-100: historical success
  contextRelevance: number; // 0-100: task context fit
  risk: number; // 0-100: operational risk
  activeTasks: number; // current workload
  isOptimizer?: boolean; // execution optimizer flag
  isSafetyLayer?: boolean; // safety layer flag
}

export interface ScoringBreakdown {
  baseScore: number;
  capabilityComponent: number;
  confidenceComponent: number;
  successRateComponent: number;
  contextComponent: number;
  riskPenalty: number;
  loadPenalty: number;
  safetyWeight: number;
  optimizerBoost: number;
  finalScore: number;
  explanation: string;
}

export interface BidComparison {
  winner: {
    agentId: string;
    score: number;
    confidence: number;
  };
  alternatives: Array<{
    agentId: string;
    score: number;
    gap: number;
    reason: string;
  }>;
  safetyCheckPassed: boolean;
  riskAssessment: string;
}

/**
 * BidEvaluationModel singleton
 * Evaluates and scores agent bids
 */
class BidEvaluationModelImpl {
  /**
   * Calculate capability match score
   * Higher match = agent has expertise in required domains
   */
  calculateCapabilityMatch(
    agentSpecialties: string[],
    taskDomains: string[]
  ): number {
    if (taskDomains.length === 0) {
return 100;
}
    if (agentSpecialties.length === 0) {
return 0;
}

    const matches = taskDomains.filter((domain) =>
      agentSpecialties.includes(domain)
    ).length;

    return (matches / taskDomains.length) * 100;
  }

  /**
   * Calculate base score (unweighted)
   * Formula: (capability * 0.35) + (confidence * 0.25) + (success * 0.2) + (context * 0.2)
   */
  calculateBaseScore(input: BidScoringInput): number {
    return (
      input.capabilityMatch * 0.35 +
      input.confidence * 0.25 +
      input.pastSuccessRate * 0.2 +
      input.contextRelevance * 0.2
    );
  }

  /**
   * Apply risk penalty
   * risk >= 80 → disqualify (return null)
   * risk >= 65 → 40% reduction
   * risk >= 50 → 20% reduction
   * risk < 50 → no penalty
   */
  applyRiskPenalty(baseScore: number, risk: number): { score: number; penalty: number } {
    let penalty = 1.0;

    if (risk >= 65) {
      penalty = 0.6; // 40% reduction
    } else if (risk >= 50) {
      penalty = 0.8; // 20% reduction
    }

    return {
      score: baseScore * penalty,
      penalty,
    };
  }

  /**
   * Apply load penalty based on active tasks
   * activeTasks >= 5 → 30% reduction
   * activeTasks >= 3 → 10% reduction
   * activeTasks < 3 → no penalty
   */
  applyLoadPenalty(score: number, activeTasks: number): { score: number; penalty: number } {
    let penalty = 1.0;

    if (activeTasks >= 5) {
      penalty = 0.7; // 30% reduction
    } else if (activeTasks >= 3) {
      penalty = 0.9; // 10% reduction
    }

    return {
      score: score * penalty,
      penalty,
    };
  }

  /**
   * Calculate final bid with all weights applied
   */
  calculateFinalBid(input: BidScoringInput): ScoringBreakdown {
    const baseScore = this.calculateBaseScore(input);

    // Risk penalty
    let riskPenalty = 1.0;
    if (input.risk >= 65) {
      riskPenalty = 0.6;
    } else if (input.risk >= 50) {
      riskPenalty = 0.8;
    }
    const scoreAfterRisk = baseScore * riskPenalty;

    // Load penalty
    let loadPenalty = 1.0;
    if (input.activeTasks >= 5) {
      loadPenalty = 0.7;
    } else if (input.activeTasks >= 3) {
      loadPenalty = 0.9;
    }
    const scoreAfterLoad = scoreAfterRisk * loadPenalty;

    // Safety layer weight boost
    const safetyWeight = input.isSafetyLayer ? 1.2 : 1.0;
    const scoreAfterSafety = scoreAfterLoad * safetyWeight;

    // Optimizer boost (execution optimizer gets 1.1x)
    const optimizerBoost = input.isOptimizer ? 1.1 : 1.0;
    const finalScore = scoreAfterSafety * optimizerBoost;

    const explanation = this.generateExplanation(input, {
      base: baseScore,
      riskMult: riskPenalty,
      loadMult: loadPenalty,
      safetyWeight,
      optimizerBoost,
      final: finalScore,
    });

    return {
      baseScore,
      capabilityComponent: input.capabilityMatch * 0.35,
      confidenceComponent: input.confidence * 0.25,
      successRateComponent: input.pastSuccessRate * 0.2,
      contextComponent: input.contextRelevance * 0.2,
      riskPenalty,
      loadPenalty,
      safetyWeight,
      optimizerBoost,
      finalScore,
      explanation,
    };
  }

  /**
   * Generate human-readable explanation of scoring
   */
  private generateExplanation(
    input: BidScoringInput,
    scores: {
      base: number;
      riskMult: number;
      loadMult: number;
      safetyWeight: number;
      optimizerBoost: number;
      final: number;
    }
  ): string {
    const parts: string[] = [];

    parts.push(
      `Base score: ${scores.base.toFixed(1)} (capability: ${input.capabilityMatch.toFixed(0)}%, confidence: ${input.confidence.toFixed(0)}%, success: ${input.pastSuccessRate.toFixed(0)}%, context: ${input.contextRelevance.toFixed(0)}%)`
    );

    if (scores.riskMult < 1.0) {
      parts.push(
        `Risk penalty: ×${scores.riskMult.toFixed(2)} (risk score ${input.risk.toFixed(0)}/100)`
      );
    }

    if (scores.loadMult < 1.0) {
      parts.push(
        `Load penalty: ×${scores.loadMult.toFixed(2)} (${input.activeTasks} active tasks)`
      );
    }

    if (scores.safetyWeight > 1.0) {
      parts.push(`Safety layer boost: ×${scores.safetyWeight.toFixed(2)}`);
    }

    if (scores.optimizerBoost > 1.0) {
      parts.push(`Optimizer boost: ×${scores.optimizerBoost.toFixed(2)}`);
    }

    parts.push(`Final score: ${scores.final.toFixed(1)}`);

    return parts.join(' → ');
  }

  /**
   * Compare multiple bids and identify winner
   */
  compareBids(bidScores: Array<{ agentId: string; score: number; confidence: number }>): BidComparison {
    const sorted = [...bidScores].sort((a, b) => b.score - a.score);

    if (sorted.length === 0) {
      return {
        winner: { agentId: 'none', score: 0, confidence: 0 },
        alternatives: [],
        safetyCheckPassed: false,
        riskAssessment: 'No qualified bids',
      };
    }

    const winner = sorted[0];
    const alternatives = sorted.slice(1, 4).map((bid) => ({
      agentId: bid.agentId,
      score: bid.score,
      gap: winner.score - bid.score,
      reason: `Confidence: ${bid.confidence.toFixed(0)}%`,
    }));

    return {
      winner,
      alternatives,
      safetyCheckPassed: true,
      riskAssessment: `Winner ${winner.agentId} selected with ${winner.score.toFixed(1)} score`,
    };
  }

  /**
   * Validate if bid qualifies based on minimum thresholds
   */
  validateBid(scoring: ScoringBreakdown, minConfidence: number = 40): boolean {
    // Must have minimum confidence and positive final score
    return scoring.confidenceComponent >= minConfidence / 100 && scoring.finalScore > 0;
  }

  /**
   * Get detailed scoring explanation for UI display
   */
  getExplanationReport(scoring: ScoringBreakdown): {
    summary: string;
    components: Record<string, number>;
    penalties: Record<string, number>;
    final: number;
  } {
    return {
      summary: scoring.explanation,
      components: {
        capability: scoring.capabilityComponent,
        confidence: scoring.confidenceComponent,
        success_rate: scoring.successRateComponent,
        context: scoring.contextComponent,
      },
      penalties: {
        risk_multiplier: scoring.riskPenalty,
        load_multiplier: scoring.loadPenalty,
        safety_weight: scoring.safetyWeight,
        optimizer_boost: scoring.optimizerBoost,
      },
      final: scoring.finalScore,
    };
  }
}

export const bidEvaluationModel = new BidEvaluationModelImpl();
