/**
 * Uncertainty Propagator - Propagates uncertainties across reasoning passes
 *
 * Tracks how uncertainties compound and resolve through multiple passes,
 * producing a final uncertainty score that reflects actual confidence.
 *
 * @module lib/reasoning/uncertaintyPropagator
 */

export interface PassUncertainty {
  passNumber: number;
  passType: string;
  uncertainty: number;
  confidence: number;
  reduction: number; // How much uncertainty was reduced in this pass
}

/**
 * UncertaintyPropagator - Manages uncertainty across reasoning
 *
 * Implements uncertainty propagation using Bayesian-inspired confidence
 * updates across multiple passes.
 */
export class UncertaintyPropagator {
  /**
   * Propagate uncertainties across all reasoning passes
   *
   * Tracks how each pass reduces uncertainty and computes final score.
   */
  async propagateUncertainties(passes: any[]): Promise<number> {
    if (passes.length === 0) {
return 100;
}

    // Track uncertainty through passes
    const uncertaintyTrace: PassUncertainty[] = passes.map((pass, idx) => {
      // Calculate reduction from previous pass
      const prevUncertainty = idx > 0 ? passes[idx - 1].uncertainty : 70;
      const reduction = Math.max(0, prevUncertainty - pass.uncertainty);

      return {
        passNumber: pass.passNumber,
        passType: pass.passType,
        uncertainty: pass.uncertainty,
        confidence: pass.confidence,
        reduction,
      };
    });

    // Compute final uncertainty using weighted average
    // Recent passes weighted more heavily
    const weights = passes.map((_, idx) => (idx + 1) / passes.length);
    const weightedUncertainty = uncertaintyTrace.reduce(
      (sum, u, idx) => sum + u.uncertainty * weights[idx],
      0
    );

    // Apply confidence boost from validation pass
    const lastPass = passes[passes.length - 1];
    const confidenceBoost = (lastPass.confidence / 100) * 0.2;
    const finalUncertainty = Math.max(0, weightedUncertainty - confidenceBoost * 100);

    return Math.round(Math.min(100, finalUncertainty));
  }

  /**
   * Track uncertainty accumulation patterns
   *
   * Identifies where uncertainties grow or shrink unexpectedly.
   */
  analyzeUncertaintyPattern(passes: any[]): {
    totalReduction: number;
    averageReductionPerPass: number;
    passesWithIncreasingUncertainty: number[];
    trend: 'improving' | 'stable' | 'worsening';
  } {
    if (passes.length < 2) {
      return {
        totalReduction: 0,
        averageReductionPerPass: 0,
        passesWithIncreasingUncertainty: [],
        trend: 'stable',
      };
    }

    let totalReduction = 0;
    const increasingPasses: number[] = [];

    for (let i = 1; i < passes.length; i++) {
      const reduction = passes[i - 1].uncertainty - passes[i].uncertainty;
      totalReduction += Math.max(0, reduction);

      if (reduction < 0) {
        increasingPasses.push(passes[i].passNumber);
      }
    }

    const averageReduction = totalReduction / (passes.length - 1);

    // Determine trend
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (totalReduction > 50) {
trend = 'improving';
} else if (totalReduction < 10 && increasingPasses.length > passes.length / 2) {
trend = 'worsening';
}

    return {
      totalReduction: Math.round(totalReduction),
      averageReductionPerPass: Math.round(averageReduction),
      passesWithIncreasingUncertainty: increasingPasses,
      trend,
    };
  }

  /**
   * Estimate final uncertainty before completion
   *
   * Predicts final uncertainty based on current trend.
   */
  estimateFinalUncertainty(passesCompleted: any[], totalPasses: number = 5): number {
    if (passesCompleted.length === 0) {
return 100;
}

    const pattern = this.analyzeUncertaintyPattern(passesCompleted);
    const remainingPasses = totalPasses - passesCompleted.length;

    // Project based on trend
    let projectedReduction = 0;

    if (pattern.trend === 'improving') {
      projectedReduction = pattern.averageReductionPerPass * remainingPasses * 0.8;
    } else if (pattern.trend === 'worsening') {
      projectedReduction = pattern.averageReductionPerPass * remainingPasses * 0.5;
    } else {
      projectedReduction = pattern.averageReductionPerPass * remainingPasses;
    }

    const lastUncertainty = passesCompleted[passesCompleted.length - 1].uncertainty;
    const projectedFinal = Math.max(0, lastUncertainty - projectedReduction);

    return Math.round(projectedFinal);
  }

  /**
   * Identify high-uncertainty areas in reasoning
   *
   * Returns areas where confidence is low or uncertainties remain high.
   */
  identifyHighUncertaintyAreas(passes: any[]): Array<{
    passNumber: number;
    passType: string;
    uncertainty: number;
    reason: string;
  }> {
    return passes
      .filter(p => p.uncertainty > 40)
      .map(p => ({
        passNumber: p.passNumber,
        passType: p.passType,
        uncertainty: p.uncertainty,
        reason: this.getUncertaintyReason(p),
      }));
  }

  /**
   * Describe why a pass has high uncertainty
   */
  private getUncertaintyReason(pass: any): string {
    const u = pass.uncertainty;
    const c = pass.confidence;

    if (u > 70) {
return 'Very high uncertainty, low confidence';
}
    if (u > 50 && c < 60) {
return 'High uncertainty with low confidence';
}
    if (u > 50) {
return 'Moderate-high uncertainty in analysis';
}
    if (c < 50) {
return 'Low confidence in decision';
}
    return 'Acceptable uncertainty level';
  }
}

/**
 * Factory to create an UncertaintyPropagator instance
 */
export function createUncertaintyPropagator(): UncertaintyPropagator {
  return new UncertaintyPropagator();
}

/**
 * Singleton instance for direct imports
 */
export const uncertaintyPropagator = createUncertaintyPropagator();
