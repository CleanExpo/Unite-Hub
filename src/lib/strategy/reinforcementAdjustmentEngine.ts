/**
 * Reinforcement Adjustment Engine
 * Phase 11 Week 7-8: Adaptive Strategy Refinement
 *
 * Strengthens or weakens strategies based on execution outcomes,
 * operator feedback, and simulation confidence.
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type AdjustmentTarget = 'STEP' | 'DOMAIN' | 'KPI_TARGET' | 'TIMELINE' | 'RESOURCE' | 'PRIORITY';
export type AdjustmentType = 'STRENGTHEN' | 'WEAKEN' | 'MAINTAIN' | 'REDIRECT' | 'PAUSE' | 'ACCELERATE';

export interface ReinforcementAdjustment {
  id: string;
  organization_id: string;
  refinement_cycle_id: string | null;
  adjustment_target: AdjustmentTarget;
  target_id: string | null;
  domain: string | null;
  adjustment_type: AdjustmentType;
  previous_value: unknown;
  new_value: unknown;
  change_magnitude: number;
  trigger_reason: string;
  supporting_evidence: Array<{ type: string; data: unknown }>;
  confidence: number;
  operator_feedback: string | null;
  operator_approved: boolean | null;
  expected_impact: number | null;
  actual_impact: number | null;
  outcome_recorded: boolean;
  created_at: string;
}

export interface AdjustmentRequest {
  organization_id: string;
  refinement_cycle_id?: string;
  target: AdjustmentTarget;
  target_id?: string;
  domain?: string;
  trigger_reason: string;
  evidence?: Array<{ type: string; data: unknown }>;
}

export interface AdjustmentOutcome {
  adjustment_id: string;
  actual_impact: number;
  success: boolean;
  lessons: string[];
}

export interface ReinforcementSignal {
  source: 'EXECUTION' | 'FEEDBACK' | 'SIMULATION' | 'HISTORICAL';
  strength: number; // -1 to 1
  confidence: number; // 0 to 1
  reason: string;
  data: Record<string, unknown>;
}

export class ReinforcementAdjustmentEngine {
  /**
   * Generate adjustment recommendation based on signals
   */
  async generateAdjustment(
    request: AdjustmentRequest,
    signals: ReinforcementSignal[]
  ): Promise<ReinforcementAdjustment> {
    const supabase = await getSupabaseServer();

    // Calculate combined signal strength
    const { adjustmentType, magnitude, confidence } = this.calculateAdjustment(signals);

    // Get current value if target exists
    const previousValue = await this.getCurrentValue(
      request.target,
      request.target_id,
      request.domain
    );

    // Calculate new value
    const newValue = this.calculateNewValue(
      previousValue,
      adjustmentType,
      magnitude
    );

    // Estimate expected impact
    const expectedImpact = this.estimateImpact(adjustmentType, magnitude, confidence);

    const { data, error } = await supabase
      .from('reinforcement_adjustments')
      .insert({
        organization_id: request.organization_id,
        refinement_cycle_id: request.refinement_cycle_id || null,
        adjustment_target: request.target,
        target_id: request.target_id || null,
        domain: request.domain || null,
        adjustment_type: adjustmentType,
        previous_value: previousValue,
        new_value: newValue,
        change_magnitude: magnitude,
        trigger_reason: request.trigger_reason,
        supporting_evidence: request.evidence || signals.map(s => ({ type: s.source, data: s.data })),
        confidence,
        expected_impact: expectedImpact,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to generate adjustment: ${error.message}`);
    }

    return data;
  }

  /**
   * Apply adjustment after operator approval
   */
  async applyAdjustment(adjustmentId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { data: adjustment, error: fetchError } = await supabase
      .from('reinforcement_adjustments')
      .select('*')
      .eq('id', adjustmentId)
      .single();

    if (fetchError || !adjustment) {
      throw new Error('Adjustment not found');
    }

    // Apply based on target type
    switch (adjustment.adjustment_target) {
      case 'STEP':
        await this.applyStepAdjustment(adjustment);
        break;
      case 'KPI_TARGET':
        await this.applyKPIAdjustment(adjustment);
        break;
      case 'PRIORITY':
        await this.applyPriorityAdjustment(adjustment);
        break;
      case 'TIMELINE':
        await this.applyTimelineAdjustment(adjustment);
        break;
      default:
        // Domain/Resource adjustments are handled at planning level
        break;
    }

    // Mark as applied
    await supabase
      .from('reinforcement_adjustments')
      .update({ operator_approved: true, approved_at: new Date().toISOString() })
      .eq('id', adjustmentId);
  }

  /**
   * Record adjustment outcome for learning
   */
  async recordOutcome(outcome: AdjustmentOutcome): Promise<void> {
    const supabase = await getSupabaseServer();

    // Update adjustment with actual impact
    const { error: updateError } = await supabase
      .from('reinforcement_adjustments')
      .update({
        actual_impact: outcome.actual_impact,
        outcome_recorded: true,
      })
      .eq('id', outcome.adjustment_id);

    if (updateError) {
      throw new Error(`Failed to record outcome: ${updateError.message}`);
    }

    // Get adjustment details for learning
    const { data: adjustment } = await supabase
      .from('reinforcement_adjustments')
      .select('*')
      .eq('id', outcome.adjustment_id)
      .single();

    if (adjustment) {
      // Record performance history for future learning
      await supabase.from('performance_history').insert({
        organization_id: adjustment.organization_id,
        domain: adjustment.domain || 'OVERALL',
        period_start: adjustment.created_at,
        period_end: new Date().toISOString(),
        period_days: Math.ceil(
          (Date.now() - new Date(adjustment.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        metric_name: `${adjustment.adjustment_target}_${adjustment.adjustment_type}`,
        target_value: adjustment.expected_impact,
        actual_value: outcome.actual_impact,
        achievement_percent: adjustment.expected_impact
          ? (outcome.actual_impact / adjustment.expected_impact) * 100
          : 100,
        performance_grade: outcome.success ? 'A' : 'C',
        on_track: outcome.success,
        lessons_learned: outcome.lessons,
        reinforcement_score: outcome.success ? 50 : -30,
      });
    }
  }

  /**
   * Get pending adjustments requiring approval
   */
  async getPendingAdjustments(organizationId: string): Promise<ReinforcementAdjustment[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('reinforcement_adjustments')
      .select('*')
      .eq('organization_id', organizationId)
      .is('operator_approved', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending adjustments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Provide operator feedback on adjustment
   */
  async provideFeedback(
    adjustmentId: string,
    feedback: string,
    approved: boolean,
    approvedBy: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('reinforcement_adjustments')
      .update({
        operator_feedback: feedback,
        operator_approved: approved,
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: approved ? approvedBy : null,
      })
      .eq('id', adjustmentId);

    if (error) {
      throw new Error(`Failed to provide feedback: ${error.message}`);
    }

    // If approved, apply the adjustment
    if (approved) {
      await this.applyAdjustment(adjustmentId);
    }
  }

  /**
   * Generate signals from execution results
   */
  generateExecutionSignals(
    achievementPercent: number,
    onTime: boolean,
    resourcesUsed: number,
    resourcesAllocated: number
  ): ReinforcementSignal[] {
    const signals: ReinforcementSignal[] = [];

    // Performance signal
    if (achievementPercent >= 100) {
      signals.push({
        source: 'EXECUTION',
        strength: Math.min(1, (achievementPercent - 100) / 50 + 0.5),
        confidence: 0.9,
        reason: 'Target exceeded',
        data: { achievementPercent },
      });
    } else if (achievementPercent >= 80) {
      signals.push({
        source: 'EXECUTION',
        strength: 0.2,
        confidence: 0.8,
        reason: 'Target mostly achieved',
        data: { achievementPercent },
      });
    } else {
      signals.push({
        source: 'EXECUTION',
        strength: -Math.min(1, (80 - achievementPercent) / 40),
        confidence: 0.85,
        reason: 'Target underachieved',
        data: { achievementPercent },
      });
    }

    // Timing signal
    if (!onTime) {
      signals.push({
        source: 'EXECUTION',
        strength: -0.3,
        confidence: 0.9,
        reason: 'Deadline missed',
        data: { onTime },
      });
    }

    // Resource efficiency signal
    const resourceEfficiency = resourcesAllocated > 0
      ? resourcesUsed / resourcesAllocated
      : 1;

    if (resourceEfficiency < 0.8) {
      signals.push({
        source: 'EXECUTION',
        strength: 0.2,
        confidence: 0.7,
        reason: 'Under-utilized resources',
        data: { resourceEfficiency },
      });
    } else if (resourceEfficiency > 1.2) {
      signals.push({
        source: 'EXECUTION',
        strength: -0.2,
        confidence: 0.7,
        reason: 'Over-utilized resources',
        data: { resourceEfficiency },
      });
    }

    return signals;
  }

  /**
   * Generate signals from simulation confidence
   */
  generateSimulationSignals(
    simulationConfidence: number,
    pathRank: number,
    totalPaths: number
  ): ReinforcementSignal[] {
    const signals: ReinforcementSignal[] = [];

    // High confidence path
    if (simulationConfidence > 0.8 && pathRank === 1) {
      signals.push({
        source: 'SIMULATION',
        strength: 0.5,
        confidence: simulationConfidence,
        reason: 'High confidence best path',
        data: { simulationConfidence, pathRank, totalPaths },
      });
    }
    // Low confidence warning
    else if (simulationConfidence < 0.5) {
      signals.push({
        source: 'SIMULATION',
        strength: -0.3,
        confidence: 0.7,
        reason: 'Low simulation confidence',
        data: { simulationConfidence, pathRank, totalPaths },
      });
    }

    // Path competition signal
    if (totalPaths > 1) {
      const competitionFactor = 1 - (pathRank - 1) / totalPaths;
      signals.push({
        source: 'SIMULATION',
        strength: competitionFactor - 0.5,
        confidence: 0.6,
        reason: `Path ranked ${pathRank} of ${totalPaths}`,
        data: { pathRank, totalPaths },
      });
    }

    return signals;
  }

  /**
   * Generate signals from historical patterns
   */
  async generateHistoricalSignals(
    organizationId: string,
    domain: string,
    metricName: string
  ): Promise<ReinforcementSignal[]> {
    const supabase = await getSupabaseServer();
    const signals: ReinforcementSignal[] = [];

    // Get historical performance
    const { data: history } = await supabase
      .from('performance_history')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('domain', domain)
      .order('period_end', { ascending: false })
      .limit(20);

    if (!history || history.length < 5) {
      return signals;
    }

    // Calculate trend
    const recentAvg = history.slice(0, 5)
      .reduce((sum, h) => sum + (h.achievement_percent || 0), 0) / 5;
    const olderAvg = history.slice(-5)
      .reduce((sum, h) => sum + (h.achievement_percent || 0), 0) / 5;

    if (recentAvg > olderAvg * 1.1) {
      signals.push({
        source: 'HISTORICAL',
        strength: 0.4,
        confidence: 0.8,
        reason: 'Improving historical trend',
        data: { recentAvg, olderAvg, improvement: ((recentAvg - olderAvg) / olderAvg) * 100 },
      });
    } else if (recentAvg < olderAvg * 0.9) {
      signals.push({
        source: 'HISTORICAL',
        strength: -0.4,
        confidence: 0.8,
        reason: 'Declining historical trend',
        data: { recentAvg, olderAvg, decline: ((olderAvg - recentAvg) / olderAvg) * 100 },
      });
    }

    // Success rate signal
    const successCount = history.filter(h => h.on_track).length;
    const successRate = successCount / history.length;

    if (successRate > 0.7) {
      signals.push({
        source: 'HISTORICAL',
        strength: 0.3,
        confidence: 0.75,
        reason: `High historical success rate: ${(successRate * 100).toFixed(0)}%`,
        data: { successRate, totalRecords: history.length },
      });
    } else if (successRate < 0.4) {
      signals.push({
        source: 'HISTORICAL',
        strength: -0.4,
        confidence: 0.75,
        reason: `Low historical success rate: ${(successRate * 100).toFixed(0)}%`,
        data: { successRate, totalRecords: history.length },
      });
    }

    return signals;
  }

  // Private helper methods

  private calculateAdjustment(signals: ReinforcementSignal[]): {
    adjustmentType: AdjustmentType;
    magnitude: number;
    confidence: number;
  } {
    if (signals.length === 0) {
      return { adjustmentType: 'MAINTAIN', magnitude: 0, confidence: 0.5 };
    }

    // Weight signals by confidence
    let totalStrength = 0;
    let totalConfidence = 0;

    for (const signal of signals) {
      totalStrength += signal.strength * signal.confidence;
      totalConfidence += signal.confidence;
    }

    const avgStrength = totalStrength / totalConfidence;
    const avgConfidence = totalConfidence / signals.length;

    // Determine adjustment type
    let adjustmentType: AdjustmentType;
    if (avgStrength > 0.5) {
      adjustmentType = 'STRENGTHEN';
    } else if (avgStrength > 0.2) {
      adjustmentType = 'ACCELERATE';
    } else if (avgStrength < -0.5) {
      adjustmentType = 'PAUSE';
    } else if (avgStrength < -0.2) {
      adjustmentType = 'WEAKEN';
    } else if (Math.abs(avgStrength) < 0.1 && avgConfidence < 0.5) {
      adjustmentType = 'REDIRECT';
    } else {
      adjustmentType = 'MAINTAIN';
    }

    return {
      adjustmentType,
      magnitude: Math.abs(avgStrength) * 100,
      confidence: avgConfidence,
    };
  }

  private async getCurrentValue(
    target: AdjustmentTarget,
    targetId?: string,
    domain?: string
  ): Promise<unknown> {
    const supabase = await getSupabaseServer();

    switch (target) {
      case 'STEP':
        if (targetId) {
          const { data } = await supabase
            .from('horizon_steps')
            .select('target_kpis, estimated_hours, risk_level')
            .eq('id', targetId)
            .single();
          return data;
        }
        break;
      case 'KPI_TARGET':
        if (targetId) {
          const { data } = await supabase
            .from('kpi_snapshots')
            .select('target_value')
            .eq('id', targetId)
            .single();
          return data?.target_value;
        }
        break;
      default:
        return null;
    }

    return null;
  }

  private calculateNewValue(
    previousValue: unknown,
    adjustmentType: AdjustmentType,
    magnitude: number
  ): unknown {
    if (previousValue === null || previousValue === undefined) {
      return null;
    }

    // Handle numeric values
    if (typeof previousValue === 'number') {
      const multiplier = adjustmentType === 'STRENGTHEN' || adjustmentType === 'ACCELERATE'
        ? 1 + magnitude / 100
        : adjustmentType === 'WEAKEN' || adjustmentType === 'PAUSE'
        ? 1 - magnitude / 100
        : 1;

      return previousValue * multiplier;
    }

    // Handle objects (like target_kpis)
    if (typeof previousValue === 'object') {
      const newValue: Record<string, unknown> = { ...previousValue as Record<string, unknown> };

      for (const key of Object.keys(newValue)) {
        if (typeof newValue[key] === 'number') {
          const multiplier = adjustmentType === 'STRENGTHEN' || adjustmentType === 'ACCELERATE'
            ? 1 + magnitude / 100
            : adjustmentType === 'WEAKEN' || adjustmentType === 'PAUSE'
            ? 1 - magnitude / 100
            : 1;

          newValue[key] = (newValue[key] as number) * multiplier;
        }
      }

      return newValue;
    }

    return previousValue;
  }

  private estimateImpact(
    adjustmentType: AdjustmentType,
    magnitude: number,
    confidence: number
  ): number {
    const baseImpact = {
      STRENGTHEN: 20,
      ACCELERATE: 15,
      MAINTAIN: 0,
      REDIRECT: 10,
      WEAKEN: -10,
      PAUSE: -15,
    }[adjustmentType];

    return baseImpact * (magnitude / 50) * confidence;
  }

  private async applyStepAdjustment(adjustment: ReinforcementAdjustment): Promise<void> {
    const supabase = await getSupabaseServer();

    if (!adjustment.target_id) {
return;
}

    const updates: Record<string, unknown> = {};

    if (adjustment.new_value && typeof adjustment.new_value === 'object') {
      const newVal = adjustment.new_value as Record<string, unknown>;
      if (newVal.target_kpis) {
updates.target_kpis = newVal.target_kpis;
}
      if (newVal.estimated_hours) {
updates.estimated_hours = newVal.estimated_hours;
}
      if (newVal.risk_level) {
updates.risk_level = newVal.risk_level;
}
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('horizon_steps')
        .update(updates)
        .eq('id', adjustment.target_id);
    }
  }

  private async applyKPIAdjustment(adjustment: ReinforcementAdjustment): Promise<void> {
    const supabase = await getSupabaseServer();

    if (!adjustment.target_id || typeof adjustment.new_value !== 'number') {
return;
}

    await supabase
      .from('kpi_snapshots')
      .update({ target_value: adjustment.new_value })
      .eq('id', adjustment.target_id);
  }

  private async applyPriorityAdjustment(adjustment: ReinforcementAdjustment): Promise<void> {
    // Priority adjustments affect step ordering
    // Implementation would reorder steps in the horizon plan
  }

  private async applyTimelineAdjustment(adjustment: ReinforcementAdjustment): Promise<void> {
    // Timeline adjustments extend/compress step durations
    // Implementation would adjust start_day/end_day/duration_days
  }
}

export const reinforcementAdjustmentEngine = new ReinforcementAdjustmentEngine();
