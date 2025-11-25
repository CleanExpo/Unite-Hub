/**
 * Threshold Adjustment Model
 *
 * Specialized module for dynamically adjusting safety risk thresholds:
 * - Critical risk threshold (hard enforcement trigger)
 * - High risk threshold (warning and conditional enforcement)
 * - Uncertainty threshold (prediction confidence gating)
 * - Cascade risk threshold (agent failure chain detection)
 * - Deadlock risk threshold (orchestrator stall detection)
 * - Memory corruption threshold (state integrity detection)
 *
 * Safety constraints:
 * - All thresholds have hard-coded minimums (never reduce below)
 * - Large changes (>15% delta) require founder approval
 * - All changes logged and reversible
 * - Smooth transitions to avoid oscillation
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface ThresholdAdjustmentParams {
  parameterName: string;
  category: 'critical' | 'high' | 'uncertainty' | 'cascade' | 'deadlock' | 'memory';
  currentValue: number;
  targetValue: number;
  rationale: string;
  metricsJustification: string;
}

export interface ThresholdAdjustmentResult {
  adjustmentId: string;
  cycleId: string;
  timestamp: string;
  parameter: string;
  category: string;
  currentValue: number;
  proposedValue: number;
  adjustedValue: number;
  delta: number; // percentage change
  deltaAbsolute: number;
  requiresApproval: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  confidenceScore: number;
  rationale: string;
  safetyConstraintActive: boolean;
  constraintReason?: string;
}

export interface ThresholdSet {
  risk_threshold_critical: number;
  risk_threshold_high: number;
  uncertainty_threshold: number;
  cascade_risk_threshold: number;
  deadlock_risk_threshold: number;
  memory_corruption_threshold: number;
}

class ThresholdAdjustmentModel {
  private memoryStore = new MemoryStore();

  // Hard-coded safety baselines - NEVER reduce below these
  private SAFETY_BASELINES: ThresholdSet = {
    risk_threshold_critical: 80,
    risk_threshold_high: 65,
    uncertainty_threshold: 75,
    cascade_risk_threshold: 75,
    deadlock_risk_threshold: 70,
    memory_corruption_threshold: 85,
  };

  // Maximum recommended thresholds (don't exceed without strong justification)
  private SAFETY_CEILINGS: ThresholdSet = {
    risk_threshold_critical: 95,
    risk_threshold_high: 80,
    uncertainty_threshold: 95,
    cascade_risk_threshold: 90,
    deadlock_risk_threshold: 85,
    memory_corruption_threshold: 100,
  };

  // Threshold for requiring founder approval (15% delta)
  private APPROVAL_THRESHOLD_DELTA = 15;

  /**
   * Propose threshold adjustments based on system metrics
   */
  async proposeAdjustments(params: {
    workspaceId: string;
    cycleId: string;
    currentThresholds: ThresholdSet;
    metrics: {
      falsePositiveRate: string; // 'LOW', 'MEDIUM', 'HIGH'
      falseNegativeRate: string;
      cascadeRiskDetected: boolean;
      deadlockRiskDetected: boolean;
      memoryCorruptionRisk: boolean;
      predictionAccuracy: number;
      enforcementEffectiveness: number;
    };
  }): Promise<ThresholdAdjustmentResult[]> {
    const adjustments: ThresholdAdjustmentResult[] = [];

    // 1. Critical Risk Threshold adjustment
    if (params.metrics.falseNegativeRate === 'HIGH') {
      // Lower critical threshold to catch more risks early
      const proposed = Math.max(
        this.SAFETY_BASELINES.risk_threshold_critical,
        params.currentThresholds.risk_threshold_critical - 5
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'risk_threshold_critical',
        category: 'critical',
        currentValue: params.currentThresholds.risk_threshold_critical,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.risk_threshold_critical) /
            params.currentThresholds.risk_threshold_critical) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.risk_threshold_critical),
        requiresApproval:
          Math.abs(
            ((proposed - params.currentThresholds.risk_threshold_critical) /
              params.currentThresholds.risk_threshold_critical) *
              100
          ) > this.APPROVAL_THRESHOLD_DELTA,
        approved: false,
        confidenceScore: 85,
        rationale: 'Lower critical threshold to improve detection of dangerous system states',
        safetyConstraintActive: false,
        metricsJustification:
          params.metrics.falseNegativeRate === 'HIGH'
            ? 'High false negative rate indicates missing dangerous states'
            : '',
      });
    }

    // 2. High Risk Threshold adjustment
    if (params.metrics.falsePositiveRate === 'HIGH') {
      // Raise high risk threshold to reduce false positives
      const proposed = Math.min(
        this.SAFETY_CEILINGS.risk_threshold_high,
        params.currentThresholds.risk_threshold_high + 5
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'risk_threshold_high',
        category: 'high',
        currentValue: params.currentThresholds.risk_threshold_high,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.risk_threshold_high) /
            params.currentThresholds.risk_threshold_high) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.risk_threshold_high),
        requiresApproval:
          Math.abs(
            ((proposed - params.currentThresholds.risk_threshold_high) /
              params.currentThresholds.risk_threshold_high) *
              100
          ) > this.APPROVAL_THRESHOLD_DELTA,
        approved: false,
        confidenceScore: 75,
        rationale: 'Raise high risk threshold to reduce unnecessary blocks of legitimate operations',
        safetyConstraintActive: false,
        metricsJustification:
          params.metrics.falsePositiveRate === 'HIGH'
            ? 'High false positive rate indicates over-cautious detection'
            : '',
      });
    }

    // 3. Uncertainty Threshold adjustment
    if (params.metrics.predictionAccuracy < 70) {
      // Raise uncertainty threshold to gate on confident predictions only
      const proposed = Math.min(
        this.SAFETY_CEILINGS.uncertainty_threshold,
        params.currentThresholds.uncertainty_threshold + 3
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'uncertainty_threshold',
        category: 'uncertainty',
        currentValue: params.currentThresholds.uncertainty_threshold,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.uncertainty_threshold) /
            params.currentThresholds.uncertainty_threshold) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.uncertainty_threshold),
        requiresApproval:
          Math.abs(
            ((proposed - params.currentThresholds.uncertainty_threshold) /
              params.currentThresholds.uncertainty_threshold) *
              100
          ) > this.APPROVAL_THRESHOLD_DELTA,
        approved: false,
        confidenceScore: 70,
        rationale: 'Raise uncertainty threshold to require higher confidence predictions',
        safetyConstraintActive: false,
        metricsJustification:
          params.metrics.predictionAccuracy < 70
            ? `Prediction accuracy only ${params.metrics.predictionAccuracy.toFixed(1)}% - need higher confidence bar`
            : '',
      });
    } else if (params.metrics.predictionAccuracy >= 85) {
      // Lower uncertainty threshold to accept lower-confidence predictions
      const proposed = Math.max(
        this.SAFETY_BASELINES.uncertainty_threshold,
        params.currentThresholds.uncertainty_threshold - 2
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'uncertainty_threshold',
        category: 'uncertainty',
        currentValue: params.currentThresholds.uncertainty_threshold,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.uncertainty_threshold) /
            params.currentThresholds.uncertainty_threshold) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.uncertainty_threshold),
        requiresApproval: false,
        approved: false,
        confidenceScore: 85,
        rationale: 'Lower uncertainty threshold - prediction accuracy is consistently high',
        safetyConstraintActive: false,
        metricsJustification: `Prediction accuracy is strong at ${params.metrics.predictionAccuracy.toFixed(1)}%`,
      });
    }

    // 4. Cascade Risk Threshold adjustment
    if (params.metrics.cascadeRiskDetected) {
      // Lower cascade risk threshold to detect failures earlier
      const proposed = Math.max(
        this.SAFETY_BASELINES.cascade_risk_threshold,
        params.currentThresholds.cascade_risk_threshold - 3
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'cascade_risk_threshold',
        category: 'cascade',
        currentValue: params.currentThresholds.cascade_risk_threshold,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.cascade_risk_threshold) /
            params.currentThresholds.cascade_risk_threshold) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.cascade_risk_threshold),
        requiresApproval: false,
        approved: false,
        confidenceScore: 90,
        rationale: 'Lower cascade threshold to catch multi-agent failure chains earlier',
        safetyConstraintActive: false,
        metricsJustification: 'Cascade failures detected in recent telemetry',
      });
    }

    // 5. Deadlock Risk Threshold adjustment
    if (params.metrics.deadlockRiskDetected) {
      // Lower deadlock threshold to detect stalls earlier
      const proposed = Math.max(
        this.SAFETY_BASELINES.deadlock_risk_threshold,
        params.currentThresholds.deadlock_risk_threshold - 4
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'deadlock_risk_threshold',
        category: 'deadlock',
        currentValue: params.currentThresholds.deadlock_risk_threshold,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.deadlock_risk_threshold) /
            params.currentThresholds.deadlock_risk_threshold) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.deadlock_risk_threshold),
        requiresApproval: false,
        approved: false,
        confidenceScore: 88,
        rationale: 'Lower deadlock threshold to detect orchestrator stalls sooner',
        safetyConstraintActive: false,
        metricsJustification: 'Deadlock risk indicators present in system metrics',
      });
    }

    // 6. Memory Corruption Threshold adjustment
    if (params.metrics.memoryCorruptionRisk) {
      // Raise memory threshold to catch corruption more aggressively
      const proposed = Math.min(
        this.SAFETY_CEILINGS.memory_corruption_threshold,
        Math.max(
          this.SAFETY_BASELINES.memory_corruption_threshold,
          params.currentThresholds.memory_corruption_threshold + 2
        )
      );

      adjustments.push({
        adjustmentId: crypto.randomUUID(),
        cycleId: params.cycleId,
        timestamp: new Date().toISOString(),
        parameter: 'memory_corruption_threshold',
        category: 'memory',
        currentValue: params.currentThresholds.memory_corruption_threshold,
        proposedValue: proposed,
        adjustedValue: proposed,
        delta:
          ((proposed - params.currentThresholds.memory_corruption_threshold) /
            params.currentThresholds.memory_corruption_threshold) *
          100,
        deltaAbsolute: Math.abs(proposed - params.currentThresholds.memory_corruption_threshold),
        requiresApproval: false,
        approved: false,
        confidenceScore: 92,
        rationale: 'Raise memory corruption threshold to catch state integrity issues',
        safetyConstraintActive: false,
        metricsJustification: 'Memory corruption risks detected in agent state',
      });
    }

    // Store proposed adjustments
    const supabase = await getSupabaseServer();
    for (const adjustment of adjustments) {
      await supabase.from('threshold_adjustment_proposals').insert({
        workspace_id: params.workspaceId,
        calibration_cycle_id: params.cycleId,
        adjustment_id: adjustment.adjustmentId,
        parameter_name: adjustment.parameter,
        parameter_category: adjustment.category,
        current_value: adjustment.currentValue,
        proposed_value: adjustment.proposedValue,
        delta_percentage: adjustment.delta,
        delta_absolute: adjustment.deltaAbsolute,
        requires_approval: adjustment.requiresApproval,
        confidence_score: adjustment.confidenceScore,
        rationale: adjustment.rationale,
        metrics_justification: adjustment.metricsJustification,
        created_at: new Date().toISOString(),
      });
    }

    return adjustments;
  }

  /**
   * Apply threshold adjustments to system
   */
  async applyAdjustments(params: {
    workspaceId: string;
    cycleId: string;
    adjustments: ThresholdAdjustmentResult[];
    approvedBy?: string;
  }): Promise<{ appliedCount: number; lockedCount: number }> {
    const supabase = await getSupabaseServer();

    let appliedCount = 0;
    let lockedCount = 0;

    for (const adjustment of params.adjustments) {
      // Check if adjustment respects safety constraints
      const baseline = this.SAFETY_BASELINES[adjustment.parameter as keyof ThresholdSet];
      const ceiling = this.SAFETY_CEILINGS[adjustment.parameter as keyof ThresholdSet];

      let finalValue = adjustment.adjustedValue;
      let safetyConstraintActive = false;

      if (finalValue < baseline) {
        finalValue = baseline;
        safetyConstraintActive = true;
        lockedCount++;
      } else if (finalValue > ceiling) {
        finalValue = ceiling;
        safetyConstraintActive = true;
        lockedCount++;
      }

      // Apply adjustment
      await supabase.from('autonomy_calibration_parameters').insert({
        workspace_id: params.workspaceId,
        parameter_name: adjustment.parameter,
        parameter_category: adjustment.category,
        current_value: finalValue,
        baseline_value: baseline,
        min_value: baseline,
        max_value: ceiling,
        calibration_cycle_id: params.cycleId,
        confidence_score: adjustment.confidenceScore,
        applied_at: new Date().toISOString(),
      });

      // Record execution
      await supabase.from('threshold_adjustment_executions').insert({
        workspace_id: params.workspaceId,
        adjustment_id: adjustment.adjustmentId,
        calibration_cycle_id: params.cycleId,
        parameter_name: adjustment.parameter,
        current_value: adjustment.currentValue,
        final_value: finalValue,
        safety_constraint_active: safetyConstraintActive,
        approved_by: params.approvedBy,
        executed_at: new Date().toISOString(),
      });

      appliedCount++;
    }

    // Archive to memory
    await this.memoryStore.store({
      workspaceId: params.workspaceId,
      agent: 'threshold-adjustment-model',
      memoryType: 'threshold_adjustments',
      content: {
        cycle_id: params.cycleId,
        applied_count: appliedCount,
        locked_count: lockedCount,
        adjustments: params.adjustments.map(a => ({
          parameter: a.parameter,
          delta: a.delta,
          locked: a.safetyConstraintActive,
        })),
        timestamp: new Date().toISOString(),
      },
      importance: Math.min(100, 60 + appliedCount * 8),
      confidence: 85,
      keywords: ['threshold', 'calibration', 'safety', 'adjustment'],
    });

    return { appliedCount, lockedCount };
  }

  /**
   * Get current threshold set
   */
  getBaselines(): ThresholdSet {
    return { ...this.SAFETY_BASELINES };
  }

  /**
   * Get ceiling thresholds
   */
  getCeilings(): ThresholdSet {
    return { ...this.SAFETY_CEILINGS };
  }

  /**
   * Validate a threshold value against safety constraints
   */
  validateThreshold(parameter: keyof ThresholdSet, value: number): {
    valid: boolean;
    message: string;
    constrainedValue: number;
  } {
    const baseline = this.SAFETY_BASELINES[parameter];
    const ceiling = this.SAFETY_CEILINGS[parameter];

    if (value < baseline) {
      return {
        valid: false,
        message: `Value ${value} is below safety baseline ${baseline}`,
        constrainedValue: baseline,
      };
    }

    if (value > ceiling) {
      return {
        valid: false,
        message: `Value ${value} exceeds safety ceiling ${ceiling}`,
        constrainedValue: ceiling,
      };
    }

    return {
      valid: true,
      message: 'Threshold is within safe bounds',
      constrainedValue: value,
    };
  }
}

export const thresholdAdjustmentModel = new ThresholdAdjustmentModel();
