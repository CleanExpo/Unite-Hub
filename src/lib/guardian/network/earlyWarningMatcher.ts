/**
 * Guardian X03: Early-Warning Matcher
 *
 * Matches tenant anomalies to global pattern signatures and generates
 * per-tenant early-warning records.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { GuardianAnomalyFeature } from './patternFeatureExtractor';

export interface GuardianEarlyWarningMatchOptions {
  bucketDate: Date;
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Score how well a tenant's anomalies match a pattern
 */
export function computeTenantPatternMatchScore(
  tenantFeatures: GuardianAnomalyFeature[],
  pattern: {
    metricFamily: string;
    metricKeys: string[];
    severity: string;
  }
): number {
  if (tenantFeatures.length === 0) {
return 0;
}

  let matches = 0;
  let matchWeights = 0;

  for (const feature of tenantFeatures) {
    if (feature.metricFamily === pattern.metricFamily) {
      if (pattern.metricKeys.includes(feature.metricKey)) {
        // Weight by severity (critical = 1.0, high = 0.8, medium = 0.6, low = 0.4)
        const severityWeight: Record<string, number> = {
          critical: 1.0,
          high: 0.8,
          medium: 0.6,
          low: 0.4,
        };
        const weight = severityWeight[feature.severity] || 0.3;
        matches += weight;
        matchWeights++;
      }
    }
  }

  if (matchWeights === 0) {
return 0;
}

  // Normalize to 0�1 range
  const score = Math.min(1.0, matches / matchWeights);
  return Math.round(score * 100) / 100;
}

/**
 * Build feature set for a tenant from their anomalies
 */
export async function buildTenantAnomalyFeatureVector(
  tenantId: string,
  bucketDate: Date
): Promise<GuardianAnomalyFeature[]> {
  const supabase = getSupabaseServer();

  // Calculate 7-day window around bucketDate
  const windowStart = new Date(bucketDate);
  windowStart.setDate(windowStart.getDate() - 7);

  const windowEnd = new Date(bucketDate);
  windowEnd.setDate(windowEnd.getDate() + 1);

  const { data: anomalies, error } = await supabase
    .from('guardian_network_anomaly_signals')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('detected_at', windowStart.toISOString())
    .lt('detected_at', windowEnd.toISOString());

  if (error) {
    console.error(
      `Failed to fetch anomalies for tenant ${tenantId}:`,
      error
    );
    return [];
  }

  const features: GuardianAnomalyFeature[] = (anomalies || []).map((a) => ({
    cohortKey: a.cohort_key,
    metricFamily: a.metric_family,
    metricKey: a.metric_key,
    anomalyType: a.anomaly_type,
    severity: a.severity,
    deltaRatio: a.delta_ratio,
    zScore: a.z_score,
  }));

  return features;
}

/**
 * Generate early warnings for a tenant by matching their anomalies to patterns
 */
export async function generateEarlyWarningsForTenant(
  tenantId: string,
  options: GuardianEarlyWarningMatchOptions
): Promise<void> {
  const { bucketDate, minSeverity } = options;
  const supabase = getSupabaseServer();

  // Build tenant's anomaly feature vector
  const tenantFeatures = await buildTenantAnomalyFeatureVector(
    tenantId,
    bucketDate
  );

  if (tenantFeatures.length === 0) {
    return; // No anomalies, no early warnings
  }

  // Get cohort keys from tenant's features
  const cohortKeys = Array.from(
    new Set(tenantFeatures.map((f) => f.cohortKey))
  );

  // Fetch relevant patterns for these cohorts
  const { data: patterns, error: patternsError } = await supabase
    .from('guardian_network_pattern_signatures')
    .select('*')
    .in('cohort_key', cohortKeys);

  if (patternsError) {
    console.error('Failed to fetch patterns:', patternsError);
    return;
  }

  if (!patterns || patterns.length === 0) {
    return; // No patterns to match against
  }

  // For each pattern, compute match score and possibly insert early warning
  for (const pattern of patterns) {
    const matchScore = computeTenantPatternMatchScore(tenantFeatures, {
      metricFamily: pattern.metric_family,
      metricKeys: pattern.metric_keys,
      severity: pattern.severity,
    });

    // Threshold: only create warning if matchScore >= 0.5
    if (matchScore < 0.5) {
continue;
}

    // Additional filter: severity
    if (minSeverity) {
      const severityRank: Record<string, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };
      if (
        (severityRank[pattern.severity] || 0) <
        (severityRank[minSeverity] || 0)
      ) {
        continue;
      }
    }

    // Map pattern_key to suggestion_theme
    const suggestionThemes: Record<string, string> = {
      alerts_burst_followed_by_incidents: 'tighten_alert_thresholds',
      high_risk_and_notifications_lag: 'review_notification_pipeline',
      qa_and_performance_clustering: 'investigate_shared_root_causes',
    };

    const suggestionTheme = suggestionThemes[pattern.pattern_key] || null;

    // Build evidence summary
    const evidence = {
      contributingAnomalies: tenantFeatures.slice(0, 5).map((f) => ({
        metricFamily: f.metricFamily,
        metricKey: f.metricKey,
        severity: f.severity,
        deltaRatio: f.deltaRatio,
      })),
      matchScore: matchScore,
      cohortKey: pattern.cohort_key,
    };

    // Upsert early warning
    const { error: upsertError } = await supabase
      .from('guardian_network_early_warnings')
      .upsert(
        {
          tenant_id: tenantId,
          pattern_id: pattern.id,
          bucket_date: bucketDate.toISOString().split('T')[0],
          status: 'open',
          severity: pattern.severity,
          match_score: matchScore,
          evidence: evidence,
          suggestion_theme: suggestionTheme,
        },
        {
          onConflict: 'tenant_id,pattern_id,bucket_date',
        }
      );

    if (upsertError) {
      console.error(
        `Failed to upsert early warning for tenant ${tenantId}:`,
        upsertError
      );
    }
  }
}

/**
 * Generate early warnings for all tenants (batch processing)
 */
export async function generateEarlyWarningsForAllTenants(
  bucketDate: Date
): Promise<void> {
  const supabase = getSupabaseServer();

  // Fetch all active tenant IDs (from workspaces)
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch active workspaces:', error);
    return;
  }

  if (!workspaces || workspaces.length === 0) {
    return;
  }

  // Process each tenant
  for (const workspace of workspaces) {
    try {
      await generateEarlyWarningsForTenant(workspace.id, { bucketDate });
    } catch (err) {
      console.error(
        `Error generating early warnings for tenant ${workspace.id}:`,
        err
      );
    }
  }
}
