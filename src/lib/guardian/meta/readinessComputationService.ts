/**
 * Guardian Z01: Readiness Computation Service
 *
 * Evaluates per-tenant readiness for each Guardian capability using
 * existing configuration and metrics. Scores are advisory-only.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { GUARDIAN_CAPABILITIES, GuardianCapabilityDefinition } from './capabilityManifestService';

/**
 * Readiness evaluation result
 */
export interface GuardianCapabilityReadinessResult {
  capabilityKey: string;
  score: number; // 0-100
  status: 'not_configured' | 'partial' | 'ready' | 'advanced';
  details: Record<string, unknown>;
}

/**
 * Tenant-wide readiness summary
 */
export interface GuardianTenantReadinessSummary {
  tenantId: string;
  computedAt: Date;
  overallScore: number;
  overallStatus: 'baseline' | 'operational' | 'mature' | 'network_intelligent';
  capabilities: GuardianCapabilityReadinessResult[];
  categoryAverages: Record<string, number>;
}

/**
 * Evaluate core rules readiness
 */
async function evaluateCoreRulesReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  const { data: rulesCount } = await supabase
    .from('guardian_rules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .eq('is_deleted', false);

  const { data: activeRules } = await supabase
    .from('guardian_rules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .eq('is_enabled', true)
    .eq('is_deleted', false);

  const totalRules = rulesCount?.length ?? 0;
  const activeCount = activeRules?.length ?? 0;

  let score = 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'not_configured';

  if (totalRules === 0) {
    score = 0;
    status = 'not_configured';
  } else if (activeCount > 0 && totalRules < 5) {
    score = 40;
    status = 'partial';
  } else if (activeCount >= 5 && totalRules < 20) {
    score = 70;
    status = 'ready';
  } else {
    score = 90;
    status = 'advanced';
  }

  return {
    capabilityKey: 'guardian.core.rules',
    score,
    status,
    details: {
      totalRules,
      activeRules: activeCount,
      rulesRatio: totalRules > 0 ? (activeCount / totalRules * 100).toFixed(1) : '0',
    },
  };
}

/**
 * Evaluate core alerts readiness
 */
async function evaluateCoreAlertsReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  // Check for alert channels configured
  const { data: channelsCount } = await supabase
    .from('guardian_alert_channels')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .eq('is_enabled', true);

  const channels = channelsCount?.length ?? 0;

  let score = 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'not_configured';

  if (channels === 0) {
    score = 0;
    status = 'not_configured';
  } else if (channels === 1) {
    score = 50;
    status = 'partial';
  } else {
    score = 85;
    status = 'ready';
  }

  return {
    capabilityKey: 'guardian.core.alerts',
    score,
    status,
    details: {
      channelsConfigured: channels,
    },
  };
}

/**
 * Evaluate core incidents readiness
 */
async function evaluateCoreIncidentsReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  // Check for recent incidents
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentIncidents } = await supabase
    .from('guardian_incidents')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .gte('created_at', thirtyDaysAgo);

  const recentCount = recentIncidents?.length ?? 0;

  let score = 50;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'partial';

  if (recentCount > 10) {
    score = 85;
    status = 'ready';
  } else if (recentCount > 0) {
    score = 65;
    status = 'partial';
  } else {
    score = 40;
    status = 'partial';
  }

  return {
    capabilityKey: 'guardian.core.incidents',
    score,
    status,
    details: {
      incidentsLast30d: recentCount,
    },
  };
}

/**
 * Evaluate core risk readiness
 */
async function evaluateCoreRiskReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  // Check if risk engine enabled
  const { data: settings } = await supabase
    .from('guardian_settings')
    .select('risk_engine_enabled')
    .eq('workspace_id', tenantId)
    .single();

  const riskEnabled = settings?.risk_engine_enabled ?? false;

  let score = riskEnabled ? 70 : 20;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = riskEnabled ? 'ready' : 'partial';

  return {
    capabilityKey: 'guardian.core.risk',
    score,
    status,
    details: {
      riskEngineEnabled: riskEnabled,
    },
  };
}

/**
 * Evaluate QA simulation readiness
 */
async function evaluateQaSimulationReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  // Check for simulation runs
  const { data: simRuns } = await supabase
    .from('guardian_qa_simulation_runs')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId);

  const runCount = simRuns?.length ?? 0;

  let score = 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'not_configured';

  if (runCount === 0) {
    score = 0;
    status = 'not_configured';
  } else if (runCount < 5) {
    score = 50;
    status = 'partial';
  } else {
    score = 80;
    status = 'ready';
  }

  return {
    capabilityKey: 'guardian.qa.i_series.simulation',
    score,
    status,
    details: {
      simulationRunsTotal: runCount,
    },
  };
}

/**
 * Evaluate network telemetry readiness
 */
async function evaluateNetworkTelemetryReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  // Check for feature flag and telemetry records
  const { data: settings } = await supabase
    .from('guardian_feature_flags')
    .select('value')
    .eq('workspace_id', tenantId)
    .eq('key', 'enableNetworkTelemetry')
    .single();

  const telemetryEnabled = settings?.value === true;

  const { data: telemetryRecords } = await supabase
    .from('guardian_network_telemetry')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .limit(1);

  const hasTelemetry = (telemetryRecords?.length ?? 0) > 0;

  let score = 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'not_configured';

  if (!telemetryEnabled) {
    score = 0;
    status = 'not_configured';
  } else if (hasTelemetry) {
    score = 85;
    status = 'ready';
  } else {
    score = 40;
    status = 'partial';
  }

  return {
    capabilityKey: 'guardian.network.x01_telemetry',
    score,
    status,
    details: {
      telemetryEnabled,
      hasTelemetryData: hasTelemetry,
    },
  };
}

/**
 * Evaluate network anomalies readiness
 */
async function evaluateNetworkAnomaliesReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  const { data: settings } = await supabase
    .from('guardian_feature_flags')
    .select('value')
    .eq('workspace_id', tenantId)
    .eq('key', 'enableNetworkAnomalies')
    .single();

  const anomaliesEnabled = settings?.value === true;

  const { data: anomalies } = await supabase
    .from('guardian_network_anomalies')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .limit(1);

  const hasAnomalies = (anomalies?.length ?? 0) > 0;

  let score = anomaliesEnabled ? (hasAnomalies ? 85 : 40) : 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = anomaliesEnabled
    ? hasAnomalies
      ? 'ready'
      : 'partial'
    : 'not_configured';

  return {
    capabilityKey: 'guardian.network.x02_anomalies',
    score,
    status,
    details: {
      anomaliesEnabled,
      anomaliesDetected: hasAnomalies,
    },
  };
}

/**
 * Evaluate network early warnings readiness
 */
async function evaluateNetworkEarlyWarningsReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  const { data: settings } = await supabase
    .from('guardian_feature_flags')
    .select('value')
    .eq('workspace_id', tenantId)
    .eq('key', 'enableNetworkEarlyWarnings')
    .single();

  const warningsEnabled = settings?.value === true;

  const { data: warnings } = await supabase
    .from('guardian_network_early_warnings')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .limit(1);

  const hasWarnings = (warnings?.length ?? 0) > 0;

  let score = warningsEnabled ? (hasWarnings ? 85 : 40) : 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = warningsEnabled
    ? hasWarnings
      ? 'ready'
      : 'partial'
    : 'not_configured';

  return {
    capabilityKey: 'guardian.network.x03_early_warnings',
    score,
    status,
    details: {
      warningsEnabled,
      warningsDetected: hasWarnings,
    },
  };
}

/**
 * Evaluate network recommendations readiness
 */
async function evaluateNetworkRecommendationsReadiness(
  tenantId: string
): Promise<GuardianCapabilityReadinessResult> {
  const supabase = getSupabaseServer();

  const { data: recommendations } = await supabase
    .from('guardian_network_recommendations')
    .select('id', { count: 'exact' })
    .eq('workspace_id', tenantId);

  const recCount = recommendations?.length ?? 0;

  let score = 0;
  let status: 'not_configured' | 'partial' | 'ready' | 'advanced' = 'not_configured';

  if (recCount === 0) {
    score = 0;
    status = 'not_configured';
  } else if (recCount < 5) {
    score = 50;
    status = 'partial';
  } else {
    score = 80;
    status = 'ready';
  }

  return {
    capabilityKey: 'guardian.network.x06_recommendations',
    score,
    status,
    details: {
      recommendationsGenerated: recCount,
    },
  };
}

/**
 * Compute readiness for all capabilities for a tenant
 */
export async function computeReadinessForTenant(
  tenantId: string,
  now: Date = new Date()
): Promise<GuardianCapabilityReadinessResult[]> {
  const results: GuardianCapabilityReadinessResult[] = [];

  try {
    // Core capabilities
    results.push(await evaluateCoreRulesReadiness(tenantId));
    results.push(await evaluateCoreAlertsReadiness(tenantId));
    results.push(await evaluateCoreIncidentsReadiness(tenantId));
    results.push(await evaluateCoreRiskReadiness(tenantId));

    // QA capabilities
    results.push(await evaluateQaSimulationReadiness(tenantId));

    // Network capabilities
    results.push(await evaluateNetworkTelemetryReadiness(tenantId));
    results.push(await evaluateNetworkAnomaliesReadiness(tenantId));
    results.push(await evaluateNetworkEarlyWarningsReadiness(tenantId));
    results.push(await evaluateNetworkRecommendationsReadiness(tenantId));
  } catch (err) {
    console.error(`Failed to compute readiness for tenant ${tenantId}:`, err);
    throw err;
  }

  return results;
}

/**
 * Calculate overall readiness summary
 */
function calculateOverallSummary(
  results: GuardianCapabilityReadinessResult[]
): { score: number; status: 'baseline' | 'operational' | 'mature' | 'network_intelligent' } {
  if (results.length === 0) {
    return { score: 0, status: 'baseline' };
  }

  // Calculate weighted average
  let totalWeight = 0;
  let weightedScore = 0;

  for (const result of results) {
    const capability = GUARDIAN_CAPABILITIES.find((c) => c.key === result.capabilityKey);
    const weight = capability?.weight ?? 1.0;

    weightedScore += result.score * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Map to status buckets
  let status: 'baseline' | 'operational' | 'mature' | 'network_intelligent' = 'baseline';

  if (overallScore >= 80) {
    status = 'network_intelligent'; // Has X-series and network intelligence
  } else if (overallScore >= 60) {
    status = 'mature'; // Has QA/chaos + risk
  } else if (overallScore >= 40) {
    status = 'operational'; // Has core + risk
  } else {
    status = 'baseline'; // Only core rules
  }

  return { score: Math.round(overallScore), status };
}

/**
 * Persist readiness scores to database
 */
export async function persistReadinessScores(
  tenantId: string,
  results: GuardianCapabilityReadinessResult[],
  now: Date = new Date()
): Promise<void> {
  const supabase = getSupabaseServer();
  const { score: overallScore, status: overallStatus } = calculateOverallSummary(results);

  // Insert readiness scores for each capability
  for (const result of results) {
    const { error } = await supabase.from('guardian_tenant_readiness_scores').insert({
      tenant_id: tenantId,
      computed_at: now,
      capability_key: result.capabilityKey,
      score: result.score,
      status: result.status,
      details: result.details,
      overall_guardian_score: overallScore,
      overall_status: overallStatus,
      metadata: {},
    });

    if (error) {
      console.error(`Failed to persist readiness for ${result.capabilityKey}:`, error);
      throw error;
    }
  }

  console.log(`✓ Persisted readiness scores for tenant ${tenantId} (overall: ${overallScore}/${overallStatus})`);
}

/**
 * Full readiness computation and persistence
 */
export async function computeAndPersistReadinessForTenant(tenantId: string): Promise<GuardianTenantReadinessSummary> {
  const now = new Date();
  const results = await computeReadinessForTenant(tenantId, now);
  await persistReadinessScores(tenantId, results, now);

  const { score: overallScore, status: overallStatus } = calculateOverallSummary(results);

  // Calculate category averages
  const categoryAverages: Record<string, number> = {};
  for (const category of ['core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance']) {
    const categoryResults = results.filter(
      (r) =>
        GUARDIAN_CAPABILITIES.find((c) => c.key === r.capabilityKey)?.category ===
        (category as GuardianCapabilityDefinition['category'])
    );
    if (categoryResults.length > 0) {
      categoryAverages[category] = Math.round(categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length);
    }
  }

  return {
    tenantId,
    computedAt: now,
    overallScore,
    overallStatus,
    capabilities: results,
    categoryAverages,
  };
}
