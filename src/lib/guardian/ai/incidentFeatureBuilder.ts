/**
 * H04: Incident Feature Builder
 * Computes aggregate-only features per incident for predictive scoring
 *
 * Features extracted:
 * - alert_count_1h / 24h: Count of linked/overlapping alerts
 * - unique_rule_count: Number of distinct rules involved
 * - correlation_cluster_count: Related clusters (if any)
 * - risk_score_latest / risk_delta_24h: Risk context
 * - notification_failure_rate: Notification delivery issues
 * - anomaly_event_count: Related anomaly events (if H02 present)
 * - incident_age_minutes / reopen_count: Incident history
 *
 * All features are counts/rates/metrics only; no raw payloads or PII.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface IncidentFeatures {
  alert_count_1h: number;
  alert_count_24h: number;
  unique_rule_count: number;
  correlation_cluster_count: number;
  cluster_size_median?: number;
  risk_score_latest: number;
  risk_delta_24h: number;
  notification_failure_rate: number;
  anomaly_event_count: number;
  incident_age_minutes: number;
  reopen_count: number;
  [key: string]: number | undefined;
}

/**
 * Build aggregate-only features for an incident
 */
export async function buildIncidentFeatures(
  tenantId: string,
  incidentId: string,
  window: { hours: number } = { hours: 24 }
): Promise<IncidentFeatures> {
  const supabase = getSupabaseServer();

  // Fetch incident metadata
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('created_at, status, updated_at')
    .eq('workspace_id', tenantId)
    .eq('id', incidentId)
    .single();

  if (incidentError || !incident) {
    throw new Error(`Incident ${incidentId} not found in tenant ${tenantId}`);
  }

  const now = new Date();
  const incidentCreatedAt = new Date(incident.created_at);
  const incidentAgeMinutes = Math.floor((now.getTime() - incidentCreatedAt.getTime()) / (1000 * 60));

  const windowMs = window.hours * 3600 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  // Count alerts linked to incident (by time overlap or explicit link)
  // Assuming alerts have incident_id foreign key or time-based overlap logic
  const { count: alertCount24h, error: alertCountError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', tenantId)
    .eq('incident_id', incidentId)
    .gte('created_at', windowStart.toISOString());

  const { count: alertCount1h, error: alertCount1hError } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', tenantId)
    .eq('incident_id', incidentId)
    .gte('created_at', new Date(now.getTime() - 3600 * 1000).toISOString());

  // Count unique rules in incident
  const { data: rulesData, error: rulesError } = await supabase
    .from('alerts')
    .select('rule_id', { count: 'exact' })
    .eq('workspace_id', tenantId)
    .eq('incident_id', incidentId);

  const uniqueRuleCount = new Set(rulesData?.map((r: any) => r.rule_id) || []).size;

  // Count correlation clusters that overlap with incident timeframe
  const { count: clusterCount, error: clusterCountError } = await supabase
    .from('guardian_correlation_clusters')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', tenantId)
    .gte('created_at', windowStart.toISOString());

  // Get latest risk score for incident (if risk table exists and links to incidents)
  const { data: riskData, error: riskError } = await supabase
    .from('guardian_risk_scores')
    .select('score, created_at')
    .eq('workspace_id', tenantId)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const riskScoreLatest = riskData?.score || 0;

  // Estimate risk delta: compare latest to 24h ago
  const riskWindow24hStart = new Date(now.getTime() - 24 * 3600 * 1000);
  const { data: riskData24hAgo, error: riskError24h } = await supabase
    .from('guardian_risk_scores')
    .select('score')
    .eq('workspace_id', tenantId)
    .lt('created_at', riskWindow24hStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const riskScore24hAgo = riskData24hAgo?.score || riskScoreLatest;
  const riskDelta24h = riskScoreLatest - riskScore24hAgo;

  // Count notification failures linked to incident
  const { count: failureCount, error: failureError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', tenantId)
    .eq('incident_id', incidentId)
    .eq('delivery_status', 'failed')
    .gte('created_at', windowStart.toISOString());

  const notificationFailureRate = alertCount24h ? (failureCount || 0) / alertCount24h : 0;

  // Count anomaly events linked to incident (if H02 tables exist)
  let anomalyEventCount = 0;
  try {
    const { count: anomalyCount, error: anomalyError } = await supabase
      .from('guardian_anomaly_events')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', tenantId)
      .gte('created_at', windowStart.toISOString());

    anomalyEventCount = anomalyCount || 0;
  } catch {
    // H02 may not be deployed; gracefully skip
    anomalyEventCount = 0;
  }

  // Count reopens (transitions from 'resolved' or 'closed' back to 'open' or 'in_progress')
  const { count: reopenCount, error: reopenError } = await supabase
    .from('incident_status_changes')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', tenantId)
    .eq('incident_id', incidentId)
    .in('new_status', ['open', 'in_progress']);

  return {
    alert_count_1h: alertCount1h || 0,
    alert_count_24h: alertCount24h || 0,
    unique_rule_count: uniqueRuleCount,
    correlation_cluster_count: clusterCount || 0,
    risk_score_latest: Number(riskScoreLatest),
    risk_delta_24h: Number(riskDelta24h),
    notification_failure_rate: Number(notificationFailureRate),
    anomaly_event_count: anomalyEventCount,
    incident_age_minutes: incidentAgeMinutes,
    reopen_count: reopenCount || 0,
  };
}

/**
 * Validate features are aggregate-only and contain no PII
 */
export function validateFeaturesAreSafe(features: IncidentFeatures): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for disallowed keys (raw data, PII)
  const disallowedKeys = [
    'rule_payload',
    'rule_text',
    'alert_payload',
    'incident_details',
    'email',
    'user',
    'webhook_url',
    'api_key',
  ];

  for (const key of Object.keys(features)) {
    if (disallowedKeys.some((disallowed) => key.toLowerCase().includes(disallowed))) {
      errors.push(`Disallowed key in features: ${key}`);
    }
  }

  // Check for non-numeric values (except optional fields)
  for (const [key, value] of Object.entries(features)) {
    if (value !== undefined && typeof value !== 'number') {
      errors.push(`Non-numeric feature value: ${key} = ${typeof value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
