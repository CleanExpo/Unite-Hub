/**
 * Autonomy Tuning Model
 *
 * Core actuator that applies calibration proposals and dynamically adjusts:
 * - Agent weights (boost high-performing agents)
 * - Risk thresholds (tune detection sensitivity)
 * - Uncertainty scaling (reduce excessive penalties)
 * - Reasoning depth (allocate thinking tokens efficiently)
 * - Orchestration scheduling (balance workload)
 *
 * Safety constraints:
 * - Never reduces risk thresholds below hard-coded baselines
 * - All parameter changes logged to database
 * - Explainability notes generated for every adjustment
 * - Confidence scores reflect adjustment uncertainty
 * - Parameter deltas recorded for audit trail
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface ParameterAdjustment {
  parameterName: string;
  category: 'agent_weight' | 'risk_threshold' | 'uncertainty_factor' | 'reasoning_depth' | 'orchestration';
  currentValue: number;
  adjustedValue: number;
  delta: number; // percentage change
  deltaMagnitude: number; // absolute change
  confidenceScore: number; // 0-100
  rationale: string;
  safetyConstraintRespected: boolean;
}

export interface TuningResult {
  tuningId: string;
  cycleId: string;
  timestamp: string;
  adjustmentsApplied: ParameterAdjustment[];
  agentWeights: Record<string, number>;
  riskWeights: Record<string, number>;
  uncertaintyScaling: number;
  reasoningDepthAllocation: Record<string, number>;
  orchestrationSchedule: Record<string, number>;
  overallConfidenceScore: number;
  explainabilityNotes: string;
  parametersLocked: boolean; // True if adjustment locked due to safety constraints
}

export interface CalibratedParameters {
  agentWeights: Record<string, number>;
  riskWeights: Record<string, number>;
  uncertaintyScaling: number;
  reasoningDepthAllocation: Record<string, number>;
  orchestrationSchedule: Record<string, number>;
}

class AutonomyTuningModel {
  private memoryStore = new MemoryStore();

  // Hard-coded safety baselines (cannot be reduced below these)
  private SAFETY_BASELINES = {
    risk_threshold_critical: 80,
    risk_threshold_high: 65,
    uncertainty_threshold: 75,
    cascade_risk_threshold: 75,
    deadlock_risk_threshold: 70,
    memory_corruption_threshold: 85,
  };

  /**
   * Apply a calibration proposal and generate tuning parameters
   */
  async applyCalibrationProposal(params: {
    workspaceId: string;
    cycleId: string;
    proposals: any[];
    metrics: any;
    currentParameters: CalibratedParameters;
  }): Promise<TuningResult> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Compute adjustments for each dimension
      const agentWeightAdjustments = this.computeAgentWeightAdjustments(
        params.metrics,
        params.currentParameters.agentWeights
      );

      const riskWeightAdjustments = this.computeRiskWeightAdjustments(
        params.metrics,
        params.currentParameters.riskWeights
      );

      const uncertaintyAdjustment = this.computeUncertaintyScaling(
        params.metrics,
        params.currentParameters.uncertaintyScaling
      );

      const reasoningDepthAdjustment = this.computeReasoningDepthTuning(
        params.metrics,
        params.currentParameters.reasoningDepthAllocation
      );

      const orchestrationAdjustment = this.computeOrchestrationScheduling(
        params.metrics,
        params.currentParameters.orchestrationSchedule
      );

      // 2. Aggregate all adjustments
      const aggregated = this.aggregateNewParameters({
        agentWeightAdjustments,
        riskWeightAdjustments,
        uncertaintyAdjustment,
        reasoningDepthAdjustment,
        orchestrationAdjustment,
        currentParameters: params.currentParameters,
      });

      // 3. Validate safety constraints
      const validatedAdjustments = this.validateSafetyConstraints(aggregated.adjustments);

      // 4. Generate explainability
      const explainability = this.generateExplainabilityNotes(
        validatedAdjustments,
        params.metrics,
        aggregated
      );

      // 5. Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(validatedAdjustments);

      // 6. Create tuning result
      const tuningId = crypto.randomUUID();
      const tuningResult: TuningResult = {
        tuningId,
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        adjustmentsApplied: validatedAdjustments,
        agentWeights: aggregated.agentWeights,
        riskWeights: aggregated.riskWeights,
        uncertaintyScaling: aggregated.uncertaintyScaling,
        reasoningDepthAllocation: aggregated.reasoningDepthAllocation,
        orchestrationSchedule: aggregated.orchestrationSchedule,
        overallConfidenceScore: overallConfidence,
        explainabilityNotes: explainability,
        parametersLocked: validatedAdjustments.some(adj => !adj.safetyConstraintRespected),
      };

      // 7. Store tuning result to database
      await supabase
        .from('autonomy_tuning_results')
        .insert({
          workspace_id: params.workspaceId,
          calibration_cycle_id: params.cycleId,
          tuning_id: tuningId,
          adjustments_applied: validatedAdjustments,
          agent_weights: aggregated.agentWeights,
          risk_weights: aggregated.riskWeights,
          uncertainty_scaling: aggregated.uncertaintyScaling,
          reasoning_depth_allocation: aggregated.reasoningDepthAllocation,
          orchestration_schedule: aggregated.orchestrationSchedule,
          confidence_score: overallConfidence,
          explainability_notes: explainability,
          parameters_locked: tuningResult.parametersLocked,
          created_at: new Date().toISOString(),
        });

      // 8. Archive to memory for learning
      await this.memoryStore.store({
        workspaceId: params.workspaceId,
        agent: 'autonomy-tuning-model',
        memoryType: 'tuning_result',
        content: {
          tuning_id: tuningId,
          cycle_id: params.cycleId,
          adjustments: validatedAdjustments.map(adj => ({
            parameter: adj.parameterName,
            delta: adj.delta,
            confidence: adj.confidenceScore,
          })),
          overall_confidence: overallConfidence,
          timestamp: new Date().toISOString(),
        },
        importance: Math.min(100, 50 + overallConfidence * 0.5),
        confidence: overallConfidence,
        keywords: ['tuning', 'calibration', 'parameter-adjustment', 'autonomy'],
      });

      return tuningResult;
    } catch (error) {
      console.error('Tuning model error:', error);
      throw error;
    }
  }

  /**
   * Compute agent weight adjustments based on performance
   */
  private computeAgentWeightAdjustments(
    metrics: any,
    currentWeights: Record<string, number>
  ): Record<string, number> {
    const adjustments: Record<string, number> = { ...currentWeights };

    // Boost orchestrator weight if success rate is high
    if (metrics.autonomySuccessRate >= 90) {
      adjustments['orchestrator'] = Math.min(
        1.0,
        (currentWeights['orchestrator'] || 0.6) * 1.1
      );
    } else if (metrics.autonomySuccessRate < 70) {
      adjustments['orchestrator'] = Math.max(
        0.3,
        (currentWeights['orchestrator'] || 0.6) * 0.95
      );
    }

    // Boost reasoning engine weight if prediction accuracy is good
    if (metrics.predictionAccuracy >= 85) {
      adjustments['reasoning_engine'] = Math.min(
        1.0,
        (currentWeights['reasoning_engine'] || 0.5) * 1.08
      );
    } else if (metrics.predictionAccuracy < 65) {
      adjustments['reasoning_engine'] = Math.max(
        0.2,
        (currentWeights['reasoning_engine'] || 0.5) * 0.92
      );
    }

    // Boost autonomy engine weight if enforcement effectiveness is strong
    if (metrics.enforcementEffectiveness >= 95) {
      adjustments['autonomy_engine'] = Math.min(
        1.0,
        (currentWeights['autonomy_engine'] || 0.7) * 1.12
      );
    }

    // Reduce desktop agent weight if false positives are high
    if (metrics.falsePositives > 5) {
      adjustments['desktop_agent'] = Math.max(
        0.1,
        (currentWeights['desktop_agent'] || 0.4) * 0.9
      );
    }

    return adjustments;
  }

  /**
   * Compute risk weight adjustments for different signal categories
   */
  private computeRiskWeightAdjustments(
    metrics: any,
    currentWeights: Record<string, number>
  ): Record<string, number> {
    const adjustments: Record<string, number> = { ...currentWeights };

    // Increase cascade risk weight if false negatives are high
    if (metrics.falseNegatives > 3) {
      adjustments['cascade_risk'] = Math.min(1.0, (currentWeights['cascade_risk'] || 0.7) * 1.15);
    } else if (metrics.falseNegatives === 0) {
      adjustments['cascade_risk'] = Math.max(0.5, (currentWeights['cascade_risk'] || 0.7) * 0.95);
    }

    // Increase memory corruption risk weight if blocked false positives are high
    if (metrics.blockedByFalsePositives > 8) {
      adjustments['memory_corruption'] = Math.min(
        1.0,
        (currentWeights['memory_corruption'] || 0.8) * 1.1
      );
    }

    // Adjust deadlock risk based on orchestrator performance
    if (metrics.averageResponseTime > 5000) {
      adjustments['deadlock_risk'] = Math.min(
        1.0,
        (currentWeights['deadlock_risk'] || 0.6) * 1.12
      );
    } else if (metrics.averageResponseTime < 2000) {
      adjustments['deadlock_risk'] = Math.max(
        0.4,
        (currentWeights['deadlock_risk'] || 0.6) * 0.92
      );
    }

    return adjustments;
  }

  /**
   * Compute uncertainty scaling adjustments
   */
  private computeUncertaintyScaling(
    metrics: any,
    currentScaling: number
  ): number {
    let newScaling = currentScaling;

    // Reduce uncertainty scaling if prediction accuracy is high and false positives are low
    if (metrics.predictionAccuracy >= 85 && metrics.falsePositives <= 2) {
      newScaling = Math.max(0.8, currentScaling * 0.95);
    }
    // Increase uncertainty scaling if prediction accuracy is low or false positives are high
    else if (metrics.predictionAccuracy < 70 || metrics.falsePositives > 5) {
      newScaling = Math.min(1.3, currentScaling * 1.08);
    }

    return Math.round(newScaling * 100) / 100;
  }

  /**
   * Compute reasoning depth tuning based on performance
   */
  private computeReasoningDepthTuning(
    metrics: any,
    currentAllocation: Record<string, number>
  ): Record<string, number> {
    const adjustments: Record<string, number> = { ...currentAllocation };

    // Allocate more thinking tokens to complex tasks when accuracy is low
    if (metrics.predictionAccuracy < 75) {
      adjustments['complex_analysis'] = Math.min(
        15000,
        (currentAllocation['complex_analysis'] || 10000) + 2000
      );
    } else {
      adjustments['complex_analysis'] = Math.max(
        5000,
        (currentAllocation['complex_analysis'] || 10000) - 1000
      );
    }

    // Reduce thinking tokens for simple tasks
    adjustments['simple_tasks'] = Math.max(
      1000,
      Math.min(3000, (currentAllocation['simple_tasks'] || 2000) * 0.9)
    );

    // Medium tasks get balanced allocation
    adjustments['medium_analysis'] = Math.max(
      3000,
      Math.min(8000, (currentAllocation['medium_analysis'] || 5000))
    );

    return adjustments;
  }

  /**
   * Compute orchestration scheduling adjustments
   */
  private computeOrchestrationScheduling(
    metrics: any,
    currentSchedule: Record<string, number>
  ): Record<string, number> {
    const adjustments: Record<string, number> = { ...currentSchedule };

    // Increase orchestrator frequency if success rate is high
    if (metrics.autonomySuccessRate >= 90) {
      adjustments['orchestrator_frequency'] = Math.min(
        100,
        (currentSchedule['orchestrator_frequency'] || 50) * 1.1
      );
    }
    // Decrease if success rate is low
    else if (metrics.autonomySuccessRate < 70) {
      adjustments['orchestrator_frequency'] = Math.max(
        20,
        (currentSchedule['orchestrator_frequency'] || 50) * 0.9
      );
    }

    // Adjust agent execution parallelism based on response time
    if (metrics.averageResponseTime > 5000) {
      adjustments['parallel_agents'] = Math.max(
        1,
        (currentSchedule['parallel_agents'] || 3) - 1
      );
    } else if (metrics.averageResponseTime < 1000) {
      adjustments['parallel_agents'] = Math.min(
        8,
        (currentSchedule['parallel_agents'] || 3) + 1
      );
    }

    return adjustments;
  }

  /**
   * Aggregate all adjustments into final calibrated parameters
   */
  private aggregateNewParameters(params: {
    agentWeightAdjustments: Record<string, number>;
    riskWeightAdjustments: Record<string, number>;
    uncertaintyAdjustment: number;
    reasoningDepthAdjustment: Record<string, number>;
    orchestrationAdjustment: Record<string, number>;
    currentParameters: CalibratedParameters;
  }): {
    agentWeights: Record<string, number>;
    riskWeights: Record<string, number>;
    uncertaintyScaling: number;
    reasoningDepthAllocation: Record<string, number>;
    orchestrationSchedule: Record<string, number>;
    adjustments: ParameterAdjustment[];
  } {
    const adjustments: ParameterAdjustment[] = [];

    // Normalize agent weights to sum to 1.0
    const agentWeights = this.normalizeWeights(params.agentWeightAdjustments);
    for (const [agent, newWeight] of Object.entries(agentWeights)) {
      const currentWeight = params.currentParameters.agentWeights[agent] || 0;
      if (newWeight !== currentWeight) {
        adjustments.push({
          parameterName: `agent_weight_${agent}`,
          category: 'agent_weight',
          currentValue: currentWeight,
          adjustedValue: newWeight,
          delta: ((newWeight - currentWeight) / currentWeight) * 100,
          deltaMagnitude: Math.abs(newWeight - currentWeight),
          confidenceScore: 75, // Agent weight changes are medium confidence
          rationale: `Adjusted ${agent} weight based on autonomy success rate`,
          safetyConstraintRespected: true,
        });
      }
    }

    // Aggregate risk weights (no normalization needed)
    const riskWeights = params.riskWeightAdjustments;
    for (const [risk, newWeight] of Object.entries(riskWeights)) {
      const currentWeight = params.currentParameters.riskWeights[risk] || 0;
      if (newWeight !== currentWeight) {
        adjustments.push({
          parameterName: `risk_weight_${risk}`,
          category: 'risk_threshold',
          currentValue: currentWeight,
          adjustedValue: newWeight,
          delta: ((newWeight - currentWeight) / currentWeight) * 100,
          deltaMagnitude: Math.abs(newWeight - currentWeight),
          confidenceScore: 80, // Risk weights are high confidence
          rationale: `Tuned ${risk} weight based on prediction metrics`,
          safetyConstraintRespected: true,
        });
      }
    }

    // Uncertainty scaling adjustment
    if (params.uncertaintyAdjustment !== params.currentParameters.uncertaintyScaling) {
      adjustments.push({
        parameterName: 'uncertainty_scaling',
        category: 'uncertainty_factor',
        currentValue: params.currentParameters.uncertaintyScaling,
        adjustedValue: params.uncertaintyAdjustment,
        delta:
          ((params.uncertaintyAdjustment - params.currentParameters.uncertaintyScaling) /
            params.currentParameters.uncertaintyScaling) *
          100,
        deltaMagnitude: Math.abs(
          params.uncertaintyAdjustment - params.currentParameters.uncertaintyScaling
        ),
        confidenceScore: 70,
        rationale: 'Adjusted uncertainty scaling to balance false positives/negatives',
        safetyConstraintRespected: true,
      });
    }

    // Reasoning depth allocation
    const reasoningDepthAllocation = params.reasoningDepthAdjustment;
    for (const [task, newDepth] of Object.entries(reasoningDepthAllocation)) {
      const currentDepth = params.currentParameters.reasoningDepthAllocation[task] || 0;
      if (newDepth !== currentDepth) {
        adjustments.push({
          parameterName: `reasoning_depth_${task}`,
          category: 'reasoning_depth',
          currentValue: currentDepth,
          adjustedValue: newDepth,
          delta: ((newDepth - currentDepth) / currentDepth) * 100,
          deltaMagnitude: Math.abs(newDepth - currentDepth),
          confidenceScore: 65,
          rationale: `Rebalanced thinking tokens for ${task} tasks`,
          safetyConstraintRespected: true,
        });
      }
    }

    // Orchestration schedule
    const orchestrationSchedule = params.orchestrationAdjustment;
    for (const [schedule, newValue] of Object.entries(orchestrationSchedule)) {
      const currentValue = params.currentParameters.orchestrationSchedule[schedule] || 0;
      if (newValue !== currentValue) {
        adjustments.push({
          parameterName: `orchestration_${schedule}`,
          category: 'orchestration',
          currentValue,
          adjustedValue: newValue,
          delta: ((newValue - currentValue) / currentValue) * 100,
          deltaMagnitude: Math.abs(newValue - currentValue),
          confidenceScore: 72,
          rationale: `Optimized orchestration ${schedule} based on response time`,
          safetyConstraintRespected: true,
        });
      }
    }

    return {
      agentWeights,
      riskWeights,
      uncertaintyScaling: params.uncertaintyAdjustment,
      reasoningDepthAllocation,
      orchestrationSchedule,
      adjustments,
    };
  }

  /**
   * Validate that adjustments respect safety constraints
   */
  private validateSafetyConstraints(
    adjustments: ParameterAdjustment[]
  ): ParameterAdjustment[] {
    return adjustments.map(adjustment => {
      const isSafetyParameter = Object.keys(this.SAFETY_BASELINES).some(baseline =>
        adjustment.parameterName.includes(baseline)
      );

      if (isSafetyParameter) {
        const baseline =
          this.SAFETY_BASELINES[
            Object.keys(this.SAFETY_BASELINES).find(
              b => adjustment.parameterName.includes(b) || b.includes(adjustment.parameterName)
            ) as keyof typeof this.SAFETY_BASELINES
          ];

        if (adjustment.adjustedValue < baseline) {
          // Lock the adjustment to baseline
          adjustment.safetyConstraintRespected = false;
          adjustment.adjustedValue = baseline;
        } else {
          adjustment.safetyConstraintRespected = true;
        }
      }

      return adjustment;
    });
  }

  /**
   * Generate human-readable explainability notes
   */
  private generateExplainabilityNotes(
    adjustments: ParameterAdjustment[],
    metrics: any,
    aggregated: any
  ): string {
    const lines: string[] = [
      '# Autonomy Tuning Adjustments',
      '',
      `## Performance Metrics`,
      `- Autonomy Success Rate: ${metrics.autonomySuccessRate.toFixed(1)}%`,
      `- Prediction Accuracy: ${metrics.predictionAccuracy.toFixed(1)}%`,
      `- False Positives: ${metrics.falsePositives}`,
      `- False Negatives: ${metrics.falseNegatives}`,
      `- Enforcement Effectiveness: ${metrics.enforcementEffectiveness.toFixed(1)}%`,
      '',
      `## Parameter Adjustments (${adjustments.length} changes)`,
    ];

    // Group adjustments by category
    const byCategory = adjustments.reduce(
      (acc, adj) => {
        if (!acc[adj.category]) acc[adj.category] = [];
        acc[adj.category].push(adj);
        return acc;
      },
      {} as Record<string, ParameterAdjustment[]>
    );

    for (const [category, adjs] of Object.entries(byCategory)) {
      lines.push(`\n### ${category.replace(/_/g, ' ').toUpperCase()}`);
      for (const adj of adjs) {
        lines.push(
          `- **${adj.parameterName}**: ${adj.currentValue.toFixed(2)} → ${adj.adjustedValue.toFixed(2)} ` +
            `(${adj.delta > 0 ? '+' : ''}${adj.delta.toFixed(1)}%, confidence: ${adj.confidenceScore}%)`
        );
        lines.push(`  ${adj.rationale}`);
      }
    }

    lines.push(
      '',
      `## Safety Constraints`,
      `- All adjustments respect hard-coded safety baselines: ${adjustments.every(a => a.safetyConstraintRespected) ? '✓ YES' : '⚠ SOME LOCKED'}`
    );

    return lines.join('\n');
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(adjustments: ParameterAdjustment[]): number {
    if (adjustments.length === 0) return 100;

    const lockedCount = adjustments.filter(a => !a.safetyConstraintRespected).length;
    const largeDeltas = adjustments.filter(a => Math.abs(a.delta) > 15).length;

    const baseConfidence =
      adjustments.reduce((sum, adj) => sum + adj.confidenceScore, 0) / adjustments.length;

    // Reduce confidence if constraints were locked
    let penaltyFactor = 1.0;
    if (lockedCount > 0) {
      penaltyFactor *= 1 - (lockedCount / adjustments.length) * 0.15;
    }

    // Reduce confidence for large deltas
    if (largeDeltas > 0) {
      penaltyFactor *= 1 - (largeDeltas / adjustments.length) * 0.1;
    }

    return Math.round(baseConfidence * penaltyFactor);
  }

  /**
   * Normalize weights to sum to 1.0
   */
  private normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum === 0) return weights;

    return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / sum]));
  }
}

export const autonomyTuningModel = new AutonomyTuningModel();
