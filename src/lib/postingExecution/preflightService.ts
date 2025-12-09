/**
 * Preflight Service
 * Phase 87: Run all checks before execution
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  PreflightResult,
  PreflightChecks,
  PreflightCheckResult,
  RunPreflightInput,
  RiskLevel,
  PostingChannel,
} from './postingExecutionTypes';

/**
 * Run all preflight checks before posting execution
 */
export async function runPreflight(input: RunPreflightInput): Promise<PreflightResult> {
  const supabase = await getSupabaseServer();

  // Run all checks in parallel
  const [
    earlyWarningCheck,
    performanceRealityCheck,
    scalingModeCheck,
    clientPolicyCheck,
    fatigueCheck,
    complianceCheck,
    truthLayerCheck,
  ] = await Promise.all([
    checkEarlyWarning(input.clientId, input.workspaceId),
    checkPerformanceReality(input.clientId, input.workspaceId),
    checkScalingMode(input.workspaceId),
    checkClientPolicy(input.clientId, input.channel),
    checkFatigue(input.clientId, input.channel),
    checkCompliance(input.content),
    checkTruthLayer(input.content),
  ]);

  const checks: PreflightChecks = {
    earlyWarning: earlyWarningCheck,
    performanceReality: performanceRealityCheck,
    scalingMode: scalingModeCheck,
    clientPolicy: clientPolicyCheck,
    fatigue: fatigueCheck,
    compliance: complianceCheck,
    truthLayer: truthLayerCheck,
  };

  // Determine overall pass/fail
  const allChecksPassed = Object.values(checks).every(c => c.passed);

  // Calculate confidence score (average of all check scores)
  const scores = Object.values(checks)
    .map(c => c.score || (c.passed ? 100 : 0));
  const confidenceScore = scores.reduce((a, b) => a + b, 0) / scores.length / 100;

  // Determine risk level
  const riskLevel = calculateRiskLevel(confidenceScore, checks);

  // Generate truth notes
  const truthNotes = generateTruthNotes(checks);

  // Find blocking check if any
  let blockedBy: string | undefined;
  let blockReason: string | undefined;

  for (const [name, check] of Object.entries(checks)) {
    if (!check.passed) {
      blockedBy = name;
      blockReason = check.reason;
      break;
    }
  }

  // Save to database
  const { data, error } = await supabase
    .from('posting_preflight_checks')
    .insert({
      schedule_id: input.scheduleId,
      client_id: input.clientId,
      workspace_id: input.workspaceId,
      channel: input.channel,
      checks,
      passed: allChecksPassed,
      early_warning_passed: earlyWarningCheck.passed,
      performance_reality_passed: performanceRealityCheck.passed,
      scaling_mode_passed: scalingModeCheck.passed,
      client_policy_passed: clientPolicyCheck.passed,
      fatigue_check_passed: fatigueCheck.passed,
      compliance_passed: complianceCheck.passed,
      truth_layer_passed: truthLayerCheck.passed,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      truth_notes: truthNotes,
      truth_compliant: truthLayerCheck.passed,
      blocked_by: blockedBy,
      block_reason: blockReason,
      metadata: {
        content_length: input.content.length,
        check_timestamp: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save preflight check:', error);
    throw new Error(`Preflight save failed: ${error.message}`);
  }

  return mapToPreflightResult(data);
}

/**
 * Get preflight by ID
 */
export async function getPreflightById(preflightId: string): Promise<PreflightResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_preflight_checks')
    .select('*')
    .eq('id', preflightId)
    .single();

  if (error || !data) {
return null;
}

  return mapToPreflightResult(data);
}

/**
 * List preflights for workspace
 */
export async function listPreflights(
  workspaceId: string,
  options?: {
    scheduleId?: string;
    clientId?: string;
    passed?: boolean;
    limit?: number;
  }
): Promise<PreflightResult[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('posting_preflight_checks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.scheduleId) {
    query = query.eq('schedule_id', options.scheduleId);
  }

  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  if (options?.passed !== undefined) {
    query = query.eq('passed', options.passed);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list preflights:', error);
    return [];
  }

  return (data || []).map(mapToPreflightResult);
}

// Individual check functions

async function checkEarlyWarning(
  clientId: string,
  workspaceId: string
): Promise<PreflightCheckResult> {
  const supabase = await getSupabaseServer();

  // Check for active critical warnings
  const { data: warnings } = await supabase
    .from('early_warning_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('resolved', false)
    .eq('severity', 'critical')
    .limit(1);

  if (warnings && warnings.length > 0) {
    return {
      passed: false,
      reason: `Active critical warning: ${warnings[0].warning_type}`,
      score: 0,
    };
  }

  return { passed: true, score: 100 };
}

async function checkPerformanceReality(
  clientId: string,
  workspaceId: string
): Promise<PreflightCheckResult> {
  const supabase = await getSupabaseServer();

  // Get latest performance snapshot
  const { data: snapshot } = await supabase
    .from('performance_reality_snapshots')
    .select('overall_confidence, recommendation')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) {
    // No data - pass with caution
    return { passed: true, reason: 'No performance data available', score: 50 };
  }

  const confidence = snapshot.overall_confidence || 0;

  if (confidence < 0.3) {
    return {
      passed: false,
      reason: `Low performance confidence: ${(confidence * 100).toFixed(0)}%`,
      score: confidence * 100,
    };
  }

  return { passed: true, score: confidence * 100 };
}

async function checkScalingMode(workspaceId: string): Promise<PreflightCheckResult> {
  const supabase = await getSupabaseServer();

  // Get scaling config
  const { data: config } = await supabase
    .from('scaling_mode_config')
    .select('current_mode, safe_capacity, active_client_count, freeze_onboarding')
    .eq('workspace_id', workspaceId)
    .single();

  if (!config) {
    return { passed: true, reason: 'No scaling config', score: 50 };
  }

  if (config.freeze_onboarding) {
    return {
      passed: false,
      reason: 'System is frozen - no posting allowed',
      score: 0,
    };
  }

  const utilization = (config.active_client_count / config.safe_capacity) * 100;

  if (utilization > 95) {
    return {
      passed: false,
      reason: `Capacity at ${utilization.toFixed(0)}% - reduce load first`,
      score: 100 - utilization,
    };
  }

  return { passed: true, score: 100 - (utilization * 0.5) };
}

async function checkClientPolicy(
  clientId: string,
  channel: PostingChannel
): Promise<PreflightCheckResult> {
  const supabase = await getSupabaseServer();

  // Check if channel is allowed for client
  const { data: contact } = await supabase
    .from('contacts')
    .select('metadata')
    .eq('id', clientId)
    .single();

  if (!contact) {
    return { passed: false, reason: 'Client not found', score: 0 };
  }

  const blockedChannels = contact.metadata?.blocked_channels || [];

  if (blockedChannels.includes(channel)) {
    return {
      passed: false,
      reason: `Channel ${channel} is blocked for this client`,
      score: 0,
    };
  }

  return { passed: true, score: 100 };
}

async function checkFatigue(
  clientId: string,
  channel: PostingChannel
): Promise<PreflightCheckResult> {
  const supabase = await getSupabaseServer();

  // Count recent posts to this channel
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('posting_executions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('channel', channel)
    .eq('status', 'success')
    .gte('created_at', oneDayAgo);

  const recentPosts = count || 0;

  // Channel-specific limits
  const limits: Record<PostingChannel, number> = {
    fb: 3,
    ig: 5,
    tiktok: 5,
    linkedin: 2,
    youtube: 1,
    gmb: 2,
    reddit: 3,
    email: 2,
    x: 10,
  };

  const limit = limits[channel] || 3;

  if (recentPosts >= limit) {
    return {
      passed: false,
      reason: `Fatigue limit reached: ${recentPosts}/${limit} posts in 24h`,
      score: 0,
    };
  }

  const fatigueScore = 100 - ((recentPosts / limit) * 100);
  return { passed: true, score: fatigueScore };
}

async function checkCompliance(content: string): Promise<PreflightCheckResult> {
  // Check for banned patterns
  const bannedPatterns = [
    /guaranteed\s+results/i,
    /100%\s+success/i,
    /get\s+rich\s+quick/i,
    /\bfree\s+money\b/i,
    /\bclick\s+here\s+now\b/i,
    /\bact\s+now\b/i,
    /\blimited\s+time\s+only\b/i,
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      return {
        passed: false,
        reason: `Compliance violation: banned pattern detected`,
        score: 0,
      };
    }
  }

  // Check content length
  if (content.length < 10) {
    return {
      passed: false,
      reason: 'Content too short',
      score: 0,
    };
  }

  return { passed: true, score: 100 };
}

async function checkTruthLayer(content: string): Promise<PreflightCheckResult> {
  // Check for unverified claims
  const claimPatterns = [
    /\bbest\s+in\s+class\b/i,
    /\b#1\s+rated\b/i,
    /\bindustry\s+leading\b/i,
    /\bworld's\s+first\b/i,
  ];

  const unverifiedClaims: string[] = [];

  for (const pattern of claimPatterns) {
    if (pattern.test(content)) {
      unverifiedClaims.push(pattern.source);
    }
  }

  if (unverifiedClaims.length > 0) {
    return {
      passed: false,
      reason: `Unverified claims detected: ${unverifiedClaims.length} patterns`,
      score: Math.max(0, 100 - (unverifiedClaims.length * 25)),
    };
  }

  return { passed: true, score: 100 };
}

// Helper functions

function calculateRiskLevel(confidenceScore: number, checks: PreflightChecks): RiskLevel {
  const failedChecks = Object.values(checks).filter(c => !c.passed).length;

  if (failedChecks > 0 || confidenceScore < 0.5) {
    return 'high';
  }

  if (confidenceScore < 0.7) {
    return 'medium';
  }

  return 'low';
}

function generateTruthNotes(checks: PreflightChecks): string {
  const notes: string[] = [];

  if (!checks.earlyWarning.passed) {
    notes.push(`Early Warning: ${checks.earlyWarning.reason}`);
  }
  if (!checks.performanceReality.passed) {
    notes.push(`Performance: ${checks.performanceReality.reason}`);
  }
  if (!checks.scalingMode.passed) {
    notes.push(`Scaling: ${checks.scalingMode.reason}`);
  }
  if (!checks.clientPolicy.passed) {
    notes.push(`Policy: ${checks.clientPolicy.reason}`);
  }
  if (!checks.fatigue.passed) {
    notes.push(`Fatigue: ${checks.fatigue.reason}`);
  }
  if (!checks.compliance.passed) {
    notes.push(`Compliance: ${checks.compliance.reason}`);
  }
  if (!checks.truthLayer.passed) {
    notes.push(`Truth: ${checks.truthLayer.reason}`);
  }

  if (notes.length === 0) {
    return 'All checks passed. Safe to execute.';
  }

  return notes.join('\n');
}

function mapToPreflightResult(row: any): PreflightResult {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    channel: row.channel,
    checks: row.checks,
    passed: row.passed,
    confidenceScore: parseFloat(row.confidence_score),
    riskLevel: row.risk_level,
    truthNotes: row.truth_notes,
    truthCompliant: row.truth_compliant,
    blockedBy: row.blocked_by,
    blockReason: row.block_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}
