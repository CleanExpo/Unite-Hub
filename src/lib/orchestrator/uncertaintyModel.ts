/**
 * Uncertainty Model - Cross-Step Uncertainty Propagation
 *
 * Aggregates and propagates uncertainty across orchestrator steps,
 * identifies high-uncertainty areas, and escalates for extra validation.
 */

export interface UncertaintyAnalysis {
  overallUncertainty: number;
  highUncertaintySteps: number[];
  trend: 'improving' | 'stable' | 'worsening';
  requiresValidation: boolean;
  validationReason?: string;
  recommendations: string[];
}

export class UncertaintyModel {
  /**
   * Propagate uncertainty across steps using weighted average
   */
  propagateUncertainty(stepUncertainties: number[]): number {
    if (stepUncertainties.length === 0) return 0;

    // Weight recent steps more heavily (exponential decay)
    const weights = stepUncertainties.map((_, idx) => {
      const position = idx / (stepUncertainties.length - 1 || 1);
      return Math.pow(2, position); // Recent steps weighted exponentially
    });

    const totalWeight = weights.reduce((a, b) => a + b);
    const weighted = stepUncertainties.reduce(
      (sum, unc, idx) => sum + unc * weights[idx],
      0
    );

    return Math.round(weighted / totalWeight);
  }

  /**
   * Analyze uncertainty pattern across steps
   */
  analyzeUncertaintyPattern(stepUncertainties: number[]): UncertaintyAnalysis {
    if (stepUncertainties.length === 0) {
      return {
        overallUncertainty: 0,
        highUncertaintySteps: [],
        trend: 'stable',
        requiresValidation: false,
        recommendations: [],
      };
    }

    const overallUncertainty = this.propagateUncertainty(stepUncertainties);

    // Identify high uncertainty steps (> 60%)
    const highUncertaintySteps = stepUncertainties
      .map((unc, idx) => ({ uncertainty: unc, step: idx + 1 }))
      .filter((item) => item.uncertainty > 60)
      .map((item) => item.step);

    // Analyze trend
    const trend = this.analyzeTrend(stepUncertainties);

    // Determine if validation required
    const requiresValidation = overallUncertainty > 70 || highUncertaintySteps.length > 0;

    const recommendations: string[] = [];

    if (overallUncertainty > 80) {
      recommendations.push('🚨 CRITICAL: Uncertainty exceeds 80% - strongly recommend validation');
    } else if (overallUncertainty > 70) {
      recommendations.push('⚠️ HIGH: Uncertainty > 70% - add extra validation step');
    }

    if (trend === 'worsening') {
      recommendations.push('⬆️ WORSENING: Uncertainty increasing across steps - investigate');
    }

    if (highUncertaintySteps.length > 0) {
      recommendations.push(
        `🔍 Review high-uncertainty steps: ${highUncertaintySteps.join(', ')}`
      );
    }

    return {
      overallUncertainty,
      highUncertaintySteps,
      trend,
      requiresValidation,
      validationReason: requiresValidation
        ? `Uncertainty ${overallUncertainty}% exceeds safe threshold`
        : undefined,
      recommendations,
    };
  }

  /**
   * Analyze uncertainty trend
   */
  private analyzeTrend(
    stepUncertainties: number[]
  ): 'improving' | 'stable' | 'worsening' {
    if (stepUncertainties.length < 2) return 'stable';

    // Calculate moving average slope
    const midpoint = Math.floor(stepUncertainties.length / 2);
    const firstHalf = stepUncertainties.slice(0, midpoint);
    const secondHalf = stepUncertainties.slice(midpoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const threshold = 5; // Change threshold

    if (change > threshold) return 'worsening';
    if (change < -threshold) return 'improving';
    return 'stable';
  }

  /**
   * Estimate final uncertainty based on trend
   */
  estimateFinalUncertainty(
    stepUncertainties: number[],
    remainingSteps: number = 0
  ): number {
    if (stepUncertainties.length === 0) return 50; // Default uncertainty

    const currentUncertainty = this.propagateUncertainty(stepUncertainties);
    const trend = this.analyzeTrend(stepUncertainties);

    let projection = currentUncertainty;

    // Project based on trend
    if (trend === 'improving') {
      projection -= remainingSteps * 2; // Improving by 2% per step
    } else if (trend === 'worsening') {
      projection += remainingSteps * 2; // Worsening by 2% per step
    }

    return Math.max(0, Math.min(100, Math.round(projection)));
  }

  /**
   * Boost confidence from validation pass
   */
  boostConfidenceFromValidation(
    currentUncertainty: number,
    validationScore: number
  ): number {
    // Validation can reduce uncertainty by up to 20%
    const reduction = Math.min(20, validationScore / 5);
    return Math.max(0, currentUncertainty - reduction);
  }

  /**
   * Identify sources of uncertainty
   */
  identifyUncertaintySources(
    stepUncertainties: number[],
    stepAgents: string[]
  ): Array<{
    step: number;
    agent: string;
    uncertainty: number;
    source: string;
  }> {
    return stepUncertainties
      .map((uncertainty, idx) => ({
        step: idx + 1,
        agent: stepAgents[idx],
        uncertainty,
        source: this.getUncertaintySource(stepAgents[idx], uncertainty),
      }))
      .filter((item) => item.uncertainty > 40);
  }

  /**
   * Determine likely source of uncertainty
   */
  private getUncertaintySource(agent: string, uncertainty: number): string {
    if (agent === 'content-agent' && uncertainty > 60) {
      return 'Content generation may be off-target';
    }
    if (agent === 'reasoning' && uncertainty > 60) {
      return 'Reasoning lacks sufficient context or contradictory signals';
    }
    if (agent === 'orchestrator' && uncertainty > 60) {
      return 'Multi-agent coordination complexity';
    }
    if (uncertainty > 70) {
      return 'Insufficient information or low data quality';
    }
    return 'Normal uncertainty for this operation';
  }

  /**
   * Calculate safe-to-execute threshold
   */
  calculateSafeThreshold(overallUncertainty: number): boolean {
    // Safe if uncertainty <= 70% and no critical gaps
    return overallUncertainty <= 70;
  }

  /**
   * Get uncertainty mitigation strategies
   */
  getMitigationStrategies(analysis: UncertaintyAnalysis): string[] {
    const strategies: string[] = [];

    if (analysis.overallUncertainty > 80) {
      strategies.push('Add extra reasoning pass for complex scenarios');
      strategies.push('Reduce scope to lower-risk operations');
      strategies.push('Collect more context before proceeding');
    } else if (analysis.overallUncertainty > 70) {
      strategies.push('Add validation step');
      strategies.push('Enable detailed logging for debugging');
    }

    if (analysis.highUncertaintySteps.length > 0) {
      strategies.push(
        `Break down high-uncertainty steps into smaller subtasks`
      );
    }

    if (analysis.trend === 'worsening') {
      strategies.push('Pause and reassess - uncertainty is increasing');
    }

    return strategies;
  }
}
