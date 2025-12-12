/**
 * Guardian I04: Baseline Metrics Extractor
 *
 * Computes baseline aggregate metrics from recent production data.
 * Read-only from production tables; no modifications.
 * Metrics are PII-free aggregates only.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface BaselineMetrics {
  alerts_total: number;
  alerts_by_severity: Record<string, number>;
  incidents_total: number;
  incidents_by_status: Record<string, number>;
  correlations_total: number;
  notifications_total: number;
  avg_risk_score: number;
  window_days: number;
  computed_at: string;
}

/**
 * Extract baseline metrics from production Guardian tables
 * over specified window (read-only, aggregates only)
 */
export async function getBaselineMetrics(tenantId: string, windowDays: number = 30): Promise<BaselineMetrics> {
  const supabase = getSupabaseServer();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Initialize result
  const metrics: BaselineMetrics = {
    alerts_total: 0,
    alerts_by_severity: {},
    incidents_total: 0,
    incidents_by_status: {},
    correlations_total: 0,
    notifications_total: 0,
    avg_risk_score: 0,
    window_days: windowDays,
    computed_at: now.toISOString(),
  };

  try {
    // ========================================
    // Alerts: count by severity
    // ========================================
    const { data: alertsData } = await supabase
      .from('guardian_generated_alerts')
      .select('severity, count(severity) as count')
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString())
      .groupBy('severity');

    if (alertsData && Array.isArray(alertsData)) {
      for (const row of alertsData) {
        const severity = row.severity || 'unknown';
        const count = Number(row.count) || 0;
        metrics.alerts_total += count;
        metrics.alerts_by_severity[severity] = count;
      }
    }

    // ========================================
    // Incidents: count by status
    // ========================================
    const { data: incidentsData } = await supabase
      .from('guardian_generated_incidents')
      .select('status, count(status) as count')
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString())
      .groupBy('status');

    if (incidentsData && Array.isArray(incidentsData)) {
      for (const row of incidentsData) {
        const status = row.status || 'unknown';
        const count = Number(row.count) || 0;
        metrics.incidents_total += count;
        metrics.incidents_by_status[status] = count;
      }
    }

    // ========================================
    // Correlations: total count
    // ========================================
    const { data: correlationData } = await supabase
      .from('guardian_generated_correlations')
      .select('count', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString());

    if (correlationData) {
      metrics.correlations_total = correlationData.length;
    }

    // ========================================
    // Notifications: total count
    // ========================================
    const { data: notificationData } = await supabase
      .from('guardian_generated_notifications')
      .select('count', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString());

    if (notificationData) {
      metrics.notifications_total = notificationData.length;
    }

    // ========================================
    // Risk scores: average
    // ========================================
    const { data: riskData } = await supabase
      .from('guardian_generated_incidents')
      .select('risk_score')
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString())
      .not('risk_score', 'is', null);

    if (riskData && riskData.length > 0) {
      const sum = (riskData as Array<{ risk_score: number }>).reduce((acc, row) => acc + (row.risk_score || 0), 0);
      metrics.avg_risk_score = sum / riskData.length;
    }
  } catch (err) {
    console.error('Error extracting baseline metrics:', err);
    // Return partial metrics; don't throw
  }

  return metrics;
}

/**
 * Format baseline metrics for display
 */
export function formatBaselineMetrics(metrics: BaselineMetrics): string {
  return `
Baseline Metrics (${metrics.window_days} days):
  - Alerts: ${metrics.alerts_total} (${JSON.stringify(metrics.alerts_by_severity)})
  - Incidents: ${metrics.incidents_total} (${JSON.stringify(metrics.incidents_by_status)})
  - Correlations: ${metrics.correlations_total}
  - Notifications: ${metrics.notifications_total}
  - Avg Risk Score: ${metrics.avg_risk_score.toFixed(2)}
  - Computed: ${metrics.computed_at}
  `.trim();
}
