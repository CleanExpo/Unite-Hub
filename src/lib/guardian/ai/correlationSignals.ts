/**
 * H03: Correlation Signal Builder
 * Computes aggregate features of clusters/links to drive heuristic and AI recommendations
 * All outputs are aggregate-only (no raw payloads, no PII)
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ClusterSignal {
  cluster_id: string;
  created_at: string;
  last_seen_at?: string;
  link_count: number;
  unique_rule_count: number;
  unique_entity_count?: number;
  duration_minutes: number;
  density: number; // links / unique entities
  incident_link_count: number; // count of incidents linked
  incident_link_rate: number; // 0..1 ratio
  notification_failure_overlap: number; // count of overlapping failed notifications
  risk_contribution_estimate: number; // 0..100 estimated risk contribution
}

export interface CorrelationSignalsSummary {
  total_clusters: number;
  median_cluster_size: number;
  p95_cluster_size: number;
  median_duration_minutes: number;
  p95_duration_minutes: number;
  percent_clusters_with_incident: number; // 0..100
  avg_density: number;
  top_co_occurring_rule_ids: string[]; // UUIDs only, no rule content
  signal_timestamp: string;
}

export interface CorrelationSignalsResult {
  clusters: ClusterSignal[];
  summary: CorrelationSignalsSummary;
}

/**
 * Build aggregate correlation signals for a tenant
 * Used to drive heuristic and AI recommendations
 */
export async function buildCorrelationSignals(
  tenantId: string,
  window: { days: number }
): Promise<CorrelationSignalsResult> {
  const supabase = getSupabaseServer();

  try {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - window.days);

    // Fetch clusters in window with link counts
    const { data: clusters, error: clusterError } = await supabase
      .from('guardian_correlation_clusters')
      .select(
        `
        id,
        created_at,
        updated_at,
        rule_ids,
        link_count,
        entity_count
        `
      )
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (clusterError || !clusters) {
      throw clusterError || new Error('Failed to fetch clusters');
    }

    const clusterSignals: ClusterSignal[] = [];
    const ruleCounts: Map<string, number> = new Map();

    for (const cluster of clusters) {
      // Extract rule IDs safely (UUIDs only)
      const ruleIds = Array.isArray(cluster.rule_ids) ? cluster.rule_ids : [];
      ruleIds.forEach((rid) => {
        ruleCounts.set(rid, (ruleCounts.get(rid) || 0) + 1);
      });

      // Compute duration in minutes
      const createdAt = new Date(cluster.created_at);
      const updatedAt = new Date(cluster.updated_at || cluster.created_at);
      const durationMinutes = Math.max(
        1,
        Math.round((updatedAt.getTime() - createdAt.getTime()) / 60000)
      );

      // Compute density (links per unique entity)
      const uniqueEntityCount = cluster.entity_count || 1;
      const linkCount = cluster.link_count || 0;
      const density = linkCount / Math.max(uniqueEntityCount, 1);

      // Fetch incident links for this cluster (count only)
      const { count: incidentCount } = await supabase
        .from('guardian_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .contains('correlation_cluster_ids', [cluster.id]);

      const incidentLinkCount = incidentCount || 0;
      const incidentLinkRate = clusters.length > 0 ? incidentLinkCount / clusters.length : 0;

      // Fetch notification failure overlap (count only, no details)
      const { count: notifFailureCount } = await supabase
        .from('guardian_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'failed')
        .gte(
          'created_at',
          new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
        );

      const notificationFailureOverlap = notifFailureCount || 0;

      // Estimate risk contribution (simplified: based on link count and incident linkage)
      const riskEstimate = Math.min(100, (linkCount * 10 + incidentLinkCount * 20) / Math.max(uniqueEntityCount, 1));

      clusterSignals.push({
        cluster_id: cluster.id,
        created_at: cluster.created_at,
        last_seen_at: cluster.updated_at,
        link_count: linkCount,
        unique_rule_count: ruleIds.length,
        unique_entity_count: uniqueEntityCount,
        duration_minutes: durationMinutes,
        density,
        incident_link_count: incidentLinkCount,
        incident_link_rate: incidentLinkRate,
        notification_failure_overlap: notificationFailureOverlap,
        risk_contribution_estimate: riskEstimate,
      });
    }

    // Compute summary statistics
    const sizes = clusterSignals.map((c) => c.link_count);
    const durations = clusterSignals.map((c) => c.duration_minutes);

    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    const medianSize = median(sizes);
    const p95Size = percentile(sizes, 95);
    const medianDuration = median(durations);
    const p95Duration = percentile(durations, 95);

    const incidentsLinked = clusterSignals.filter((c) => c.incident_link_count > 0).length;
    const percentIncidents = clusters.length > 0 ? (incidentsLinked / clusters.length) * 100 : 0;

    const avgDensity = clusterSignals.length > 0
      ? clusterSignals.reduce((sum, c) => sum + c.density, 0) / clusterSignals.length
      : 0;

    // Top 10 co-occurring rules (by cluster count)
    const topRules = Array.from(ruleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ruleId]) => ruleId);

    const summary: CorrelationSignalsSummary = {
      total_clusters: clusterSignals.length,
      median_cluster_size: medianSize,
      p95_cluster_size: p95Size,
      median_duration_minutes: medianDuration,
      p95_duration_minutes: p95Duration,
      percent_clusters_with_incident: percentIncidents,
      avg_density: avgDensity,
      top_co_occurring_rule_ids: topRules,
      signal_timestamp: new Date().toISOString(),
    };

    return {
      clusters: clusterSignals,
      summary,
    };
  } catch (error) {
    console.error('[H03 Correlation Signals] Error building signals:', error);
    throw error;
  }
}

/**
 * Validate signal output is aggregate-only and PII-free
 */
export function validateSignalsArePiiFree(signals: CorrelationSignalsResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for obvious PII patterns (email, IP, etc.)
  const signalStr = JSON.stringify(signals);

  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(signalStr)) {
    warnings.push('Potential email addresses detected in signals');
  }

  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(signalStr)) {
    warnings.push('Potential IP addresses detected in signals');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
