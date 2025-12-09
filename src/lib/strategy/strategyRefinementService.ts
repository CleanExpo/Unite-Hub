/**
 * Strategy Refinement Service
 * Phase 11 Week 7-8: Adaptive Strategy Refinement
 *
 * Analyzes historical KPIs, detects drift, and adjusts horizon plans.
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type CycleType = 'SCHEDULED' | 'DRIFT_TRIGGERED' | 'MANUAL' | 'PERFORMANCE';
export type CycleStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type DriftSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SignalType = 'KPI_DRIFT' | 'TIMELINE_DRIFT' | 'RESOURCE_DRIFT' | 'DEPENDENCY_DRIFT' | 'EXTERNAL_DRIFT';
export type DriftDirection = 'ABOVE' | 'BELOW' | 'DELAYED' | 'ACCELERATED';

export interface RefinementCycle {
  id: string;
  organization_id: string;
  horizon_plan_id: string | null;
  cycle_number: number;
  cycle_type: CycleType;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  drift_detected: boolean;
  drift_severity: DriftSeverity | null;
  domains_analyzed: string[];
  adjustments_count: number;
  adjustments_summary: Record<string, unknown>;
  confidence_before: number | null;
  confidence_after: number | null;
  improvement_percent: number | null;
  status: CycleStatus;
  created_at: string;
}

export interface DriftSignal {
  id: string;
  organization_id: string;
  refinement_cycle_id: string;
  signal_type: SignalType;
  domain: string;
  metric_name: string | null;
  horizon_step_id: string | null;
  expected_value: number | null;
  actual_value: number | null;
  drift_percent: number | null;
  drift_direction: DriftDirection | null;
  severity: DriftSeverity;
  impact_score: number | null;
  probable_causes: string[];
  contributing_factors: Record<string, unknown>;
  recommended_actions: string[];
  auto_correctable: boolean;
  resolved: boolean;
  detected_at: string;
}

export interface DriftAnalysisResult {
  cycle_id: string;
  signals: DriftSignal[];
  overall_severity: DriftSeverity;
  domains_affected: string[];
  auto_correctable_count: number;
  recommended_actions: Array<{
    action: string;
    priority: number;
    domain: string;
  }>;
}

export interface RefinementConfig {
  drift_threshold_percent?: number;
  min_data_points?: number;
  look_back_days?: number;
  auto_correct?: boolean;
}

export class StrategyRefinementService {
  private defaultConfig: Required<RefinementConfig> = {
    drift_threshold_percent: 10,
    min_data_points: 3,
    look_back_days: 14,
    auto_correct: false,
  };

  /**
   * Start a new refinement cycle
   */
  async startRefinementCycle(
    organizationId: string,
    cycleType: CycleType,
    horizonPlanId?: string
  ): Promise<RefinementCycle> {
    const supabase = await getSupabaseServer();

    // Get cycle number
    const { data: lastCycle } = await supabase
      .from('refinement_cycles')
      .select('cycle_number')
      .eq('organization_id', organizationId)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .single();

    const cycleNumber = (lastCycle?.cycle_number || 0) + 1;

    const { data, error } = await supabase
      .from('refinement_cycles')
      .insert({
        organization_id: organizationId,
        horizon_plan_id: horizonPlanId || null,
        cycle_number: cycleNumber,
        cycle_type: cycleType,
        status: 'IN_PROGRESS',
        domains_analyzed: [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start refinement cycle: ${error.message}`);
    }

    return data;
  }

  /**
   * Analyze KPIs for drift
   */
  async analyzeForDrift(
    organizationId: string,
    cycleId: string,
    config?: RefinementConfig
  ): Promise<DriftAnalysisResult> {
    const cfg = { ...this.defaultConfig, ...config };
    const supabase = await getSupabaseServer();

    const signals: DriftSignal[] = [];
    const domainsAffected = new Set<string>();

    // Get recent KPI snapshots
    const lookBackDate = new Date();
    lookBackDate.setDate(lookBackDate.getDate() - cfg.look_back_days);

    const { data: snapshots } = await supabase
      .from('kpi_snapshots')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('snapshot_date', lookBackDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (!snapshots || snapshots.length < cfg.min_data_points) {
      return {
        cycle_id: cycleId,
        signals: [],
        overall_severity: 'LOW',
        domains_affected: [],
        auto_correctable_count: 0,
        recommended_actions: [],
      };
    }

    // Group by domain and metric
    const metricGroups = new Map<string, typeof snapshots>();
    for (const snapshot of snapshots) {
      const key = `${snapshot.domain}-${snapshot.metric_name}`;
      const group = metricGroups.get(key) || [];
      group.push(snapshot);
      metricGroups.set(key, group);
    }

    // Analyze each metric for drift
    for (const [key, group] of metricGroups) {
      if (group.length < cfg.min_data_points) {
continue;
}

      const [domain, metricName] = key.split('-');
      const driftAnalysis = this.detectMetricDrift(group, cfg.drift_threshold_percent);

      if (driftAnalysis.hasDrift) {
        const signal = await this.createDriftSignal(
          organizationId,
          cycleId,
          domain,
          metricName,
          driftAnalysis
        );
        signals.push(signal);
        domainsAffected.add(domain);
      }
    }

    // Check for timeline drift
    const timelineSignals = await this.detectTimelineDrift(organizationId, cycleId);
    signals.push(...timelineSignals);
    timelineSignals.forEach(s => domainsAffected.add(s.domain));

    // Calculate overall severity
    const overallSeverity = this.calculateOverallSeverity(signals);

    // Update cycle with results
    await supabase
      .from('refinement_cycles')
      .update({
        drift_detected: signals.length > 0,
        drift_severity: overallSeverity,
        domains_analyzed: Array.from(domainsAffected),
      })
      .eq('id', cycleId);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(signals);

    return {
      cycle_id: cycleId,
      signals,
      overall_severity: overallSeverity,
      domains_affected: Array.from(domainsAffected),
      auto_correctable_count: signals.filter(s => s.auto_correctable).length,
      recommended_actions: recommendedActions,
    };
  }

  /**
   * Complete a refinement cycle
   */
  async completeRefinementCycle(
    cycleId: string,
    adjustmentsCount: number,
    adjustmentsSummary: Record<string, unknown>,
    confidenceAfter?: number
  ): Promise<RefinementCycle> {
    const supabase = await getSupabaseServer();

    // Get cycle start time for duration calculation
    const { data: cycle } = await supabase
      .from('refinement_cycles')
      .select('started_at, confidence_before')
      .eq('id', cycleId)
      .single();

    const duration = cycle
      ? Math.floor((Date.now() - new Date(cycle.started_at).getTime()) / 1000)
      : 0;

    const improvementPercent = cycle?.confidence_before && confidenceAfter
      ? ((confidenceAfter - cycle.confidence_before) / cycle.confidence_before) * 100
      : null;

    const { data, error } = await supabase
      .from('refinement_cycles')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        adjustments_count: adjustmentsCount,
        adjustments_summary: adjustmentsSummary,
        confidence_after: confidenceAfter,
        improvement_percent: improvementPercent,
      })
      .eq('id', cycleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete refinement cycle: ${error.message}`);
    }

    return data;
  }

  /**
   * Get drift signals for an organization
   */
  async getDriftSignals(
    organizationId: string,
    options?: {
      resolved?: boolean;
      severity?: DriftSeverity;
      domain?: string;
      limit?: number;
    }
  ): Promise<DriftSignal[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('drift_signals')
      .select('*')
      .eq('organization_id', organizationId)
      .order('detected_at', { ascending: false });

    if (options?.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
    }

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options?.domain) {
      query = query.eq('domain', options.domain);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get drift signals: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Resolve a drift signal
   */
  async resolveDriftSignal(
    signalId: string,
    resolutionAction: string
  ): Promise<DriftSignal> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('drift_signals')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_action: resolutionAction,
      })
      .eq('id', signalId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve drift signal: ${error.message}`);
    }

    return data;
  }

  /**
   * Record performance history
   */
  async recordPerformanceHistory(
    organizationId: string,
    record: {
      horizon_plan_id?: string;
      horizon_step_id?: string;
      domain: string;
      period_start: string;
      period_end: string;
      metric_name: string;
      target_value: number;
      actual_value: number;
      external_factors?: Record<string, unknown>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const periodDays = Math.ceil(
      (new Date(record.period_end).getTime() - new Date(record.period_start).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const achievementPercent = record.target_value !== 0
      ? (record.actual_value / record.target_value) * 100
      : 100;

    const performanceGrade = this.calculatePerformanceGrade(achievementPercent);
    const reinforcementScore = this.calculateReinforcementScore(achievementPercent);

    const { error } = await supabase.from('performance_history').insert({
      organization_id: organizationId,
      horizon_plan_id: record.horizon_plan_id,
      horizon_step_id: record.horizon_step_id,
      domain: record.domain,
      period_start: record.period_start,
      period_end: record.period_end,
      period_days: periodDays,
      metric_name: record.metric_name,
      target_value: record.target_value,
      actual_value: record.actual_value,
      achievement_percent: achievementPercent,
      performance_grade: performanceGrade,
      on_track: achievementPercent >= 80,
      external_factors: record.external_factors || {},
      reinforcement_score: reinforcementScore,
    });

    if (error) {
      throw new Error(`Failed to record performance history: ${error.message}`);
    }
  }

  /**
   * Get historical performance patterns
   */
  async getPerformancePatterns(
    organizationId: string,
    domain?: string
  ): Promise<{
    success_patterns: string[];
    failure_patterns: string[];
    avg_achievement: number;
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('performance_history')
      .select('*')
      .eq('organization_id', organizationId)
      .order('period_end', { ascending: false })
      .limit(50);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      return {
        success_patterns: [],
        failure_patterns: [],
        avg_achievement: 0,
        trend: 'STABLE',
      };
    }

    // Calculate average achievement
    const avgAchievement =
      data.reduce((sum, r) => sum + (r.achievement_percent || 0), 0) / data.length;

    // Identify patterns
    const successPatterns: string[] = [];
    const failurePatterns: string[] = [];

    const successRecords = data.filter(r => r.on_track);
    const failureRecords = data.filter(r => !r.on_track);

    // Extract common factors from successes
    if (successRecords.length > 0) {
      successPatterns.push(`${successRecords.length} successful periods out of ${data.length}`);
      const avgSuccessAchievement = successRecords.reduce((sum, r) => sum + r.achievement_percent, 0) / successRecords.length;
      successPatterns.push(`Average achievement in success: ${avgSuccessAchievement.toFixed(1)}%`);
    }

    // Extract common factors from failures
    if (failureRecords.length > 0) {
      failurePatterns.push(`${failureRecords.length} underperforming periods`);
      const avgFailureAchievement = failureRecords.reduce((sum, r) => sum + r.achievement_percent, 0) / failureRecords.length;
      failurePatterns.push(`Average achievement in failures: ${avgFailureAchievement.toFixed(1)}%`);
    }

    // Calculate trend
    const recentAvg = data.slice(0, Math.min(10, data.length))
      .reduce((sum, r) => sum + r.achievement_percent, 0) / Math.min(10, data.length);
    const olderAvg = data.slice(-Math.min(10, data.length))
      .reduce((sum, r) => sum + r.achievement_percent, 0) / Math.min(10, data.length);

    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (recentAvg > olderAvg * 1.05) {
trend = 'IMPROVING';
} else if (recentAvg < olderAvg * 0.95) {
trend = 'DECLINING';
}

    return {
      success_patterns: successPatterns,
      failure_patterns: failurePatterns,
      avg_achievement: avgAchievement,
      trend,
    };
  }

  // Private helper methods

  private detectMetricDrift(
    snapshots: Array<{ metric_value: number; baseline_value?: number; target_value?: number }>,
    thresholdPercent: number
  ): {
    hasDrift: boolean;
    driftPercent: number;
    direction: DriftDirection;
    severity: DriftSeverity;
    expectedValue: number;
    actualValue: number;
  } {
    const recent = snapshots[snapshots.length - 1];
    const baseline = snapshots[0];

    // Calculate expected value based on linear progression
    const progressRatio = snapshots.length / (snapshots.length + 5); // Assume 5 more to go
    const expectedValue = baseline.metric_value +
      (((recent.target_value || baseline.metric_value * 1.2) - baseline.metric_value) * progressRatio);

    const actualValue = recent.metric_value;
    const driftPercent = expectedValue !== 0
      ? ((actualValue - expectedValue) / expectedValue) * 100
      : 0;

    const hasDrift = Math.abs(driftPercent) > thresholdPercent;

    return {
      hasDrift,
      driftPercent,
      direction: driftPercent > 0 ? 'ABOVE' : 'BELOW',
      severity: this.calculateSeverity(Math.abs(driftPercent)),
      expectedValue,
      actualValue,
    };
  }

  private async createDriftSignal(
    organizationId: string,
    cycleId: string,
    domain: string,
    metricName: string,
    analysis: ReturnType<typeof this.detectMetricDrift>
  ): Promise<DriftSignal> {
    const supabase = await getSupabaseServer();

    const probableCauses = this.inferProbableCauses(domain, analysis);
    const recommendedActions = this.generateMetricActions(domain, metricName, analysis);

    const { data, error } = await supabase
      .from('drift_signals')
      .insert({
        organization_id: organizationId,
        refinement_cycle_id: cycleId,
        signal_type: 'KPI_DRIFT',
        domain,
        metric_name: metricName,
        expected_value: analysis.expectedValue,
        actual_value: analysis.actualValue,
        drift_percent: analysis.driftPercent,
        drift_direction: analysis.direction,
        severity: analysis.severity,
        impact_score: Math.min(100, Math.abs(analysis.driftPercent)),
        probable_causes: probableCauses,
        recommended_actions: recommendedActions,
        auto_correctable: analysis.severity === 'LOW' || analysis.severity === 'MEDIUM',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create drift signal: ${error.message}`);
    }

    return data;
  }

  private async detectTimelineDrift(
    organizationId: string,
    cycleId: string
  ): Promise<DriftSignal[]> {
    const supabase = await getSupabaseServer();
    const signals: DriftSignal[] = [];

    // Check for overdue steps
    const { data: overdueSteps } = await supabase
      .from('horizon_steps')
      .select('*, horizon_plans!inner(organization_id, start_date)')
      .eq('horizon_plans.organization_id', organizationId)
      .eq('status', 'IN_PROGRESS');

    if (overdueSteps) {
      for (const step of overdueSteps) {
        const planStart = new Date(step.horizon_plans.start_date);
        const expectedEnd = new Date(planStart);
        expectedEnd.setDate(expectedEnd.getDate() + step.end_day);

        if (new Date() > expectedEnd) {
          const daysOverdue = Math.ceil((Date.now() - expectedEnd.getTime()) / (1000 * 60 * 60 * 24));
          const severity = daysOverdue > 7 ? 'HIGH' : daysOverdue > 3 ? 'MEDIUM' : 'LOW';

          const { data: signal } = await supabase
            .from('drift_signals')
            .insert({
              organization_id: organizationId,
              refinement_cycle_id: cycleId,
              signal_type: 'TIMELINE_DRIFT',
              domain: step.domain,
              horizon_step_id: step.id,
              drift_direction: 'DELAYED',
              severity,
              impact_score: Math.min(100, daysOverdue * 10),
              probable_causes: ['Step taking longer than estimated', 'Resource constraints'],
              recommended_actions: ['Review step scope', 'Allocate additional resources', 'Adjust timeline'],
              auto_correctable: false,
            })
            .select()
            .single();

          if (signal) {
signals.push(signal);
}
        }
      }
    }

    return signals;
  }

  private calculateSeverity(driftPercent: number): DriftSeverity {
    if (driftPercent > 30) {
return 'CRITICAL';
}
    if (driftPercent > 20) {
return 'HIGH';
}
    if (driftPercent > 10) {
return 'MEDIUM';
}
    return 'LOW';
  }

  private calculateOverallSeverity(signals: DriftSignal[]): DriftSeverity {
    if (signals.length === 0) {
return 'LOW';
}

    const severityOrder: DriftSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const maxSeverity = signals.reduce((max, s) => {
      const current = severityOrder.indexOf(s.severity);
      const maxIdx = severityOrder.indexOf(max);
      return current > maxIdx ? s.severity : max;
    }, 'LOW' as DriftSeverity);

    return maxSeverity;
  }

  private calculatePerformanceGrade(achievementPercent: number): string {
    if (achievementPercent >= 90) {
return 'A';
}
    if (achievementPercent >= 80) {
return 'B';
}
    if (achievementPercent >= 70) {
return 'C';
}
    if (achievementPercent >= 60) {
return 'D';
}
    return 'F';
  }

  private calculateReinforcementScore(achievementPercent: number): number {
    // -100 to +100 scale
    return Math.max(-100, Math.min(100, (achievementPercent - 100)));
  }

  private inferProbableCauses(
    domain: string,
    analysis: { direction: DriftDirection; driftPercent: number }
  ): string[] {
    const causes: string[] = [];

    if (analysis.direction === 'BELOW') {
      causes.push('Targets may be too aggressive');
      causes.push('Resource allocation insufficient');
      causes.push('External market conditions');
    } else {
      causes.push('Conservative target setting');
      causes.push('Unexpected positive market response');
    }

    // Domain-specific causes
    if (domain === 'SEO') {
      causes.push(analysis.direction === 'BELOW'
        ? 'Algorithm updates impacting rankings'
        : 'Successful content strategy');
    } else if (domain === 'ADS') {
      causes.push(analysis.direction === 'BELOW'
        ? 'Increased competition in ad auction'
        : 'Improved ad quality scores');
    }

    return causes.slice(0, 3);
  }

  private generateMetricActions(
    domain: string,
    metricName: string,
    analysis: { direction: DriftDirection; driftPercent: number; severity: DriftSeverity }
  ): string[] {
    const actions: string[] = [];

    if (analysis.direction === 'BELOW') {
      actions.push(`Review ${metricName} strategy for ${domain}`);
      actions.push('Reallocate resources from over-performing areas');

      if (analysis.severity === 'HIGH' || analysis.severity === 'CRITICAL') {
        actions.push('Consider emergency intervention');
        actions.push('Adjust targets to realistic levels');
      }
    } else {
      actions.push(`Consider increasing ${metricName} targets`);
      actions.push('Document successful tactics for replication');
    }

    return actions;
  }

  private generateRecommendedActions(signals: DriftSignal[]): Array<{
    action: string;
    priority: number;
    domain: string;
  }> {
    const actions: Array<{ action: string; priority: number; domain: string }> = [];

    for (const signal of signals) {
      for (const action of signal.recommended_actions as string[]) {
        const priorityMap: Record<DriftSeverity, number> = {
          CRITICAL: 1,
          HIGH: 2,
          MEDIUM: 3,
          LOW: 4,
        };

        actions.push({
          action,
          priority: priorityMap[signal.severity],
          domain: signal.domain,
        });
      }
    }

    // Sort by priority
    return actions.sort((a, b) => a.priority - b.priority).slice(0, 10);
  }
}

export const strategyRefinementService = new StrategyRefinementService();
