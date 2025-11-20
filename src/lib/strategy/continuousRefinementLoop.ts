/**
 * Continuous Refinement Loop
 * Phase 11 Week 7-8: Integration with longHorizonPlannerService
 *
 * Orchestrates the refinement cycle for continuous improvement.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { strategyRefinementService, RefinementCycle, DriftAnalysisResult } from './strategyRefinementService';
import { crossDomainCoordinatorService, BalanceAnalysis } from './crossDomainCoordinatorService';
import { reinforcementAdjustmentEngine, ReinforcementSignal } from './reinforcementAdjustmentEngine';

export interface RefinementLoopConfig {
  auto_start_on_drift?: boolean;
  auto_apply_low_severity?: boolean;
  balance_check_interval_days?: number;
  performance_threshold?: number;
}

export interface RefinementLoopResult {
  cycle: RefinementCycle;
  drift_analysis: DriftAnalysisResult;
  balance_analysis: BalanceAnalysis;
  adjustments_generated: number;
  auto_applied: number;
  requires_approval: number;
  recommendations: string[];
}

/**
 * Run a complete refinement loop for an organization
 */
export async function runRefinementLoop(
  organizationId: string,
  horizonPlanId?: string,
  config?: RefinementLoopConfig
): Promise<RefinementLoopResult> {
  const cfg: Required<RefinementLoopConfig> = {
    auto_start_on_drift: false,
    auto_apply_low_severity: false,
    balance_check_interval_days: 7,
    performance_threshold: 70,
    ...config,
  };

  // 1. Start refinement cycle
  const cycle = await strategyRefinementService.startRefinementCycle(
    organizationId,
    'SCHEDULED',
    horizonPlanId
  );

  // 2. Analyze for drift
  const driftAnalysis = await strategyRefinementService.analyzeForDrift(
    organizationId,
    cycle.id
  );

  // 3. Analyze domain balance
  const balanceAnalysis = await crossDomainCoordinatorService.analyzeBalance(
    organizationId,
    cycle.id
  );

  // 4. Generate adjustments based on findings
  let adjustmentsGenerated = 0;
  let autoApplied = 0;
  let requiresApproval = 0;

  // Process drift signals
  for (const signal of driftAnalysis.signals) {
    const signals: ReinforcementSignal[] = [
      {
        source: 'EXECUTION',
        strength: signal.drift_direction === 'BELOW' ? -0.5 : 0.5,
        confidence: 0.8,
        reason: `${signal.severity} drift detected`,
        data: { drift_percent: signal.drift_percent },
      },
    ];

    // Generate historical signals for context
    if (signal.metric_name) {
      const historicalSignals = await reinforcementAdjustmentEngine.generateHistoricalSignals(
        organizationId,
        signal.domain,
        signal.metric_name
      );
      signals.push(...historicalSignals);
    }

    const adjustment = await reinforcementAdjustmentEngine.generateAdjustment(
      {
        organization_id: organizationId,
        refinement_cycle_id: cycle.id,
        target: 'KPI_TARGET',
        domain: signal.domain,
        trigger_reason: `Drift signal: ${signal.severity} ${signal.signal_type}`,
        evidence: [{ type: 'drift_signal', data: signal }],
      },
      signals
    );

    adjustmentsGenerated++;

    // Auto-apply low severity if configured
    if (cfg.auto_apply_low_severity && signal.auto_correctable && signal.severity === 'LOW') {
      await reinforcementAdjustmentEngine.applyAdjustment(adjustment.id);
      autoApplied++;
    } else {
      requiresApproval++;
    }
  }

  // Process balance recommendations
  if (balanceAnalysis.over_optimized.length > 0 || balanceAnalysis.under_invested.length > 0) {
    for (const domain of balanceAnalysis.over_optimized) {
      const adjustment = await reinforcementAdjustmentEngine.generateAdjustment(
        {
          organization_id: organizationId,
          refinement_cycle_id: cycle.id,
          target: 'DOMAIN',
          domain,
          trigger_reason: `Over-optimized domain: ${domain}`,
        },
        [
          {
            source: 'EXECUTION',
            strength: -0.3,
            confidence: 0.7,
            reason: 'Over-investment with diminishing returns',
            data: { allocation: balanceAnalysis.current_allocations[domain as keyof typeof balanceAnalysis.current_allocations] },
          },
        ]
      );

      adjustmentsGenerated++;
      requiresApproval++;
    }

    for (const domain of balanceAnalysis.under_invested) {
      const adjustment = await reinforcementAdjustmentEngine.generateAdjustment(
        {
          organization_id: organizationId,
          refinement_cycle_id: cycle.id,
          target: 'DOMAIN',
          domain,
          trigger_reason: `Under-invested domain: ${domain}`,
        },
        [
          {
            source: 'EXECUTION',
            strength: 0.3,
            confidence: 0.7,
            reason: 'Potential for improvement with increased investment',
            data: { performance: balanceAnalysis.current_performance[domain as keyof typeof balanceAnalysis.current_performance] },
          },
        ]
      );

      adjustmentsGenerated++;
      requiresApproval++;
    }
  }

  // 5. Generate recommendations
  const recommendations: string[] = [];

  if (driftAnalysis.overall_severity === 'CRITICAL') {
    recommendations.push('URGENT: Critical drift detected - immediate attention required');
  }

  if (driftAnalysis.auto_correctable_count > 0 && !cfg.auto_apply_low_severity) {
    recommendations.push(
      `${driftAnalysis.auto_correctable_count} auto-correctable signals available - consider enabling auto-apply`
    );
  }

  if (balanceAnalysis.balance_score < 60) {
    recommendations.push(
      `Domain balance score is ${balanceAnalysis.balance_score.toFixed(0)}/100 - rebalancing recommended`
    );
  }

  if (balanceAnalysis.dependency_conflicts.length > 0) {
    recommendations.push(
      `${balanceAnalysis.dependency_conflicts.length} dependency conflicts detected - review cross-domain strategy`
    );
  }

  // Add recommended actions from drift analysis
  for (const action of driftAnalysis.recommended_actions.slice(0, 3)) {
    recommendations.push(`${action.domain}: ${action.action}`);
  }

  // 6. Complete the cycle
  const completedCycle = await strategyRefinementService.completeRefinementCycle(
    cycle.id,
    adjustmentsGenerated,
    {
      drift_signals: driftAnalysis.signals.length,
      balance_score: balanceAnalysis.balance_score,
      auto_applied: autoApplied,
      requires_approval: requiresApproval,
    },
    balanceAnalysis.balance_score
  );

  return {
    cycle: completedCycle,
    drift_analysis: driftAnalysis,
    balance_analysis: balanceAnalysis,
    adjustments_generated: adjustmentsGenerated,
    auto_applied: autoApplied,
    requires_approval: requiresApproval,
    recommendations,
  };
}

/**
 * Check if refinement is needed based on horizon plan performance
 */
export async function checkRefinementNeeded(
  organizationId: string,
  horizonPlanId: string
): Promise<{
  needed: boolean;
  reasons: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}> {
  const supabase = await getSupabaseServer();
  const reasons: string[] = [];

  // Check for overdue steps
  const { data: overdueSteps } = await supabase
    .from('horizon_steps')
    .select('*')
    .eq('horizon_plan_id', horizonPlanId)
    .eq('status', 'IN_PROGRESS');

  if (overdueSteps && overdueSteps.length > 0) {
    reasons.push(`${overdueSteps.length} steps currently in progress - check for delays`);
  }

  // Check last refinement
  const { data: lastCycle } = await supabase
    .from('refinement_cycles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('horizon_plan_id', horizonPlanId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastCycle) {
    reasons.push('No refinement cycle has been run for this plan');
  } else {
    const daysSinceLastCycle = Math.ceil(
      (Date.now() - new Date(lastCycle.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCycle > 7) {
      reasons.push(`Last refinement was ${daysSinceLastCycle} days ago`);
    }
  }

  // Check for unresolved drift signals
  const { data: unresolvedSignals } = await supabase
    .from('drift_signals')
    .select('severity')
    .eq('organization_id', organizationId)
    .eq('resolved', false);

  if (unresolvedSignals && unresolvedSignals.length > 0) {
    const criticalCount = unresolvedSignals.filter(s => s.severity === 'CRITICAL').length;
    const highCount = unresolvedSignals.filter(s => s.severity === 'HIGH').length;

    if (criticalCount > 0) {
      reasons.push(`${criticalCount} CRITICAL unresolved drift signals`);
    }
    if (highCount > 0) {
      reasons.push(`${highCount} HIGH severity unresolved signals`);
    }
  }

  // Check balance
  const balanceNeeded = await crossDomainCoordinatorService.needsRebalancing(organizationId);
  if (balanceNeeded.needed) {
    reasons.push(balanceNeeded.reason || 'Domain rebalancing needed');
  }

  // Determine urgency
  let urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (unresolvedSignals?.some(s => s.severity === 'CRITICAL')) {
    urgency = 'HIGH';
  } else if (unresolvedSignals?.some(s => s.severity === 'HIGH') || balanceNeeded.needed) {
    urgency = 'MEDIUM';
  }

  return {
    needed: reasons.length > 0,
    reasons,
    urgency,
  };
}

/**
 * Schedule automatic refinement checks
 */
export async function scheduleRefinementCheck(
  organizationId: string,
  horizonPlanId: string,
  intervalDays: number = 7
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Update plan with next check date
  const nextCheck = new Date();
  nextCheck.setDate(nextCheck.getDate() + intervalDays);

  await supabase
    .from('horizon_plans')
    .update({
      next_roll_at: nextCheck.toISOString(),
    })
    .eq('id', horizonPlanId);
}
