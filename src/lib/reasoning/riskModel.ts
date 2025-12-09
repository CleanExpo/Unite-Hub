/**
 * Risk Model - Risk assessment and scoring system
 *
 * Computes risk scores (0-100) from memory signals, reasoning patterns,
 * context conflicts, and contradictory memories.
 *
 * @module lib/reasoning/riskModel
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface RiskAssessment {
  /** Overall risk score (0-100) */
  score: number;

  /** Individual risk factors */
  factors: Array<{
    type: string;
    weight: number;
    value: number;
  }>;

  /** Risk level category */
  level: 'low' | 'medium' | 'high' | 'critical';

  /** Timestamp */
  assessedAt: string;
}

/**
 * RiskModel - Assesses risk in reasoning and decision-making
 *
 * Combines multiple risk signals:
 * - Unresolved memory signals (anomalies, risks)
 * - Conflicting or contradictory memories
 * - Low confidence in relevant memories
 * - Pattern mismatches
 * - Outcome mismatches
 */
export class RiskModel {
  /**
   * Assess risk from a set of memories
   *
   * Examines signals, conflicts, and quality issues.
   */
  async assessMemoryRisk(workspaceId: string, memoryIds: string[]): Promise<number> {
    if (memoryIds.length === 0) {
return 50;
} // Medium risk with no context

    const supabase = await getSupabaseServer();
    let totalRisk = 0;
    let factorCount = 0;

    // Check for unresolved signals
    const { data: signals } = await supabase
      .from('ai_memory_signals')
      .select('signal_type, signal_value, memory_id')
      .eq('is_resolved', false)
      .in('memory_id', memoryIds);

    if (signals) {
      signals.forEach(signal => {
        totalRisk += signal.signal_value * 0.5; // Weight signal risk at 50%
        factorCount++;
      });
    }

    // Check for contradictions
    const { data: links } = await supabase
      .from('ai_memory_links')
      .select('relationship, strength')
      .in('memory_id', memoryIds)
      .in('relationship', ['contradicts', 'invalidates']);

    if (links && links.length > 0) {
      const contradictionRisk = links.reduce((sum, link) => sum + (link.strength || 50), 0) / links.length;
      totalRisk += contradictionRisk * 0.8; // Weight contradictions heavily
      factorCount++;
    }

    // Check confidence levels
    const { data: memories } = await supabase
      .from('ai_memory')
      .select('confidence, importance')
      .in('id', memoryIds);

    if (memories) {
      const lowConfidenceRisk = memories.filter(m => m.confidence < 50).length / memories.length * 100;
      totalRisk += lowConfidenceRisk * 0.3;
      factorCount++;
    }

    // Compute average risk
    const riskScore = factorCount > 0 ? totalRisk / factorCount : 30;
    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Assess risk from a reasoning decision
   *
   * Evaluates risk based on:
   * - Input context quality
   * - Confidence in reasoning
   * - Known uncertainties
   * - Decision complexity
   */
  assessReasoningRisk(request: {
    contextQuality: number; // 0-100
    confidence: number; // 0-100
    uncertainty: number; // 0-100
    complexity: number; // 0-100
  }): number {
    // Risk increases with uncertainty and complexity, decreases with confidence
    const baseRisk = request.uncertainty * 0.4 + request.complexity * 0.3;
    const confidenceReduction = request.confidence * 0.3;
    const contextMitigation = request.contextQuality * 0.1;

    const riskScore = Math.max(0, baseRisk - confidenceReduction - contextMitigation);
    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Assess cumulative risk across multiple factors
   */
  assessCumulativeRisk(factors: Array<{ weight: number; value: number }>): number {
    if (factors.length === 0) {
return 50;
}

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight === 0) {
return 50;
}

    const weightedRisk = factors.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight;
    return Math.min(100, Math.round(weightedRisk));
  }

  /**
   * Get risk level category
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) {
return 'low';
}
    if (score < 60) {
return 'medium';
}
    if (score < 80) {
return 'high';
}
    return 'critical';
  }

  /**
   * Assess full risk with detailed factors
   */
  async assessRisk(
    workspaceId: string,
    memoryIds: string[],
    reasoning: {
      contextQuality: number;
      confidence: number;
      uncertainty: number;
      complexity: number;
    }
  ): Promise<RiskAssessment> {
    const memoryRisk = await this.assessMemoryRisk(workspaceId, memoryIds);
    const reasoningRisk = this.assessReasoningRisk(reasoning);

    const factors = [
      { type: 'memory_signals', weight: 0.4, value: memoryRisk },
      { type: 'reasoning_quality', weight: 0.3, value: reasoningRisk },
      { type: 'context_uncertainty', weight: 0.2, value: reasoning.uncertainty },
      { type: 'decision_complexity', weight: 0.1, value: reasoning.complexity },
    ];

    const totalScore = this.assessCumulativeRisk(factors);

    return {
      score: totalScore,
      factors,
      level: this.getRiskLevel(totalScore),
      assessedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory to create a RiskModel instance
 */
export function createRiskModel(): RiskModel {
  return new RiskModel();
}

/**
 * Singleton instance for direct imports
 */
export const riskModel = createRiskModel();
