/**
 * Client Agent Guardrails Service
 * Phase 83: Safety checks before action execution
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  GuardrailResult,
  GuardrailCheck,
  ClientAgentPolicy,
  ActionProposal,
  RiskLevel,
  ContextSnapshot,
} from './clientAgentTypes';
import { isActionAllowed, canAutoExecute } from './clientAgentPolicyService';

/**
 * Run all guardrail checks for an action
 */
export async function checkGuardrails(
  proposal: ActionProposal,
  policy: ClientAgentPolicy,
  context: ContextSnapshot,
  workspaceId: string,
  clientId?: string
): Promise<GuardrailResult> {
  const riskAssessment = assessRisk(proposal, context);

  const checks = {
    policy_check: checkPolicy(proposal, policy),
    risk_check: checkRisk(riskAssessment, policy),
    rate_limit_check: await checkRateLimit(workspaceId, clientId, policy),
    early_warning_check: checkEarlyWarnings(context, policy),
    truth_layer_check: checkTruthLayer(proposal),
  };

  const blockers = Object.values(checks).filter(
    c => !c.passed && c.severity === 'block'
  );

  const warnings = Object.values(checks).filter(
    c => !c.passed && c.severity === 'warn'
  );

  let overall_message = '';
  if (blockers.length > 0) {
    overall_message = `Blocked: ${blockers.map(b => b.reason).join(', ')}`;
  } else if (warnings.length > 0) {
    overall_message = `Warnings: ${warnings.map(w => w.reason).join(', ')}`;
  } else {
    overall_message = 'All checks passed';
  }

  return {
    allowed: blockers.length === 0,
    checks,
    overall_message,
  };
}

/**
 * Check if action is allowed by policy
 */
function checkPolicy(
  proposal: ActionProposal,
  policy: ClientAgentPolicy
): GuardrailCheck {
  if (!policy.agent_enabled) {
    return {
      passed: false,
      reason: 'Agent is disabled for this client',
      severity: 'block',
    };
  }

  if (!isActionAllowed(policy, proposal.action_type)) {
    return {
      passed: false,
      reason: `Action '${proposal.action_type}' is not allowed by policy`,
      severity: 'block',
    };
  }

  return {
    passed: true,
    severity: 'info',
  };
}

/**
 * Assess risk level of action
 */
export function assessRisk(
  proposal: ActionProposal,
  context: ContextSnapshot
): { level: RiskLevel; score: number; factors: Array<{ factor: string; weight: number; description: string }> } {
  let score = 0;
  const factors: Array<{ factor: string; weight: number; description: string }> = [];

  // Base risk by action type
  const baseRisk: Record<string, number> = {
    add_tag: 0.1,
    remove_tag: 0.15,
    create_note: 0.1,
    update_status: 0.2,
    update_score: 0.25,
    schedule_task: 0.3,
    generate_content: 0.35,
    send_followup: 0.5,
    send_notification: 0.6,
  };

  const actionRisk = baseRisk[proposal.action_type] || 0.5;
  score += actionRisk;
  factors.push({
    factor: 'action_type',
    weight: actionRisk,
    description: `Base risk for ${proposal.action_type}`,
  });

  // High-value client adjustment
  if (context.client_profile && context.client_profile.ai_score >= 80) {
    const adjustment = 0.15;
    score += adjustment;
    factors.push({
      factor: 'high_value_client',
      weight: adjustment,
      description: 'Client has high AI score, increased caution',
    });
  }

  // Active warnings adjustment
  const highWarnings = context.early_warnings?.filter(w => w.severity === 'high') || [];
  if (highWarnings.length > 0) {
    const adjustment = 0.2;
    score += adjustment;
    factors.push({
      factor: 'active_warnings',
      weight: adjustment,
      description: `${highWarnings.length} high-severity warnings active`,
    });
  }

  // Low confidence adjustment
  if (proposal.confidence_score && proposal.confidence_score < 0.6) {
    const adjustment = 0.1;
    score += adjustment;
    factors.push({
      factor: 'low_confidence',
      weight: adjustment,
      description: 'Low confidence in action appropriateness',
    });
  }

  // Determine level
  const level: RiskLevel = score <= 0.3 ? 'low' : score <= 0.6 ? 'medium' : 'high';

  return {
    level,
    score: Math.min(score, 1),
    factors,
  };
}

/**
 * Check if risk is acceptable
 */
function checkRisk(
  riskAssessment: { level: RiskLevel; score: number },
  policy: ClientAgentPolicy
): GuardrailCheck {
  if (riskAssessment.level === 'high') {
    return {
      passed: false,
      reason: `High risk action (${Math.round(riskAssessment.score * 100)}%) requires approval`,
      severity: 'warn',
    };
  }

  if (!canAutoExecute(policy, riskAssessment.level)) {
    return {
      passed: false,
      reason: `Risk level '${riskAssessment.level}' exceeds auto-exec threshold`,
      severity: 'warn',
    };
  }

  return {
    passed: true,
    severity: 'info',
  };
}

/**
 * Check rate limits
 */
async function checkRateLimit(
  workspaceId: string,
  clientId: string | undefined,
  policy: ClientAgentPolicy
): Promise<GuardrailCheck> {
  const supabase = await getSupabaseServer();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = supabase
    .from('client_agent_actions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .gte('created_at', today.toISOString())
    .in('approval_status', ['auto_executed', 'approved_executed']);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { count } = await query;

  if ((count || 0) >= policy.max_actions_per_day) {
    return {
      passed: false,
      reason: `Daily limit of ${policy.max_actions_per_day} actions reached`,
      severity: 'block',
    };
  }

  if ((count || 0) >= policy.max_actions_per_day * 0.8) {
    return {
      passed: true,
      reason: `Approaching daily limit (${count}/${policy.max_actions_per_day})`,
      severity: 'warn',
    };
  }

  return {
    passed: true,
    severity: 'info',
  };
}

/**
 * Check early warnings
 */
function checkEarlyWarnings(
  context: ContextSnapshot,
  policy: ClientAgentPolicy
): GuardrailCheck {
  if (!policy.respect_early_warnings) {
    return {
      passed: true,
      severity: 'info',
    };
  }

  const highWarnings = context.early_warnings?.filter(w => w.severity === 'high') || [];

  if (highWarnings.length > 0 && policy.pause_on_high_severity_warning) {
    return {
      passed: false,
      reason: `${highWarnings.length} high-severity early warnings active`,
      severity: 'warn',
    };
  }

  if (context.early_warnings && context.early_warnings.length > 3) {
    return {
      passed: true,
      reason: `Multiple warnings active (${context.early_warnings.length})`,
      severity: 'warn',
    };
  }

  return {
    passed: true,
    severity: 'info',
  };
}

/**
 * Check truth layer compliance
 */
function checkTruthLayer(proposal: ActionProposal): GuardrailCheck {
  // Check confidence
  if (proposal.confidence_score && proposal.confidence_score < 0.5) {
    return {
      passed: false,
      reason: 'Confidence too low for execution',
      severity: 'block',
    };
  }

  // Check for data sources
  if (!proposal.data_sources || proposal.data_sources.length === 0) {
    return {
      passed: true,
      reason: 'No data sources cited - action based on user request',
      severity: 'warn',
    };
  }

  // Check data source reliability
  const avgReliability =
    proposal.data_sources.reduce((sum, ds) => sum + ds.reliability, 0) /
    proposal.data_sources.length;

  if (avgReliability < 0.5) {
    return {
      passed: false,
      reason: 'Data sources have low reliability',
      severity: 'warn',
    };
  }

  return {
    passed: true,
    severity: 'info',
  };
}

/**
 * Get guardrail summary for display
 */
export function getGuardrailSummary(result: GuardrailResult): string {
  const failed = Object.entries(result.checks)
    .filter(([_, check]) => !check.passed)
    .map(([name, check]) => `${name}: ${check.reason}`);

  if (failed.length === 0) {
    return '✓ All guardrails passed';
  }

  return `⚠ ${failed.length} guardrail(s) failed:\n${failed.join('\n')}`;
}
