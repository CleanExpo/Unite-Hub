/**
 * Horizon Planner Integration
 * Phase 11 Week 5-6: Integrates long-horizon plans with StrategyPlannerService
 *
 * Orchestrates multi-step proposal execution across horizon plan steps.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  longHorizonPlannerService,
  HorizonPlan,
  HorizonStep,
  HorizonType,
} from './longHorizonPlannerService';
import {
  kpiTrackingService,
  KPIDomain,
  KPITrend,
} from './kpiTrackingService';

// Types
export interface ProposalFromHorizon {
  id: string;
  horizon_step_id: string;
  title: string;
  description: string;
  domain: string;
  priority: number;
  estimated_impact: number;
  target_kpis: Record<string, number>;
  dependencies: string[];
  scheduled_start: string;
  scheduled_end: string;
}

export interface HorizonExecutionPlan {
  horizon_plan_id: string;
  proposals: ProposalFromHorizon[];
  execution_order: string[][];
  total_estimated_impact: number;
  risk_assessment: {
    overall_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    risk_factors: string[];
    mitigation_strategies: string[];
  };
}

export interface StepCompletionResult {
  step_id: string;
  actual_kpis: Record<string, number>;
  target_kpis: Record<string, number>;
  achievement_percent: number;
  recommendations: string[];
}

/**
 * Convert horizon plan to executable proposals
 */
export async function convertHorizonToProposals(
  planId: string
): Promise<HorizonExecutionPlan> {
  const planData = await longHorizonPlannerService.getPlan(planId);

  if (!planData) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const { plan, steps, dependencies } = planData;

  // Resolve dependencies to get execution order
  const { criticalPath, parallelGroups } = await longHorizonPlannerService.resolveDependencies(planId);

  // Convert steps to proposals
  const proposals: ProposalFromHorizon[] = steps.map((step) => {
    // Find dependencies for this step
    const stepDeps = dependencies
      .filter((d) => d.target_step_id === step.id)
      .map((d) => d.source_step_id);

    // Calculate scheduled dates
    const startDate = new Date(plan.start_date);
    startDate.setDate(startDate.getDate() + step.start_day);

    const endDate = new Date(plan.start_date);
    endDate.setDate(endDate.getDate() + step.end_day);

    return {
      id: `proposal-${step.id}`,
      horizon_step_id: step.id,
      title: step.name,
      description: step.description || '',
      domain: step.domain,
      priority: calculatePriority(step, criticalPath),
      estimated_impact: estimateStepImpact(step),
      target_kpis: step.target_kpis as Record<string, number>,
      dependencies: stepDeps,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
    };
  });

  // Calculate total estimated impact
  const totalEstimatedImpact = proposals.reduce(
    (sum, p) => sum + p.estimated_impact,
    0
  );

  // Assess risks
  const riskAssessment = assessPlanRisks(steps, dependencies);

  return {
    horizon_plan_id: planId,
    proposals,
    execution_order: parallelGroups,
    total_estimated_impact: totalEstimatedImpact,
    risk_assessment: riskAssessment,
  };
}

/**
 * Record step completion and adjust remaining steps
 */
export async function recordStepCompletion(
  stepId: string,
  actualMetrics: Record<string, number>
): Promise<StepCompletionResult> {
  const supabase = await getSupabaseServer();

  // Get step details
  const { data: step, error: stepError } = await supabase
    .from('horizon_steps')
    .select('*, horizon_plans(*)')
    .eq('id', stepId)
    .single();

  if (stepError || !step) {
    throw new Error(`Step not found: ${stepId}`);
  }

  const targetKpis = (step.target_kpis as Record<string, number>) || {};
  const organizationId = step.horizon_plans.organization_id;

  // Record KPI snapshots
  const metrics = Object.entries(actualMetrics).map(([name, value]) => ({
    name,
    value,
    domain: step.domain as KPIDomain,
  }));

  await kpiTrackingService.recordStepKPI(
    organizationId,
    step.horizon_plan_id,
    stepId,
    metrics
  );

  // Calculate achievement
  let totalAchievement = 0;
  let count = 0;

  for (const [metric, target] of Object.entries(targetKpis)) {
    const actual = actualMetrics[metric];
    if (actual !== undefined && target !== 0) {
      totalAchievement += (actual / target) * 100;
      count++;
    }
  }

  const achievementPercent = count > 0 ? totalAchievement / count : 100;

  // Update step status
  const newStatus = achievementPercent >= 80 ? 'COMPLETED' : 'FAILED';
  await supabase
    .from('horizon_steps')
    .update({
      status: newStatus,
      progress: 100,
      outcome_data: { actual_metrics: actualMetrics, achievement_percent: achievementPercent },
      actual_hours: step.estimated_hours, // Update with actual if provided
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId);

  // Generate recommendations
  const recommendations = generateRecommendations(
    targetKpis,
    actualMetrics,
    achievementPercent
  );

  return {
    step_id: stepId,
    actual_kpis: actualMetrics,
    target_kpis: targetKpis,
    achievement_percent: achievementPercent,
    recommendations,
  };
}

/**
 * Optimize remaining horizon plan based on current performance
 */
export async function optimizeRemainingPlan(
  planId: string
): Promise<{
  adjustments: Array<{
    step_id: string;
    adjustment_type: string;
    reason: string;
    new_values: Record<string, unknown>;
  }>;
  new_projected_impact: number;
}> {
  const supabase = await getSupabaseServer();

  // Get plan and current KPIs
  const planData = await longHorizonPlannerService.getPlan(planId);
  if (!planData) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const { plan, steps } = planData;

  // Get completed steps performance
  const completedSteps = steps.filter((s) => s.status === 'COMPLETED');
  const pendingSteps = steps.filter((s) => s.status === 'PENDING');

  // Calculate average achievement
  let totalAchievement = 0;
  for (const step of completedSteps) {
    const outcome = step.outcome_data as { achievement_percent?: number } | null;
    totalAchievement += outcome?.achievement_percent || 100;
  }
  const avgAchievement = completedSteps.length > 0
    ? totalAchievement / completedSteps.length
    : 100;

  const adjustments: Array<{
    step_id: string;
    adjustment_type: string;
    reason: string;
    new_values: Record<string, unknown>;
  }> = [];

  // If underperforming, adjust remaining steps
  if (avgAchievement < 80) {
    for (const step of pendingSteps) {
      // Reduce targets by 10-20% for realistic achievement
      const currentTargets = step.target_kpis as Record<string, number>;
      const adjustedTargets: Record<string, number> = {};

      for (const [metric, target] of Object.entries(currentTargets)) {
        adjustedTargets[metric] = target * 0.85;
      }

      adjustments.push({
        step_id: step.id,
        adjustment_type: 'TARGET_REDUCTION',
        reason: `Current achievement rate is ${avgAchievement.toFixed(0)}%`,
        new_values: { target_kpis: adjustedTargets },
      });

      // Update in database
      await supabase
        .from('horizon_steps')
        .update({ target_kpis: adjustedTargets })
        .eq('id', step.id);
    }

    // Record adjustment
    await supabase.from('horizon_adjustments').insert({
      horizon_plan_id: planId,
      adjustment_type: 'RESCHEDULE',
      reason: `Performance optimization: ${avgAchievement.toFixed(0)}% avg achievement`,
      description: `Adjusted ${adjustments.length} pending steps`,
      changes_summary: { adjustments },
      affected_step_ids: adjustments.map((a) => a.step_id),
      impact_on_score: -5,
    });
  }

  // Calculate new projected impact
  let newProjectedImpact = 0;
  for (const step of steps) {
    newProjectedImpact += estimateStepImpact(step);
  }
  newProjectedImpact *= avgAchievement / 100;

  return {
    adjustments,
    new_projected_impact: newProjectedImpact,
  };
}

/**
 * Get KPI-driven recommendations for next horizon plan
 */
export async function getNextPlanRecommendations(
  organizationId: string,
  completedPlanId: string
): Promise<{
  recommended_horizon_type: HorizonType;
  priority_domains: KPIDomain[];
  focus_areas: Array<{
    domain: KPIDomain;
    metric: string;
    current_gap: number;
    recommended_target: number;
  }>;
  estimated_improvement: number;
}> {
  // Get plan performance
  const performance = await kpiTrackingService.getPlanKPIPerformance(completedPlanId);

  // Get current KPI trends
  const trends = await kpiTrackingService.getKPITrends(organizationId);

  // Find domains with biggest gaps
  const domainGaps = new Map<KPIDomain, number>();
  const focusAreas: Array<{
    domain: KPIDomain;
    metric: string;
    current_gap: number;
    recommended_target: number;
  }> = [];

  for (const trend of trends) {
    if (!trend.on_track) {
      const domain = trend.domain as KPIDomain;
      const currentGap = domainGaps.get(domain) || 0;
      domainGaps.set(domain, currentGap + Math.abs(trend.gap_to_target));

      focusAreas.push({
        domain,
        metric: trend.metric_name,
        current_gap: trend.gap_to_target,
        recommended_target: trend.target_value * 1.1, // 10% higher for next plan
      });
    }
  }

  // Sort domains by gap
  const priorityDomains = Array.from(domainGaps.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain]) => domain);

  // Recommend horizon type based on performance
  let recommendedHorizonType: HorizonType = 'MEDIUM';
  if (performance.overall_improvement < 5) {
    recommendedHorizonType = 'SHORT'; // Quick iterations needed
  } else if (performance.overall_improvement > 15) {
    recommendedHorizonType = 'LONG'; // Momentum allows longer planning
  }

  // Estimate improvement
  const estimatedImprovement = Math.min(
    25,
    performance.overall_improvement * 1.2
  );

  return {
    recommended_horizon_type: recommendedHorizonType,
    priority_domains: priorityDomains,
    focus_areas: focusAreas.slice(0, 5),
    estimated_improvement: estimatedImprovement,
  };
}

// Helper functions

function calculatePriority(step: HorizonStep, criticalPath: string[]): number {
  // Higher priority for critical path items
  const isCritical = criticalPath.includes(step.id);
  const basePriority = 100 - step.step_number * 5;

  if (isCritical) {
    return Math.min(100, basePriority + 20);
  }

  return basePriority;
}

function estimateStepImpact(step: HorizonStep): number {
  // Estimate impact based on duration and risk
  const baseImpact = step.duration_days * 2;

  const riskMultiplier =
    step.risk_level === 'HIGH'
      ? 1.5
      : step.risk_level === 'MEDIUM'
      ? 1.2
      : 1.0;

  return baseImpact * riskMultiplier;
}

function assessPlanRisks(
  steps: HorizonStep[],
  dependencies: Array<{ source_step_id: string; target_step_id: string }>
): {
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_factors: string[];
  mitigation_strategies: string[];
} {
  const riskFactors: string[] = [];
  const mitigationStrategies: string[] = [];

  // Check for high-risk steps
  const highRiskSteps = steps.filter((s) => s.risk_level === 'HIGH');
  if (highRiskSteps.length > steps.length * 0.3) {
    riskFactors.push(`${highRiskSteps.length} high-risk steps (${((highRiskSteps.length / steps.length) * 100).toFixed(0)}%)`);
    mitigationStrategies.push('Consider breaking high-risk steps into smaller tasks');
  }

  // Check for dependency chains
  const stepsWithManyDeps = new Map<string, number>();
  for (const dep of dependencies) {
    const count = stepsWithManyDeps.get(dep.target_step_id) || 0;
    stepsWithManyDeps.set(dep.target_step_id, count + 1);
  }

  const complexSteps = Array.from(stepsWithManyDeps.entries()).filter(
    ([, count]) => count > 3
  );
  if (complexSteps.length > 0) {
    riskFactors.push(`${complexSteps.length} steps with 4+ dependencies`);
    mitigationStrategies.push('Simplify dependency chains where possible');
  }

  // Check time pressure
  const avgDuration =
    steps.reduce((sum, s) => sum + s.duration_days, 0) / steps.length;
  if (avgDuration < 3) {
    riskFactors.push('Very short average step duration');
    mitigationStrategies.push('Allow buffer time for unexpected delays');
  }

  // Determine overall risk
  let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (riskFactors.length >= 3) {
    overallRisk = 'HIGH';
  } else if (riskFactors.length >= 1) {
    overallRisk = 'MEDIUM';
  }

  return {
    overall_risk: overallRisk,
    risk_factors: riskFactors,
    mitigation_strategies: mitigationStrategies,
  };
}

function generateRecommendations(
  targetKpis: Record<string, number>,
  actualMetrics: Record<string, number>,
  achievementPercent: number
): string[] {
  const recommendations: string[] = [];

  if (achievementPercent < 50) {
    recommendations.push('Consider reducing scope for future steps');
    recommendations.push('Review resource allocation and dependencies');
  } else if (achievementPercent < 80) {
    recommendations.push('Minor adjustments needed to meet targets');
  } else if (achievementPercent > 120) {
    recommendations.push('Consider setting more ambitious targets');
  }

  // Specific metric recommendations
  for (const [metric, target] of Object.entries(targetKpis)) {
    const actual = actualMetrics[metric];
    if (actual !== undefined) {
      const ratio = actual / target;
      if (ratio < 0.5) {
        recommendations.push(`Focus on ${metric}: achieved only ${(ratio * 100).toFixed(0)}% of target`);
      }
    }
  }

  return recommendations.slice(0, 5);
}
