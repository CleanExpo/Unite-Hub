/**
 * Autonomy Scoring Model
 *
 * Calculates global autonomy confidence score using weighted factors:
 * - Readiness (30%): Are all agents ready and healthy?
 * - Consistency (30%): Do memories align with the current plan?
 * - Confidence (20%): How confident are we in the decision?
 * - Risk (20%): What is the cross-agent risk level?
 *
 * Formula: Autonomy = (Readiness + Consistency + Confidence - Risk) / 4
 * Range: 0-100 (higher is better)
 */

export interface AutonomyScoringParams {
  readiness: number; // 0-100
  consistency: number; // 0-100
  confidence: number; // 0-100
  riskScore: number; // 0-100
  uncertaintyScore: number; // 0-100
}

export const autonomyScoringModel = {
  /**
   * Calculate overall autonomy score
   */
  calculateAutonomyScore(params: AutonomyScoringParams): number {
    const { readiness, consistency, confidence, riskScore, uncertaintyScore } = params;

    // Weighted calculation
    const weightedScore =
      readiness * 0.3 + consistency * 0.3 + confidence * 0.2 - (riskScore * 0.2);

    // Apply uncertainty dampening (uncertainty reduces effective score)
    const uncertaintyDampening = 1 - uncertaintyScore / 200; // 0-0.5 dampening
    const finalScore = Math.max(0, Math.round(weightedScore * uncertaintyDampening));

    return Math.min(100, finalScore);
  },

  /**
   * Get autonomy recommendation based on score
   */
  getRecommendation(
    autonomyScore: number,
    riskScore: number,
    uncertaintyScore: number
  ): 'proceed' | 'validate' | 'pause' | 'halt' {
    // Safety gates override autonomy score
    if (riskScore >= 80) {
return 'halt';
}
    if (riskScore >= 60 && autonomyScore < 60) {
return 'halt';
}
    if (uncertaintyScore >= 75) {
return 'pause';
}
    if (autonomyScore < 40) {
return 'validate';
}

    return 'proceed';
  },

  /**
   * Get readiness explanation
   */
  explainReadiness(readiness: number): {
    level: string;
    explanation: string;
    recommendation: string;
  } {
    if (readiness >= 80) {
      return {
        level: 'Excellent',
        explanation: 'All agents are healthy and prepared.',
        recommendation: 'Safe to proceed with full autonomy.',
      };
    }
    if (readiness >= 60) {
      return {
        level: 'Good',
        explanation: 'Most agents are ready. Some may have minor issues.',
        recommendation: 'Proceed with monitoring.',
      };
    }
    if (readiness >= 40) {
      return {
        level: 'Fair',
        explanation: 'Several agents report issues. Readiness is compromised.',
        recommendation: 'Run validation checks before proceeding.',
      };
    }
    return {
      level: 'Poor',
      explanation: 'Multiple agents offline or degraded.',
      recommendation: 'Do not proceed. Address agent issues first.',
    };
  },

  /**
   * Get consistency explanation
   */
  explainConsistency(consistency: number): {
    level: string;
    explanation: string;
    recommendation: string;
  } {
    if (consistency >= 80) {
      return {
        level: 'High',
        explanation: 'Memories strongly support the current plan.',
        recommendation: 'Strong confidence in decision alignment.',
      };
    }
    if (consistency >= 60) {
      return {
        level: 'Moderate',
        explanation: 'Some memories support plan, but gaps exist.',
        recommendation: 'Review memory coverage before execution.',
      };
    }
    if (consistency >= 40) {
      return {
        level: 'Low',
        explanation: 'Limited memory support for plan.',
        recommendation: 'Gather more context before proceeding.',
      };
    }
    return {
      level: 'Very Low',
      explanation: 'Memories contradict or do not support plan.',
      recommendation: 'Halt execution. Plan conflicts with known patterns.',
    };
  },

  /**
   * Get confidence explanation
   */
  explainConfidence(confidence: number): {
    level: string;
    explanation: string;
    recommendation: string;
  } {
    if (confidence >= 85) {
      return {
        level: 'Very High',
        explanation: 'High confidence from memory, reasoning, and orchestration.',
        recommendation: 'Proceed with full autonomy.',
      };
    }
    if (confidence >= 70) {
      return {
        level: 'High',
        explanation: 'Good confidence from multiple sources.',
        recommendation: 'Safe to proceed with monitoring.',
      };
    }
    if (confidence >= 50) {
      return {
        level: 'Moderate',
        explanation: 'Mixed confidence signals. Some uncertainty present.',
        recommendation: 'Proceed with validation checkpoints.',
      };
    }
    return {
      level: 'Low',
      explanation: 'Low confidence from decision sources.',
      recommendation: 'Require additional validation before execution.',
    };
  },

  /**
   * Get risk assessment explanation
   */
  explainRisk(riskScore: number): {
    level: string;
    explanation: string;
    recommendation: string;
  } {
    if (riskScore <= 30) {
      return {
        level: 'Low',
        explanation: 'Risk factors are minimal.',
        recommendation: 'Safe to execute with standard monitoring.',
      };
    }
    if (riskScore <= 60) {
      return {
        level: 'Moderate',
        explanation: 'Some risk factors present. Mitigation controls recommended.',
        recommendation: 'Proceed with enhanced monitoring and approval gates.',
      };
    }
    if (riskScore <= 80) {
      return {
        level: 'High',
        explanation: 'Significant risk factors. Escalation recommended.',
        recommendation: 'Require explicit approval before execution.',
      };
    }
    return {
      level: 'Critical',
      explanation: 'Severe risk factors. System safety compromised.',
      recommendation: 'Do not proceed. Address risks before execution.',
    };
  },

  /**
   * Get uncertainty assessment explanation
   */
  explainUncertainty(uncertaintyScore: number): {
    level: string;
    explanation: string;
    recommendation: string;
  } {
    if (uncertaintyScore <= 30) {
      return {
        level: 'Low',
        explanation: 'High confidence in data and predictions.',
        recommendation: 'Safe to proceed with normal gating.',
      };
    }
    if (uncertaintyScore <= 50) {
      return {
        level: 'Moderate',
        explanation: 'Reasonable confidence with some data gaps.',
        recommendation: 'Proceed with monitoring and checkpoints.',
      };
    }
    if (uncertaintyScore <= 75) {
      return {
        level: 'High',
        explanation: 'Significant uncertainty in context or predictions.',
        recommendation: 'Gather more data before full execution.',
      };
    }
    return {
      level: 'Very High',
      explanation: 'Severe uncertainty. Limited data confidence.',
      recommendation: 'Enter validation-only mode. Require human review.',
    };
  },

  /**
   * Get overall autonomy assessment
   */
  assessOverallAutonomy(params: AutonomyScoringParams): {
    autonomyScore: number;
    recommendation: string;
    safetyLevel: string;
    readinessExplanation: string;
    consistencyExplanation: string;
    confidenceExplanation: string;
    riskExplanation: string;
    uncertaintyExplanation: string;
    nextSteps: string[];
  } {
    const autonomyScore = this.calculateAutonomyScore(params);
    const recommendation = this.getRecommendation(
      autonomyScore,
      params.riskScore,
      params.uncertaintyScore
    );

    const safetyLevel =
      recommendation === 'halt'
        ? 'CRITICAL'
        : recommendation === 'pause'
        ? 'HIGH'
        : recommendation === 'validate'
        ? 'MEDIUM'
        : 'LOW';

    const readinessExp = this.explainReadiness(params.readiness);
    const consistencyExp = this.explainConsistency(params.consistency);
    const confidenceExp = this.explainConfidence(params.confidence);
    const riskExp = this.explainRisk(params.riskScore);
    const uncertaintyExp = this.explainUncertainty(params.uncertaintyScore);

    const nextSteps: string[] = [];
    if (params.readiness < 60) {
nextSteps.push('Review and address agent readiness issues.');
}
    if (params.consistency < 60) {
nextSteps.push('Gather more memory context to improve consistency.');
}
    if (params.confidence < 60) {
nextSteps.push('Run additional validation passes before execution.');
}
    if (params.riskScore > 60) {
nextSteps.push('Implement additional risk mitigation controls.');
}
    if (params.uncertaintyScore > 70) {
nextSteps.push('Collect more data to reduce uncertainty.');
}

    if (nextSteps.length === 0) {
      nextSteps.push('Proceed with execution and continuous monitoring.');
    }

    return {
      autonomyScore,
      recommendation,
      safetyLevel,
      readinessExplanation: readinessExp.explanation,
      consistencyExplanation: consistencyExp.explanation,
      confidenceExplanation: confidenceExp.explanation,
      riskExplanation: riskExp.explanation,
      uncertaintyExplanation: uncertaintyExp.explanation,
      nextSteps,
    };
  },

  /**
   * Score individual agent autonomy
   */
  scoreAgentAutonomy(params: {
    agentName: string;
    recentSuccessRate: number; // 0-100
    errorRate: number; // 0-100
    responseTime: number; // milliseconds
    expectedResponseTime: number; // milliseconds
    lastFailureMinutesAgo: number; // -1 if no failure
  }): {
    agentScore: number;
    healthStatus: 'healthy' | 'degraded' | 'offline';
    issues: string[];
  } {
    let score = 100;
    const issues: string[] = [];

    // Success rate impact
    if (params.recentSuccessRate < 95) {
      score -= (95 - params.recentSuccessRate) * 0.5;
      issues.push(`Success rate is ${params.recentSuccessRate}%, target is 95%+`);
    }

    // Error rate impact
    if (params.errorRate > 5) {
      score -= params.errorRate * 2;
      issues.push(`Error rate is ${params.errorRate}%, target is <5%`);
    }

    // Response time impact
    const timeFactor = params.responseTime / params.expectedResponseTime;
    if (timeFactor > 1.5) {
      score -= Math.min(20, (timeFactor - 1.5) * 20);
      issues.push(`Response time is ${Math.round(timeFactor * 100)}% of expected`);
    }

    // Recent failure impact
    if (params.lastFailureMinutesAgo >= 0 && params.lastFailureMinutesAgo < 10) {
      score -= 15;
      issues.push(`Failed ${params.lastFailureMinutesAgo} minutes ago`);
    }

    const healthStatus =
      score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'offline';

    return {
      agentScore: Math.max(0, Math.round(score)),
      healthStatus,
      issues,
    };
  },
};
