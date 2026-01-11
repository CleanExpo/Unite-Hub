/**
 * Guardian X04: Network Overview Service
 *
 * Aggregates X-series metrics into a single dashboard model
 * for the unified Network Intelligence console.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getNetworkFeatureFlagsForTenant, GuardianNetworkFeatureFlags } from './networkFeatureFlagsService';
import { getNetworkGovernanceEventsForTenant } from './networkGovernanceLogger';

/**
 * High-level stats about Network Intelligence for a tenant
 */
export interface GuardianNetworkStats {
  benchmarksAvailable: boolean;
  anomaliesLast30d: number;
  earlyWarningsOpen: number;
  telemetryActiveSince?: string;
  cohortsUsed: string[];
}

/**
 * Recent anomaly for display
 */
export interface GuardianNetworkRecentAnomaly {
  detectedAt: string;
  metricFamily: string;
  metricKey: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation?: string;
}

/**
 * Recent early warning for display
 */
export interface GuardianNetworkRecentWarning {
  id: string;
  createdAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchScore: number;
  patternKey: string;
  suggestionTheme?: string;
}

/**
 * Recent governance event for display
 */
export interface GuardianNetworkGovernanceEventDisplay {
  occurredAt: string;
  eventType: string;
  context: string;
  detailsSummary?: string;
}

/**
 * Complete Network Intelligence overview for a tenant
 */
export interface GuardianNetworkOverview {
  flags: GuardianNetworkFeatureFlags;
  stats: GuardianNetworkStats;
  recentAnomalies: GuardianNetworkRecentAnomaly[];
  recentWarnings: GuardianNetworkRecentWarning[];
  recentGovernanceEvents: GuardianNetworkGovernanceEventDisplay[];
}

/**
 * Get the complete Network Intelligence overview for a tenant.
 */
export async function getNetworkOverviewForTenant(
  tenantId: string
): Promise<GuardianNetworkOverview> {
  const supabase = getSupabaseServer();

  // Load feature flags
  const flags = await getNetworkFeatureFlagsForTenant(tenantId);

  // Load stats in parallel
  const [
    benchmarksAvailable,
    anomaliesLast30d,
    earlyWarningsOpen,
    telemetryActiveSince,
    cohortsUsed,
    recentAnomalies,
    recentWarnings,
    recentGovernanceEvents,
  ] = await Promise.all([
    // Check if benchmarks are available
    checkBenchmarksAvailable(supabase, tenantId),
    // Count anomalies from last 30 days
    countAnomaliesLast30d(supabase, tenantId, flags),
    // Count open early warnings
    countEarlyWarningsOpen(supabase, tenantId, flags),
    // Get telemetry active since date
    getTelemetryActiveSince(supabase, tenantId, flags),
    // Get cohorts used
    getCohortsUsed(supabase, tenantId, flags),
    // Get recent anomalies
    getRecentAnomalies(supabase, tenantId, flags),
    // Get recent warnings
    getRecentWarnings(supabase, tenantId, flags),
    // Get recent governance events
    getRecentGovernanceEvents(tenantId),
  ]);

  const stats: GuardianNetworkStats = {
    benchmarksAvailable,
    anomaliesLast30d,
    earlyWarningsOpen,
    telemetryActiveSince,
    cohortsUsed,
  };

  return {
    flags,
    stats,
    recentAnomalies,
    recentWarnings,
    recentGovernanceEvents,
  };
}

/**
 * Check if benchmarks are available (recent benchmark snapshots exist)
 */
async function checkBenchmarksAvailable(supabase: any, tenantId: string): Promise<boolean> {
  if (!tenantId) {
return false;
}

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('guardian_network_benchmark_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo);

    if (error) {
      console.error('Error checking benchmarks:', error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (error) {
    console.error('Unexpected error checking benchmarks:', error);
    return false;
  }
}

/**
 * Count anomalies from the last 30 days
 */
async function countAnomaliesLast30d(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<number> {
  if (!flags.enableNetworkAnomalies || !tenantId) {
return 0;
}

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('guardian_network_anomaly_signals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo);

    if (error) {
      console.error('Error counting anomalies:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Unexpected error counting anomalies:', error);
    return 0;
  }
}

/**
 * Count open early warnings
 */
async function countEarlyWarningsOpen(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<number> {
  if (!flags.enableNetworkEarlyWarnings || !tenantId) {
return 0;
}

  try {
    const { count, error } = await supabase
      .from('guardian_network_early_warnings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'open');

    if (error) {
      console.error('Error counting early warnings:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Unexpected error counting early warnings:', error);
    return 0;
  }
}

/**
 * Get telemetry active since date (earliest telemetry record)
 */
async function getTelemetryActiveSince(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<string | undefined> {
  if (!flags.enableNetworkTelemetry || !tenantId) {
return undefined;
}

  try {
    const { data, error } = await supabase
      .from('guardian_network_telemetry_hourly')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error getting telemetry active since:', error);
      return undefined;
    }

    if (!data || data.length === 0) {
      return undefined;
    }

    return data[0].created_at;
  } catch (error) {
    console.error('Unexpected error getting telemetry active since:', error);
    return undefined;
  }
}

/**
 * Get cohorts used for this tenant
 */
async function getCohortsUsed(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<string[]> {
  if (!tenantId) {
return [];
}

  // Placeholder: In a full implementation, derive from tenant fingerprint
  // and recent benchmark snapshots. For now, return empty array.
  // This would integrate with tenantFingerprintService if available.

  try {
    const { data, error } = await supabase
      .from('guardian_network_benchmark_snapshots')
      .select('cohort_key')
      .eq('tenant_id', tenantId)
      .limit(100);

    if (error) {
      console.error('Error getting cohorts:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Deduplicate cohort keys
    const cohortSet = new Set(data.map((row) => row.cohort_key));
    return Array.from(cohortSet).sort();
  } catch (error) {
    console.error('Unexpected error getting cohorts:', error);
    return [];
  }
}

/**
 * Get recent anomalies (last 10)
 */
async function getRecentAnomalies(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<GuardianNetworkRecentAnomaly[]> {
  if (!flags.enableNetworkAnomalies || !tenantId) {
return [];
}

  try {
    const { data, error } = await supabase
      .from('guardian_network_anomaly_signals')
      .select('id, created_at, metric_family, metric_key, severity')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error getting recent anomalies:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      detectedAt: row.created_at,
      metricFamily: row.metric_family,
      metricKey: row.metric_key,
      severity: row.severity,
    }));
  } catch (error) {
    console.error('Unexpected error getting recent anomalies:', error);
    return [];
  }
}

/**
 * Get recent early warnings (last 10)
 */
async function getRecentWarnings(
  supabase: any,
  tenantId: string,
  flags: GuardianNetworkFeatureFlags
): Promise<GuardianNetworkRecentWarning[]> {
  if (!flags.enableNetworkEarlyWarnings || !tenantId) {
return [];
}

  try {
    const { data, error } = await supabase
      .from('guardian_network_early_warnings')
      .select('id, created_at, severity, match_score, metadata')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error getting recent warnings:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      severity: row.severity,
      matchScore: row.match_score,
      patternKey: row.metadata?.pattern_key || 'unknown',
      suggestionTheme: row.metadata?.suggestion_theme,
    }));
  } catch (error) {
    console.error('Unexpected error getting recent warnings:', error);
    return [];
  }
}

/**
 * Get recent governance events (last 10)
 */
async function getRecentGovernanceEvents(tenantId: string): Promise<GuardianNetworkGovernanceEventDisplay[]> {
  try {
    const events = await getNetworkGovernanceEventsForTenant(tenantId, { limit: 10 });

    return events.map((event) => ({
      occurredAt: event.occurredAt,
      eventType: event.eventType,
      context: event.context,
      detailsSummary: formatDetailsForDisplay(event.details),
    }));
  } catch (error) {
    console.error('Error getting governance events:', error);
    return [];
  }
}

/**
 * Format details object into a human-readable summary
 */
function formatDetailsForDisplay(details: Record<string, unknown>): string | undefined {
  if (!details || Object.keys(details).length === 0) {
    return undefined;
  }

  const parts: string[] = [];

  if (details.previous_state !== undefined && details.new_state !== undefined) {
    parts.push(`${details.previous_state} → ${details.new_state}`);
  }

  if (details.reason) {
    parts.push(`(${details.reason})`);
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}
