/**
 * H01 Rule Suggestion Signals Collector
 *
 * Computes PII-free aggregates from existing Guardian tables to drive AI/heuristic rule suggestions.
 * All outputs are counts, rates, and summary statistics only — no raw events, payloads, or identifying data.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface RuleSuggestionSignals {
  window: {
    hours: number;
    startedAt: string;
    endedAt: string;
  };
  topRules: Array<{
    ruleId: string;
    ruleKey: string;
    alertCount: number;
    avgSeverity?: string;
  }>;
  alertRates: {
    count24h: number;
    count7d: number;
    count30d: number;
    avgPerHour24h: number;
  };
  incidentRates: {
    createdCount24h: number;
    averageTimeToClosureMinutes?: number;
  };
  correlationStats: {
    clusterCount: number;
    avgClusterSize: number;
    linkRatePercent: number;
  };
  riskSnapshot: {
    avgScore: number;
    maxScore: number;
    scoreDistribution: Record<string, number>; // e.g., { "critical": 2, "high": 5, ... }
  };
  notificationFailureRates: {
    failureCount24h: number;
    failurePercent: number;
    topFailedChannels?: Array<{ channel: string; failureCount: number }>;
  };
}

/**
 * Build PII-free aggregates for rule suggestion signals
 */
export async function buildRuleSuggestionSignals(
  tenantId: string,
  window: { hours: number }
): Promise<RuleSuggestionSignals> {
  const supabase = getSupabaseServer();
  const now = new Date();
  const startTime = new Date(now.getTime() - window.hours * 60 * 60 * 1000);

  try {
    // Parallel fetch of all aggregate data
    const [
      topRulesResult,
      alertCountsResult,
      incidentDataResult,
      correlationDataResult,
      riskDataResult,
      notificationFailuresResult,
    ] = await Promise.all([
      // Top rules by alert count (PII-free: rule_id + count only)
      supabase
        .from('guardian_alerts')
        .select('rule_id, rule_key', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(10),

      // Alert volume trends
      supabase.rpc('count_alerts_by_window', {
        p_tenant_id: tenantId,
        p_hours_24: 24,
        p_hours_7d: 7 * 24,
        p_hours_30d: 30 * 24,
      }),

      // Incident rates (counts only, no payloads)
      supabase.rpc('get_incident_stats', {
        p_tenant_id: tenantId,
        p_hours: 24,
      }),

      // Correlation cluster stats (counts only)
      supabase.rpc('get_correlation_cluster_stats', {
        p_tenant_id: tenantId,
      }),

      // Risk score distribution
      supabase.rpc('get_risk_score_distribution', {
        p_tenant_id: tenantId,
        p_hours: window.hours,
      }),

      // Notification failures (counts by channel, no destinations)
      supabase.rpc('get_notification_failure_stats', {
        p_tenant_id: tenantId,
        p_hours: 24,
      }),
    ]);

    // Aggregate top rules
    const ruleMap = new Map<string, { ruleId: string; ruleKey: string; count: number }>();
    if (topRulesResult.data) {
      for (const alert of topRulesResult.data) {
        const key = alert.rule_id;
        const entry = ruleMap.get(key) || { ruleId: alert.rule_id, ruleKey: alert.rule_key, count: 0 };
        entry.count++;
        ruleMap.set(key, entry);
      }
    }

    const topRules = Array.from(ruleMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Parse RPC results (fallback if RPCs don't exist)
    const alertCounts = alertCountsResult.data || {
      count_24h: 0,
      count_7d: 0,
      count_30d: 0,
    };

    const incidentStats = incidentDataResult.data || { created_count_24h: 0, avg_closure_minutes: null };
    const correlationStats = correlationDataResult.data || { cluster_count: 0, avg_cluster_size: 1, link_rate: 0 };
    const riskStats = riskDataResult.data || { avg_score: 0, max_score: 0, distribution: {} };
    const notificationStats = notificationFailuresResult.data || { failure_count_24h: 0, failure_percent: 0 };

    return {
      window: {
        hours: window.hours,
        startedAt: startTime.toISOString(),
        endedAt: now.toISOString(),
      },
      topRules,
      alertRates: {
        count24h: alertCounts.count_24h || 0,
        count7d: alertCounts.count_7d || 0,
        count30d: alertCounts.count_30d || 0,
        avgPerHour24h: (alertCounts.count_24h || 0) / 24,
      },
      incidentRates: {
        createdCount24h: incidentStats.created_count_24h || 0,
        averageTimeToClosureMinutes: incidentStats.avg_closure_minutes,
      },
      correlationStats: {
        clusterCount: correlationStats.cluster_count || 0,
        avgClusterSize: correlationStats.avg_cluster_size || 1,
        linkRatePercent: correlationStats.link_rate || 0,
      },
      riskSnapshot: {
        avgScore: riskStats.avg_score || 0,
        maxScore: riskStats.max_score || 0,
        scoreDistribution: riskStats.distribution || {},
      },
      notificationFailureRates: {
        failureCount24h: notificationStats.failure_count_24h || 0,
        failurePercent: notificationStats.failure_percent || 0,
        topFailedChannels: notificationStats.top_failed_channels || [],
      },
    };
  } catch (error) {
    // If RPCs don't exist, return minimal signals structure
    console.warn('buildRuleSuggestionSignals: RPC error', error instanceof Error ? error.message : String(error));

    return {
      window: {
        hours: window.hours,
        startedAt: startTime.toISOString(),
        endedAt: now.toISOString(),
      },
      topRules: [],
      alertRates: { count24h: 0, count7d: 0, count30d: 0, avgPerHour24h: 0 },
      incidentRates: { createdCount24h: 0 },
      correlationStats: { clusterCount: 0, avgClusterSize: 1, linkRatePercent: 0 },
      riskSnapshot: { avgScore: 0, maxScore: 0, scoreDistribution: {} },
      notificationFailureRates: { failureCount24h: 0, failurePercent: 0 },
    };
  }
}

/**
 * Validate that signals contain no PII
 */
export function validateSignalsArePIIFree(signals: RuleSuggestionSignals): { clean: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for prohibited keys in any object
  const prohibitedPatterns = ['email', 'phone', 'url', 'secret', 'key', 'password', 'token', 'payload', 'body'];

  const checkObjectForPII = (obj: unknown, path: string): void => {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'object') {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        const keyLower = key.toLowerCase();
        if (prohibitedPatterns.some((p) => keyLower.includes(p))) {
          issues.push(`Prohibited key "${key}" found at ${path}.${key}`);
        }
        checkObjectForPII((obj as Record<string, unknown>)[key], `${path}.${key}`);
      }
    }
  };

  // Check all signal fields
  checkObjectForPII(signals.topRules, 'topRules');
  checkObjectForPII(signals.alertRates, 'alertRates');
  checkObjectForPII(signals.incidentRates, 'incidentRates');
  checkObjectForPII(signals.correlationStats, 'correlationStats');
  checkObjectForPII(signals.riskSnapshot, 'riskSnapshot');
  checkObjectForPII(signals.notificationFailureRates, 'notificationFailureRates');

  return {
    clean: issues.length === 0,
    issues,
  };
}
