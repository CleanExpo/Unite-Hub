/**
 * AMPE Safety Service
 * Phase 85: Applies all guardrails before execution
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  PostingContext,
  SafetyCheck,
  SafetyCheckResults,
  RiskLevel,
} from './postingTypes';

/**
 * Run all safety checks before posting
 */
export async function runSafetyChecks(
  context: PostingContext
): Promise<SafetyCheckResults> {
  const checks: SafetyCheck[] = [];
  const warnings: string[] = [];

  // 1. Check if engine is enabled
  checks.push(checkEngineEnabled(context));

  // 2. Check Early Warning conditions
  const warningCheck = await checkEarlyWarnings(context);
  checks.push(warningCheck);
  if (!warningCheck.passed && warningCheck.severity === 'error') {
    return buildResults(checks, warnings, warningCheck.name);
  }

  // 3. Check confidence threshold
  const confidenceCheck = checkConfidenceThreshold(context);
  checks.push(confidenceCheck);

  // 4. Check channel fatigue
  const fatigueCheck = checkChannelFatigue(context);
  checks.push(fatigueCheck);
  if (!fatigueCheck.passed) {
    warnings.push(fatigueCheck.reason || 'Channel fatigue detected');
  }

  // 5. Check risk-based approval
  const approvalCheck = checkApprovalRequirements(context);
  checks.push(approvalCheck);

  // 6. Check rate limits
  const rateLimitCheck = await checkRateLimits(context);
  checks.push(rateLimitCheck);

  // 7. Check channel connection
  const connectionCheck = await checkChannelConnection(context);
  checks.push(connectionCheck);

  // 8. Check truth layer compliance
  const truthCheck = checkTruthCompliance(context);
  checks.push(truthCheck);

  return buildResults(checks, warnings);
}

/**
 * Determine if publishing is allowed based on safety results
 */
export function isPublishAllowed(results: SafetyCheckResults): boolean {
  return results.all_passed;
}

/**
 * Check if engine is globally/workspace enabled
 */
function checkEngineEnabled(context: PostingContext): SafetyCheck {
  const { config } = context;

  if (!config.engine_enabled) {
    return {
      name: 'engine_enabled',
      passed: false,
      reason: 'Posting engine is disabled',
      severity: 'error',
    };
  }

  return {
    name: 'engine_enabled',
    passed: true,
    severity: 'info',
  };
}

/**
 * Check for active Early Warnings
 */
async function checkEarlyWarnings(context: PostingContext): Promise<SafetyCheck> {
  const { config, schedule } = context;

  if (!config.block_during_warnings) {
    return {
      name: 'early_warnings',
      passed: true,
      reason: 'Warning blocking disabled',
      severity: 'info',
    };
  }

  const supabase = await getSupabaseServer();

  // Check for active high/critical warnings for this client
  const { data: warnings } = await supabase
    .from('early_warning_events')
    .select('id, severity, type, message')
    .eq('client_id', schedule.client_id)
    .eq('status', 'active')
    .in('severity', ['high', 'critical'])
    .limit(5);

  if (warnings && warnings.length > 0) {
    const criticalWarning = warnings.find(w => w.severity === 'critical');
    return {
      name: 'early_warnings',
      passed: false,
      reason: `Active ${criticalWarning ? 'critical' : 'high'} warning: ${warnings[0].message}`,
      severity: 'error',
    };
  }

  return {
    name: 'early_warnings',
    passed: true,
    severity: 'info',
  };
}

/**
 * Check confidence threshold
 */
function checkConfidenceThreshold(context: PostingContext): SafetyCheck {
  const { config, schedule } = context;
  const confidence = schedule.metadata?.confidence_score as number || 0.8;

  if (confidence < config.min_confidence_score) {
    return {
      name: 'confidence_threshold',
      passed: false,
      reason: `Confidence ${(confidence * 100).toFixed(0)}% below threshold ${(config.min_confidence_score * 100).toFixed(0)}%`,
      severity: 'warning',
    };
  }

  return {
    name: 'confidence_threshold',
    passed: true,
    reason: `Confidence ${(confidence * 100).toFixed(0)}%`,
    severity: 'info',
  };
}

/**
 * Check channel fatigue levels
 */
function checkChannelFatigue(context: PostingContext): SafetyCheck {
  const { config, channelState } = context;

  if (!channelState) {
    return {
      name: 'channel_fatigue',
      passed: true,
      reason: 'No channel state available',
      severity: 'info',
    };
  }

  if (channelState.fatigue_score >= config.max_fatigue_score) {
    return {
      name: 'channel_fatigue',
      passed: false,
      reason: `Channel fatigue ${(channelState.fatigue_score * 100).toFixed(0)}% exceeds threshold`,
      severity: 'warning',
    };
  }

  return {
    name: 'channel_fatigue',
    passed: true,
    reason: `Fatigue ${(channelState.fatigue_score * 100).toFixed(0)}%`,
    severity: 'info',
  };
}

/**
 * Check risk-based approval requirements
 */
function checkApprovalRequirements(context: PostingContext): SafetyCheck {
  const { config, schedule } = context;
  const riskLevel = schedule.risk_level;

  // Check if approval is required based on risk
  if (riskLevel === 'high' && config.require_approval_high) {
    return {
      name: 'approval_required',
      passed: false,
      reason: 'High-risk schedule requires approval',
      severity: 'warning',
    };
  }

  if (riskLevel === 'medium' && config.require_approval_medium) {
    return {
      name: 'approval_required',
      passed: false,
      reason: 'Medium-risk schedule requires approval',
      severity: 'warning',
    };
  }

  // Low risk with auto-publish disabled
  if (riskLevel === 'low' && !config.auto_publish_low_risk) {
    return {
      name: 'approval_required',
      passed: false,
      reason: 'Auto-publish disabled for low-risk',
      severity: 'info',
    };
  }

  return {
    name: 'approval_required',
    passed: true,
    severity: 'info',
  };
}

/**
 * Check rate limits
 */
async function checkRateLimits(context: PostingContext): Promise<SafetyCheck> {
  const { config, schedule } = context;
  const supabase = await getSupabaseServer();

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check hourly limit
  const { count: hourlyCount } = await supabase
    .from('posting_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', schedule.workspace_id)
    .gte('attempted_at', hourAgo)
    .in('status', ['published', 'draft_created']);

  if ((hourlyCount || 0) >= config.max_posts_per_hour) {
    return {
      name: 'rate_limit',
      passed: false,
      reason: `Hourly limit reached (${hourlyCount}/${config.max_posts_per_hour})`,
      severity: 'warning',
    };
  }

  // Check daily limit
  const { count: dailyCount } = await supabase
    .from('posting_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', schedule.workspace_id)
    .gte('attempted_at', dayAgo)
    .in('status', ['published', 'draft_created']);

  if ((dailyCount || 0) >= config.max_posts_per_day) {
    return {
      name: 'rate_limit',
      passed: false,
      reason: `Daily limit reached (${dailyCount}/${config.max_posts_per_day})`,
      severity: 'warning',
    };
  }

  return {
    name: 'rate_limit',
    passed: true,
    reason: `${dailyCount || 0}/${config.max_posts_per_day} today`,
    severity: 'info',
  };
}

/**
 * Check if channel is connected
 */
async function checkChannelConnection(context: PostingContext): Promise<SafetyCheck> {
  const { schedule } = context;
  const supabase = await getSupabaseServer();

  const { data: tokens } = await supabase
    .from('channel_tokens')
    .select('channels_connected')
    .eq('client_id', schedule.client_id)
    .single();

  if (!tokens || !tokens.channels_connected.includes(schedule.channel)) {
    return {
      name: 'channel_connection',
      passed: false,
      reason: `${schedule.channel.toUpperCase()} not connected`,
      severity: 'error',
    };
  }

  return {
    name: 'channel_connection',
    passed: true,
    reason: `${schedule.channel.toUpperCase()} connected`,
    severity: 'info',
  };
}

/**
 * Check truth layer compliance
 */
function checkTruthCompliance(context: PostingContext): SafetyCheck {
  const { schedule } = context;
  const truthCompliant = schedule.metadata?.truth_compliant as boolean ?? true;

  if (!truthCompliant) {
    return {
      name: 'truth_compliance',
      passed: false,
      reason: 'Content not truth-layer compliant',
      severity: 'error',
    };
  }

  return {
    name: 'truth_compliance',
    passed: true,
    severity: 'info',
  };
}

/**
 * Build final safety check results
 */
function buildResults(
  checks: SafetyCheck[],
  warnings: string[],
  blockedBy?: string
): SafetyCheckResults {
  const allPassed = checks.every(c => c.passed || c.severity === 'info');
  const errorCheck = checks.find(c => !c.passed && c.severity === 'error');

  return {
    all_passed: allPassed,
    checks,
    blocked_by: blockedBy || errorCheck?.name,
    warnings,
    timestamp: new Date().toISOString(),
  };
}
