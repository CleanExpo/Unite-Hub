/**
 * MCOE Guardrails Service
 * Phase 84: Truth-layer, Early Warning, and policy guardrails
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  OrchestrationSchedule,
  OrchestrationGuardrailResult,
  GuardrailCheck,
  RiskClass,
  Channel,
} from './mcoeTypes';

// Fatigue thresholds
const FATIGUE_WARN_THRESHOLD = 0.5;
const FATIGUE_BLOCK_THRESHOLD = 0.8;

// Minimum hours between posts per channel
const MIN_POST_SPACING: Record<Channel, number> = {
  fb: 6,
  ig: 4,
  tiktok: 3,
  linkedin: 12,
  youtube: 48,
  gmb: 24,
  reddit: 12,
  email: 24,
  x: 2,
};

/**
 * Run all guardrail checks for a schedule
 */
export async function validateSchedule(
  schedule: Partial<OrchestrationSchedule>,
  workspaceId: string
): Promise<OrchestrationGuardrailResult> {
  const checks = {
    early_warning: await checkEarlyWarnings(schedule.client_id!, workspaceId),
    channel_fatigue: await checkChannelFatigue(schedule.client_id!, schedule.channel!, workspaceId),
    policy_compliance: await checkPolicyCompliance(schedule.client_id!, workspaceId),
    truth_layer: checkTruthLayer(schedule),
    timing_conflict: await checkTimingConflict(schedule, workspaceId),
  };

  const blockers = Object.entries(checks)
    .filter(([_, check]) => !check.passed && check.severity === 'high')
    .map(([name, check]) => `${name}: ${check.reason}`);

  const warnings = Object.entries(checks)
    .filter(([_, check]) => !check.passed && check.severity === 'medium')
    .map(([name, check]) => `${name}: ${check.reason}`);

  // Calculate overall risk
  let riskLevel: RiskClass = 'low';
  if (blockers.length > 0) {
    riskLevel = 'high';
  } else if (warnings.length > 1) {
    riskLevel = 'medium';
  }

  return {
    allowed: blockers.length === 0,
    checks,
    risk_level: riskLevel,
    blockers,
    warnings,
  };
}

/**
 * Check early warnings
 */
async function checkEarlyWarnings(
  clientId: string,
  workspaceId: string
): Promise<GuardrailCheck> {
  const supabase = await getSupabaseServer();

  const { data: warnings } = await supabase
    .from('early_warning_events')
    .select('id, warning_type, severity')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId)
    .in('status', ['open', 'acknowledged']);

  if (!warnings || warnings.length === 0) {
    return { passed: true, severity: 'low' };
  }

  const highWarnings = warnings.filter(w => w.severity === 'high');

  if (highWarnings.length > 0) {
    return {
      passed: false,
      reason: `${highWarnings.length} high-severity warning(s) active`,
      severity: 'high',
    };
  }

  const mediumWarnings = warnings.filter(w => w.severity === 'medium');
  if (mediumWarnings.length > 2) {
    return {
      passed: false,
      reason: `Multiple medium-severity warnings (${mediumWarnings.length})`,
      severity: 'medium',
    };
  }

  return {
    passed: true,
    reason: `${warnings.length} warning(s) active but acceptable`,
    severity: 'low',
  };
}

/**
 * Check channel fatigue
 */
async function checkChannelFatigue(
  clientId: string,
  channel: Channel,
  workspaceId: string
): Promise<GuardrailCheck> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('channel_state')
    .select('fatigue_score, last_post_at')
    .eq('client_id', clientId)
    .eq('channel', channel)
    .single();

  if (!state) {
    return {
      passed: true,
      reason: 'No channel state data (first post)',
      severity: 'low',
    };
  }

  // Check fatigue score
  if (state.fatigue_score >= FATIGUE_BLOCK_THRESHOLD) {
    return {
      passed: false,
      reason: `Channel fatigue too high (${Math.round(state.fatigue_score * 100)}%)`,
      severity: 'high',
    };
  }

  if (state.fatigue_score >= FATIGUE_WARN_THRESHOLD) {
    return {
      passed: false,
      reason: `Channel fatigue elevated (${Math.round(state.fatigue_score * 100)}%)`,
      severity: 'medium',
    };
  }

  return { passed: true, severity: 'low' };
}

/**
 * Check policy compliance
 */
async function checkPolicyCompliance(
  clientId: string,
  workspaceId: string
): Promise<GuardrailCheck> {
  const supabase = await getSupabaseServer();

  // Check client agent policy
  const { data: policy } = await supabase
    .from('client_agent_policies')
    .select('agent_enabled, respect_early_warnings, pause_on_high_severity_warning')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!policy) {
    return { passed: true, severity: 'low' };
  }

  if (!policy.agent_enabled) {
    return {
      passed: false,
      reason: 'Agent operations disabled for this client',
      severity: 'high',
    };
  }

  return { passed: true, severity: 'low' };
}

/**
 * Check truth layer compliance
 */
function checkTruthLayer(
  schedule: Partial<OrchestrationSchedule>
): GuardrailCheck {
  // Check for required data
  if (!schedule.content_preview && !schedule.creative_asset_id) {
    return {
      passed: false,
      reason: 'No content or asset specified',
      severity: 'medium',
    };
  }

  return { passed: true, severity: 'low' };
}

/**
 * Check for timing conflicts
 */
async function checkTimingConflict(
  schedule: Partial<OrchestrationSchedule>,
  workspaceId: string
): Promise<GuardrailCheck> {
  const supabase = await getSupabaseServer();

  if (!schedule.scheduled_for || !schedule.channel || !schedule.client_id) {
    return { passed: true, severity: 'low' };
  }

  const scheduledTime = new Date(schedule.scheduled_for);
  const minSpacing = MIN_POST_SPACING[schedule.channel] || 6;

  // Check for posts too close together
  const windowStart = new Date(scheduledTime.getTime() - minSpacing * 60 * 60 * 1000);
  const windowEnd = new Date(scheduledTime.getTime() + minSpacing * 60 * 60 * 1000);

  const { data: nearby } = await supabase
    .from('campaign_orchestration_schedules')
    .select('id, scheduled_for')
    .eq('client_id', schedule.client_id)
    .eq('channel', schedule.channel)
    .neq('id', schedule.id || '')
    .in('status', ['pending', 'ready', 'completed'])
    .gte('scheduled_for', windowStart.toISOString())
    .lte('scheduled_for', windowEnd.toISOString());

  if (nearby && nearby.length > 0) {
    return {
      passed: false,
      reason: `Another ${schedule.channel} post within ${minSpacing}h window`,
      severity: 'medium',
    };
  }

  return { passed: true, severity: 'low' };
}

/**
 * Validate asset against reality data
 */
export async function validateAssetAgainstReality(
  assetId: string,
  clientId: string,
  workspaceId: string
): Promise<{
  valid: boolean;
  confidence: number;
  issues: string[];
}> {
  const supabase = await getSupabaseServer();
  const issues: string[] = [];

  // Get asset
  const { data: asset } = await supabase
    .from('generatedContent')
    .select('metadata')
    .eq('id', assetId)
    .single();

  if (!asset) {
    return {
      valid: false,
      confidence: 0,
      issues: ['Asset not found'],
    };
  }

  // Get reality snapshot
  const { data: reality } = await supabase
    .from('performance_reality_snapshots')
    .select('true_score, perceived_score, confidence')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!reality) {
    issues.push('No performance reality data available');
    return {
      valid: true,
      confidence: 0.5,
      issues,
    };
  }

  // Check for reality gaps
  const gap = Math.abs(reality.true_score - reality.perceived_score);
  if (gap > 0.3) {
    issues.push(`Large reality gap detected (${Math.round(gap * 100)}%)`);
  }

  // Check confidence
  if (reality.confidence < 0.6) {
    issues.push('Low confidence in performance data');
  }

  return {
    valid: issues.length === 0,
    confidence: reality.confidence,
    issues,
  };
}

/**
 * Get guardrail summary for display
 */
export function getGuardrailSummary(result: OrchestrationGuardrailResult): string {
  if (result.allowed && result.warnings.length === 0) {
    return '✓ All guardrails passed';
  }

  if (!result.allowed) {
    return `✗ Blocked: ${result.blockers.join(', ')}`;
  }

  return `⚠ Warnings: ${result.warnings.join(', ')}`;
}
