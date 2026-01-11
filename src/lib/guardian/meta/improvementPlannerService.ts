/**
 * Z12 Improvement Planner Service
 * Derives recommended improvement actions from Z-series patterns
 * Deterministic, non-AI recommendations from Z09 playbooks and Z-series meta signals
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Recommended improvement action
 */
export interface RecommendedAction {
  actionKey: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedPlaybookKeys: string[];
  relatedGoalKpiKeys: string[];
  expectedImpact: any;
  rationale: string;
}

/**
 * Improvement pattern
 */
export interface ImprovementPattern {
  patternType: string; // 'low_readiness', 'high_churn', 'poor_adoption', etc.
  severity: 'warning' | 'critical';
  affectedDomains: string[];
  summary: string;
  suggestedPlaybooks: string[];
}

/**
 * Derive improvement recommendations from Z-series patterns
 * Deterministic, pattern-driven (no AI)
 */
export async function deriveImprovementRecommendations(
  tenantId: string
): Promise<{
  patterns: ImprovementPattern[];
  recommendedActions: RecommendedAction[];
}> {
  const supabase = getSupabaseServer();

  const patterns: ImprovementPattern[] = [];
  const actionsByKey = new Map<string, RecommendedAction>();

  // Analyze Z01 Readiness
  try {
    const { data: readiness } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score, details')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (readiness && readiness.overall_guardian_score < 50) {
      patterns.push({
        patternType: 'low_readiness',
        severity: 'critical',
        affectedDomains: ['readiness', 'capability'],
        summary: 'Guardian readiness is below 50% threshold. Significant capability gaps detected.',
        suggestedPlaybooks: [
          'capability_foundation',
          'alert_rule_refinement',
          'correlation_modeling_intro',
        ],
      });

      actionsByKey.set('improve_readiness_foundation', {
        actionKey: 'improve_readiness_foundation',
        title: 'Establish Guardian Foundation',
        description:
          'Build core Guardian capabilities: alerting, correlation, incident response. Follow capability foundation playbook.',
        priority: 'critical',
        relatedPlaybookKeys: ['capability_foundation'],
        relatedGoalKpiKeys: ['readiness_target_60pct'],
        expectedImpact: {
          readiness: { delta: 20, target: 70 },
          capabilities: { alert_quality: 15, correlation: 20 },
        },
        rationale: 'Low readiness score indicates missing fundamental capabilities',
      });
    }

    if (readiness && readiness.overall_guardian_score >= 50 && readiness.overall_guardian_score < 75) {
      patterns.push({
        patternType: 'medium_readiness',
        severity: 'warning',
        affectedDomains: ['readiness'],
        summary: 'Guardian readiness in improvement zone (50-75%). Opportunities to advance.',
        suggestedPlaybooks: ['advanced_correlation', 'incident_automation'],
      });

      actionsByKey.set('advance_readiness_maturity', {
        actionKey: 'advance_readiness_maturity',
        title: 'Advance to Mature Guardian',
        description:
          'Refine correlation rules, automate incident enrichment, improve response workflows.',
        priority: 'high',
        relatedPlaybookKeys: ['advanced_correlation', 'incident_automation'],
        relatedGoalKpiKeys: ['readiness_target_75pct'],
        expectedImpact: {
          readiness: { delta: 15, target: 75 },
          correlation: { delta: 10 },
          automation: { delta: 10 },
        },
        rationale: 'Readiness score in range for targeted maturity improvements',
      });
    }
  } catch {}

  // Analyze Z02/Z05 Adoption
  try {
    const { data: adoption } = await supabase
      .from('guardian_tenant_adoption_scores')
      .select('adoption_rate, details')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (adoption && adoption.adoption_rate < 40) {
      patterns.push({
        patternType: 'low_adoption',
        severity: 'critical',
        affectedDomains: ['adoption', 'user_engagement'],
        summary: 'User adoption rate below 40%. Limited platform utilization.',
        suggestedPlaybooks: ['adoption_rollout_phase_1', 'team_engagement'],
      });

      actionsByKey.set('launch_adoption_campaign', {
        actionKey: 'launch_adoption_campaign',
        title: 'Launch Adoption Campaign',
        description:
          'Execute phased adoption rollout: training, incentives, feedback loops. Use adoption_rollout_phase_1 playbook.',
        priority: 'critical',
        relatedPlaybookKeys: ['adoption_rollout_phase_1', 'team_engagement'],
        relatedGoalKpiKeys: ['adoption_rate_target_60pct'],
        expectedImpact: {
          adoption: { delta: 30, target: 60 },
          engagement: { delta: 25 },
        },
        rationale: 'Low adoption indicates need for coordinated rollout campaign',
      });
    }

    if (adoption && adoption.adoption_rate >= 40 && adoption.adoption_rate < 70) {
      patterns.push({
        patternType: 'moderate_adoption',
        severity: 'warning',
        affectedDomains: ['adoption'],
        summary: 'Adoption rate in moderate range (40-70%). Room for growth.',
        suggestedPlaybooks: ['adoption_rollout_phase_2', 'advanced_features'],
      });

      actionsByKey.set('expand_adoption_reach', {
        actionKey: 'expand_adoption_reach',
        title: 'Expand Adoption to 70%+',
        description:
          'Target remaining user segments, introduce advanced features, showcase ROI. Follow phase 2 playbook.',
        priority: 'high',
        relatedPlaybookKeys: ['adoption_rollout_phase_2', 'advanced_features'],
        relatedGoalKpiKeys: ['adoption_rate_target_70pct'],
        expectedImpact: {
          adoption: { delta: 20, target: 70 },
          engagement: { delta: 15 },
          feature_usage: { delta: 10 },
        },
        rationale: 'Moderate adoption ready for targeted expansion',
      });
    }
  } catch {}

  // Analyze Z03 Editions
  try {
    const { data: editions } = await supabase
      .from('guardian_tenant_editions_fit')
      .select('edition_key, fit_score, description')
      .eq('tenant_id', tenantId)
      .order('fit_score', { ascending: false })
      .limit(1)
      .single();

    if (editions && editions.fit_score < 50) {
      patterns.push({
        patternType: 'poor_edition_fit',
        severity: 'warning',
        affectedDomains: ['editions', 'product_fit'],
        summary: `Current edition (${editions.edition_key}) has poor fit (${editions.fit_score}%). Explore alternatives.`,
        suggestedPlaybooks: ['edition_evaluation', 'edition_migration'],
      });

      actionsByKey.set('evaluate_edition_upgrade', {
        actionKey: 'evaluate_edition_upgrade',
        title: 'Evaluate Edition Upgrade',
        description: `Assess Guardian editions for better fit. Current edition fit score is ${editions.fit_score}%. Use edition_evaluation playbook.`,
        priority: 'medium',
        relatedPlaybookKeys: ['edition_evaluation'],
        relatedGoalKpiKeys: ['edition_fit_target_70pct'],
        expectedImpact: {
          edition_fit: { delta: 15, target: 70 },
          capability_coverage: { delta: 10 },
        },
        rationale: 'Low edition fit indicates potential for better product alignment',
      });
    }
  } catch {}

  // Analyze Z08 Goals/KPIs
  try {
    const { data: goals } = await supabase
      .from('guardian_meta_program_goals')
      .select('status, goal_key')
      .eq('tenant_id', tenantId);

    const behind = (goals || []).filter((g) => g.status === 'behind_track').length;
    const onTrack = (goals || []).filter((g) => g.status === 'on_track').length;
    const total = (goals || []).length;

    if (total > 0 && behind > total * 0.3) {
      patterns.push({
        patternType: 'below_target_goals',
        severity: 'warning',
        affectedDomains: ['goals_okrs', 'performance'],
        summary: `${behind} of ${total} goals are behind track. Performance improvement needed.`,
        suggestedPlaybooks: ['goal_acceleration', 'okr_refinement'],
      });

      actionsByKey.set('accelerate_goal_achievement', {
        actionKey: 'accelerate_goal_achievement',
        title: 'Accelerate Goal Achievement',
        description:
          'Implement tactics to bring behind-track goals back on schedule. Review goal definitions and resource allocation.',
        priority: 'high',
        relatedPlaybookKeys: ['goal_acceleration', 'okr_refinement'],
        relatedGoalKpiKeys: ['on_track_goal_pct_target_80pct'],
        expectedImpact: {
          on_track_goals: { delta: 15, targetPct: 80 },
          time_to_goal: { delta: -10 },
        },
        rationale: `${behind} goals behind track; acceleration needed`,
      });
    }
  } catch {}

  return {
    patterns,
    recommendedActions: Array.from(actionsByKey.values()),
  };
}
