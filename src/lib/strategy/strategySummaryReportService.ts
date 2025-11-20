/**
 * Strategy Summary Report Service
 * Phase 11 Week 9: Final reporting and system health scoring
 *
 * Generates high-level reports of drift events, refinement cycles,
 * horizon plans, and simulation outcomes.
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';

export interface SystemHealthScore {
  overall_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  components: {
    drift_health: number;
    balance_health: number;
    performance_health: number;
    horizon_progress: number;
  };
  last_updated: string;
}

export interface DomainHealthReport {
  domain: string;
  score: number;
  status: HealthStatus;
  allocation: number;
  performance: number;
  drift_signals: number;
  improvement_areas: string[];
  recent_adjustments: number;
}

export interface RefinementHistoryEntry {
  cycle_id: string;
  cycle_number: number;
  cycle_type: string;
  started_at: string;
  completed_at: string | null;
  drift_detected: boolean;
  drift_severity: string | null;
  adjustments_count: number;
  improvement_percent: number | null;
  status: string;
}

export interface HorizonProgressReport {
  plan_id: string;
  plan_name: string;
  horizon_type: string;
  days_total: number;
  days_elapsed: number;
  days_remaining: number;
  progress_percent: number;
  steps_total: number;
  steps_completed: number;
  steps_in_progress: number;
  overall_score: number | null;
  on_track: boolean;
}

export interface SimulationOutcomeSummary {
  total_simulations: number;
  successful: number;
  avg_confidence: number;
  best_path_accuracy: number;
  recent_simulations: Array<{
    id: string;
    created_at: string;
    simulation_type: string;
    paths_evaluated: number;
    best_expected_value: number;
  }>;
}

export interface StrategySummaryReport {
  organization_id: string;
  generated_at: string;
  period_days: number;
  system_health: SystemHealthScore;
  domain_health: DomainHealthReport[];
  refinement_history: RefinementHistoryEntry[];
  horizon_progress: HorizonProgressReport[];
  simulation_outcomes: SimulationOutcomeSummary;
  recommendations: string[];
  alerts: Array<{
    severity: string;
    message: string;
    action: string;
  }>;
}

export class StrategySummaryReportService {
  /**
   * Generate comprehensive strategy summary report
   */
  async generateSummaryReport(
    organizationId: string,
    periodDays: number = 30
  ): Promise<StrategySummaryReport> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Gather all report components in parallel
    const [
      systemHealth,
      domainHealth,
      refinementHistory,
      horizonProgress,
      simulationOutcomes,
    ] = await Promise.all([
      this.calculateSystemHealth(organizationId),
      this.getDomainHealthReports(organizationId),
      this.getRefinementHistory(organizationId, periodDays),
      this.getHorizonProgress(organizationId),
      this.getSimulationOutcomes(organizationId, periodDays),
    ]);

    // Generate recommendations and alerts
    const recommendations = this.generateRecommendations(
      systemHealth,
      domainHealth,
      refinementHistory
    );

    const alerts = this.generateAlerts(
      systemHealth,
      domainHealth,
      horizonProgress
    );

    return {
      organization_id: organizationId,
      generated_at: new Date().toISOString(),
      period_days: periodDays,
      system_health: systemHealth,
      domain_health: domainHealth,
      refinement_history: refinementHistory,
      horizon_progress: horizonProgress,
      simulation_outcomes: simulationOutcomes,
      recommendations,
      alerts,
    };
  }

  /**
   * Calculate overall system health score
   */
  async calculateSystemHealth(organizationId: string): Promise<SystemHealthScore> {
    const supabase = await getSupabaseServer();

    // Get unresolved drift signals
    const { data: driftSignals } = await supabase
      .from('drift_signals')
      .select('severity')
      .eq('organization_id', organizationId)
      .eq('resolved', false);

    // Calculate drift health (100 = no signals, lower for more/severe signals)
    let driftHealth = 100;
    if (driftSignals) {
      const criticalCount = driftSignals.filter(s => s.severity === 'CRITICAL').length;
      const highCount = driftSignals.filter(s => s.severity === 'HIGH').length;
      const mediumCount = driftSignals.filter(s => s.severity === 'MEDIUM').length;

      driftHealth = Math.max(0, 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5));
    }

    // Get latest domain balance
    const { data: balance } = await supabase
      .from('domain_balances')
      .select('balance_score')
      .eq('organization_id', organizationId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    const balanceHealth = balance?.balance_score || 50;

    // Get recent performance history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: performance } = await supabase
      .from('performance_history')
      .select('achievement_percent')
      .eq('organization_id', organizationId)
      .gte('period_end', thirtyDaysAgo.toISOString());

    let performanceHealth = 50;
    if (performance && performance.length > 0) {
      performanceHealth = performance.reduce((sum, p) => sum + (p.achievement_percent || 0), 0) / performance.length;
    }

    // Get horizon plan progress
    const { data: plans } = await supabase
      .from('horizon_plans')
      .select('overall_score')
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE');

    let horizonProgress = 50;
    if (plans && plans.length > 0) {
      const scores = plans.filter(p => p.overall_score != null);
      if (scores.length > 0) {
        horizonProgress = scores.reduce((sum, p) => sum + p.overall_score!, 0) / scores.length;
      }
    }

    // Calculate overall score (weighted average)
    const overallScore = (
      driftHealth * 0.25 +
      balanceHealth * 0.25 +
      performanceHealth * 0.30 +
      horizonProgress * 0.20
    );

    // Determine status
    let status: HealthStatus;
    if (overallScore >= 80) status = 'EXCELLENT';
    else if (overallScore >= 65) status = 'GOOD';
    else if (overallScore >= 50) status = 'FAIR';
    else if (overallScore >= 35) status = 'POOR';
    else status = 'CRITICAL';

    // Calculate trend (compare recent vs older performance)
    let trend: TrendDirection = 'STABLE';
    if (performance && performance.length >= 10) {
      const recent = performance.slice(0, 5).reduce((s, p) => s + (p.achievement_percent || 0), 0) / 5;
      const older = performance.slice(-5).reduce((s, p) => s + (p.achievement_percent || 0), 0) / 5;
      if (recent > older * 1.05) trend = 'IMPROVING';
      else if (recent < older * 0.95) trend = 'DECLINING';
    }

    return {
      overall_score: Math.round(overallScore * 10) / 10,
      status,
      trend,
      components: {
        drift_health: Math.round(driftHealth * 10) / 10,
        balance_health: Math.round(balanceHealth * 10) / 10,
        performance_health: Math.round(performanceHealth * 10) / 10,
        horizon_progress: Math.round(horizonProgress * 10) / 10,
      },
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Get health reports for all domains
   */
  async getDomainHealthReports(organizationId: string): Promise<DomainHealthReport[]> {
    const supabase = await getSupabaseServer();
    const domains = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
    const reports: DomainHealthReport[] = [];

    // Get latest balance
    const { data: balance } = await supabase
      .from('domain_balances')
      .select('*')
      .eq('organization_id', organizationId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    // Get drift signals by domain
    const { data: driftSignals } = await supabase
      .from('drift_signals')
      .select('domain, severity')
      .eq('organization_id', organizationId)
      .eq('resolved', false);

    // Get recent adjustments by domain
    const { data: adjustments } = await supabase
      .from('reinforcement_adjustments')
      .select('domain')
      .eq('organization_id', organizationId)
      .not('domain', 'is', null);

    for (const domain of domains) {
      const domainLower = domain.toLowerCase();
      const allocation = balance ? balance[`${domainLower}_allocation`] || 20 : 20;
      const performance = balance ? balance[`${domainLower}_performance`] || 50 : 50;

      // Count domain-specific metrics
      const domainDrift = driftSignals?.filter(s => s.domain === domain).length || 0;
      const domainAdjustments = adjustments?.filter(a => a.domain === domain).length || 0;

      // Calculate score
      const score = Math.min(100, Math.max(0,
        performance * 0.6 +
        (allocation <= 25 ? 30 : 15) +
        (domainDrift === 0 ? 20 : Math.max(0, 20 - domainDrift * 5))
      ));

      // Determine status
      let status: HealthStatus;
      if (score >= 80) status = 'EXCELLENT';
      else if (score >= 65) status = 'GOOD';
      else if (score >= 50) status = 'FAIR';
      else if (score >= 35) status = 'POOR';
      else status = 'CRITICAL';

      // Identify improvement areas
      const improvementAreas: string[] = [];
      if (performance < 60) improvementAreas.push('Improve KPI performance');
      if (allocation > 30) improvementAreas.push('Consider reducing allocation');
      if (domainDrift > 0) improvementAreas.push(`Resolve ${domainDrift} drift signal(s)`);

      reports.push({
        domain,
        score: Math.round(score * 10) / 10,
        status,
        allocation,
        performance,
        drift_signals: domainDrift,
        improvement_areas: improvementAreas,
        recent_adjustments: domainAdjustments,
      });
    }

    return reports.sort((a, b) => b.score - a.score);
  }

  /**
   * Get refinement cycle history
   */
  async getRefinementHistory(
    organizationId: string,
    periodDays: number
  ): Promise<RefinementHistoryEntry[]> {
    const supabase = await getSupabaseServer();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data, error } = await supabase
      .from('refinement_cycles')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false });

    if (error || !data) return [];

    return data.map(cycle => ({
      cycle_id: cycle.id,
      cycle_number: cycle.cycle_number,
      cycle_type: cycle.cycle_type,
      started_at: cycle.started_at,
      completed_at: cycle.completed_at,
      drift_detected: cycle.drift_detected,
      drift_severity: cycle.drift_severity,
      adjustments_count: cycle.adjustments_count,
      improvement_percent: cycle.improvement_percent,
      status: cycle.status,
    }));
  }

  /**
   * Get horizon plan progress
   */
  async getHorizonProgress(organizationId: string): Promise<HorizonProgressReport[]> {
    const supabase = await getSupabaseServer();

    const { data: plans } = await supabase
      .from('horizon_plans')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['ACTIVE', 'DRAFT'])
      .order('created_at', { ascending: false });

    if (!plans) return [];

    const reports: HorizonProgressReport[] = [];

    for (const plan of plans) {
      // Get step counts
      const { data: steps } = await supabase
        .from('horizon_steps')
        .select('status')
        .eq('horizon_plan_id', plan.id);

      const stepsTotal = steps?.length || 0;
      const stepsCompleted = steps?.filter(s => s.status === 'COMPLETED').length || 0;
      const stepsInProgress = steps?.filter(s => s.status === 'IN_PROGRESS').length || 0;

      // Calculate progress
      const startDate = new Date(plan.start_date);
      const endDate = new Date(plan.end_date);
      const now = new Date();

      const totalDays = plan.days_total;
      const elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const progressPercent = stepsTotal > 0
        ? (stepsCompleted / stepsTotal) * 100
        : 0;

      // Check if on track
      const expectedProgress = (elapsedDays / totalDays) * 100;
      const onTrack = progressPercent >= expectedProgress * 0.8;

      reports.push({
        plan_id: plan.id,
        plan_name: plan.name,
        horizon_type: plan.horizon_type,
        days_total: totalDays,
        days_elapsed: elapsedDays,
        days_remaining: remainingDays,
        progress_percent: Math.round(progressPercent * 10) / 10,
        steps_total: stepsTotal,
        steps_completed: stepsCompleted,
        steps_in_progress: stepsInProgress,
        overall_score: plan.overall_score,
        on_track: onTrack,
      });
    }

    return reports;
  }

  /**
   * Get simulation outcomes summary
   */
  async getSimulationOutcomes(
    organizationId: string,
    periodDays: number
  ): Promise<SimulationOutcomeSummary> {
    const supabase = await getSupabaseServer();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const { data: simulations } = await supabase
      .from('simulation_runs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (!simulations || simulations.length === 0) {
      return {
        total_simulations: 0,
        successful: 0,
        avg_confidence: 0,
        best_path_accuracy: 0,
        recent_simulations: [],
      };
    }

    const successful = simulations.filter(s => s.status === 'COMPLETED').length;
    const avgConfidence = simulations.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / simulations.length;

    return {
      total_simulations: simulations.length,
      successful,
      avg_confidence: Math.round(avgConfidence * 100) / 100,
      best_path_accuracy: 0.75, // Placeholder - would need outcome tracking
      recent_simulations: simulations.slice(0, 5).map(s => ({
        id: s.id,
        created_at: s.created_at,
        simulation_type: s.simulation_type,
        paths_evaluated: s.paths_generated || 0,
        best_expected_value: s.best_expected_value || 0,
      })),
    };
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(
    health: SystemHealthScore,
    domains: DomainHealthReport[],
    history: RefinementHistoryEntry[]
  ): string[] {
    const recommendations: string[] = [];

    // System health recommendations
    if (health.overall_score < 50) {
      recommendations.push('PRIORITY: System health is below 50% - immediate attention required');
    }

    if (health.trend === 'DECLINING') {
      recommendations.push('Performance trend is declining - review recent changes and adjustments');
    }

    // Component-specific recommendations
    if (health.components.drift_health < 60) {
      recommendations.push('Multiple unresolved drift signals detected - schedule drift resolution session');
    }

    if (health.components.balance_health < 60) {
      recommendations.push('Domain balance is suboptimal - consider reallocation of resources');
    }

    // Domain recommendations
    const poorDomains = domains.filter(d => d.status === 'POOR' || d.status === 'CRITICAL');
    for (const domain of poorDomains) {
      recommendations.push(`${domain.domain} domain needs attention: ${domain.improvement_areas.join(', ')}`);
    }

    // Refinement pattern recommendations
    const recentCycles = history.slice(0, 5);
    const driftTriggered = recentCycles.filter(c => c.cycle_type === 'DRIFT_TRIGGERED').length;
    if (driftTriggered >= 3) {
      recommendations.push('High frequency of drift-triggered refinements - consider adjusting targets or strategy');
    }

    return recommendations.slice(0, 10);
  }

  /**
   * Generate system alerts
   */
  private generateAlerts(
    health: SystemHealthScore,
    domains: DomainHealthReport[],
    horizons: HorizonProgressReport[]
  ): Array<{ severity: string; message: string; action: string }> {
    const alerts: Array<{ severity: string; message: string; action: string }> = [];

    // Critical health alerts
    if (health.status === 'CRITICAL') {
      alerts.push({
        severity: 'CRITICAL',
        message: `System health score is ${health.overall_score}/100`,
        action: 'Review all domains and resolve critical drift signals',
      });
    }

    // Domain alerts
    const criticalDomains = domains.filter(d => d.status === 'CRITICAL');
    for (const domain of criticalDomains) {
      alerts.push({
        severity: 'HIGH',
        message: `${domain.domain} domain is in critical state (${domain.score}/100)`,
        action: domain.improvement_areas[0] || 'Review domain strategy',
      });
    }

    // Drift signal alerts
    const highDriftDomains = domains.filter(d => d.drift_signals >= 3);
    for (const domain of highDriftDomains) {
      alerts.push({
        severity: 'MEDIUM',
        message: `${domain.domain} has ${domain.drift_signals} unresolved drift signals`,
        action: 'Resolve drift signals or adjust targets',
      });
    }

    // Horizon progress alerts
    const offTrackPlans = horizons.filter(h => !h.on_track && h.days_remaining > 0);
    for (const plan of offTrackPlans) {
      alerts.push({
        severity: 'MEDIUM',
        message: `${plan.plan_name} is behind schedule (${plan.progress_percent}% complete)`,
        action: 'Review step assignments and timelines',
      });
    }

    return alerts;
  }

  /**
   * Generate quick summary for dashboard
   */
  async getQuickSummary(organizationId: string): Promise<{
    health_score: number;
    health_status: HealthStatus;
    active_signals: number;
    pending_approvals: number;
    active_plans: number;
    recent_improvement: number | null;
  }> {
    const supabase = await getSupabaseServer();

    // Get system health
    const health = await this.calculateSystemHealth(organizationId);

    // Count active signals
    const { count: signalCount } = await supabase
      .from('drift_signals')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('resolved', false);

    // Count pending approvals
    const { count: approvalCount } = await supabase
      .from('reinforcement_adjustments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('operator_approved', null);

    // Count active plans
    const { count: planCount } = await supabase
      .from('horizon_plans')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE');

    // Get recent improvement
    const { data: lastCycle } = await supabase
      .from('refinement_cycles')
      .select('improvement_percent')
      .eq('organization_id', organizationId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      health_score: health.overall_score,
      health_status: health.status,
      active_signals: signalCount || 0,
      pending_approvals: approvalCount || 0,
      active_plans: planCount || 0,
      recent_improvement: lastCycle?.improvement_percent || null,
    };
  }
}

export const strategySummaryReportService = new StrategySummaryReportService();
