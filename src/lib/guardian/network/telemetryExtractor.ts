/**
 * Guardian X01: Telemetry Extractor
 *
 * Extracts hourly, de-identified metrics from existing Guardian & I-series artifacts.
 * Produces only coarse-grained metrics with no PII, domain names, or rule/playbook identifiers.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianTelemetryPoint {
  bucketStart: Date;
  metricFamily: string;
  metricKey: string;
  value: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Extract hourly telemetry for a tenant from Guardian & I-series tables
 *
 * Metrics include:
 * - Alerts: count by severity
 * - Incidents: count by type/priority
 * - Risk: average score
 * - Notifications: total count
 * - QA: drills, regression runs, coverage snapshots, performance runs
 * - Performance: p95 latency
 *
 * All queries are tenant-scoped via existing RLS.
 */
export async function extractHourlyTelemetryForTenant(
  tenantId: string,
  window: { start: Date; end: Date }
): Promise<GuardianTelemetryPoint[]> {
  const supabase = getSupabaseServer();
  const points: GuardianTelemetryPoint[] = [];

  // Helper: bucket a timestamp to the start of its hour (UTC)
  function bucketToHour(date: Date): Date {
    const d = new Date(date);
    d.setUTCMinutes(0, 0, 0);
    return d;
  }

  // Alerts: count by severity over the time window
  const { data: alertsData } = await supabase
    .from('guardian_alerts')
    .select('severity')
    .eq('tenant_id', tenantId)
    .gte('created_at', window.start.toISOString())
    .lt('created_at', window.end.toISOString());

  if (alertsData) {
    const alertCounts: Record<string, number> = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    alertsData.forEach((alert) => {
      alertCounts.total += 1;
      const severity = alert.severity || 'unknown';
      alertCounts[severity] = (alertCounts[severity] || 0) + 1;
    });

    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'alerts',
      metricKey: 'alerts.total',
      value: alertCounts.total,
      unit: 'count',
    });

    if (alertCounts.critical > 0) {
      points.push({
        bucketStart: bucketToHour(window.start),
        metricFamily: 'alerts',
        metricKey: 'alerts.critical',
        value: alertCounts.critical,
        unit: 'count',
      });
    }
  }

  // Incidents: count by priority over the time window
  const { data: incidentsData } = await supabase
    .from('guardian_incidents')
    .select('priority')
    .eq('tenant_id', tenantId)
    .gte('created_at', window.start.toISOString())
    .lt('created_at', window.end.toISOString());

  if (incidentsData) {
    const incidentCounts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    incidentsData.forEach((incident) => {
      incidentCounts.total += 1;
      const priority = incident.priority || 'unknown';
      incidentCounts[priority as keyof typeof incidentCounts] =
        (incidentCounts[priority as keyof typeof incidentCounts] || 0) + 1;
    });

    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'incidents',
      metricKey: 'incidents.total',
      value: incidentCounts.total,
      unit: 'count',
    });

    if (incidentCounts.critical > 0) {
      points.push({
        bucketStart: bucketToHour(window.start),
        metricFamily: 'incidents',
        metricKey: 'incidents.critical',
        value: incidentCounts.critical,
        unit: 'count',
      });
    }
  }

  // Risk: average score across incidents
  const { data: riskData } = await supabase
    .from('guardian_incidents')
    .select('risk_score')
    .eq('tenant_id', tenantId)
    .gte('created_at', window.start.toISOString())
    .lt('created_at', window.end.toISOString());

  if (riskData && riskData.length > 0) {
    const avgRisk =
      riskData.reduce((sum, r) => sum + (r.risk_score || 0), 0) / riskData.length;
    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'risk',
      metricKey: 'risk.avg_score',
      value: Math.round(avgRisk * 100) / 100,
      unit: 'score',
    });
  }

  // QA: drills completed (from I07)
  const { count: drillsCount } = await supabase
    .from('guardian_drills')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('completed_at', window.start.toISOString())
    .lt('completed_at', window.end.toISOString());

  if (drillsCount !== null && drillsCount > 0) {
    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'qa',
      metricKey: 'qa.drills_completed',
      value: drillsCount,
      unit: 'count',
    });
  }

  // QA: regression runs (from I02)
  const { count: regRunsCount } = await supabase
    .from('guardian_regression_runs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('completed_at', window.start.toISOString())
    .lt('completed_at', window.end.toISOString());

  if (regRunsCount !== null && regRunsCount > 0) {
    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'qa',
      metricKey: 'qa.regression_runs',
      value: regRunsCount,
      unit: 'count',
    });
  }

  // QA: coverage snapshots (from I08)
  const { count: coverageCount } = await supabase
    .from('guardian_qa_coverage_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('snapshot_date', window.start.toISOString())
    .lt('snapshot_date', window.end.toISOString());

  if (coverageCount !== null && coverageCount > 0) {
    points.push({
      bucketStart: bucketToHour(window.start),
      metricFamily: 'qa',
      metricKey: 'qa.coverage_snapshots',
      value: coverageCount,
      unit: 'count',
    });
  }

  // Performance: p95 latency (from I09)
  const { data: perfRunsData } = await supabase
    .from('guardian_performance_runs')
    .select('latency_stats')
    .eq('tenant_id', tenantId)
    .gte('started_at', window.start.toISOString())
    .lt('started_at', window.end.toISOString())
    .limit(100);

  if (perfRunsData && perfRunsData.length > 0) {
    const p95Values = perfRunsData
      .map((run) => run.latency_stats?.overall?.p95 || 0)
      .filter((v) => v > 0);

    if (p95Values.length > 0) {
      const avgP95 = p95Values.reduce((sum, v) => sum + v, 0) / p95Values.length;
      points.push({
        bucketStart: bucketToHour(window.start),
        metricFamily: 'performance',
        metricKey: 'perf.p95_ms',
        value: Math.round(avgP95),
        unit: 'ms',
      });
    }
  }

  return points;
}

/**
 * Merge duplicate telemetry points by aggregating values
 *
 * Combines points with same bucketStart + metricFamily + metricKey.
 * For counts, sums values. For scores/latencies, averages.
 */
export function mergeTelemetryPoints(points: GuardianTelemetryPoint[]): GuardianTelemetryPoint[] {
  const merged: Record<string, GuardianTelemetryPoint> = {};

  points.forEach((point) => {
    const key = `${point.bucketStart.toISOString()}|${point.metricFamily}|${point.metricKey}`;

    if (merged[key]) {
      // Determine merge strategy based on metric type
      if (point.unit === 'count') {
        merged[key].value += point.value;
      } else {
        // For scores and latencies, average the values
        merged[key].value = (merged[key].value + point.value) / 2;
      }
    } else {
      merged[key] = { ...point };
    }
  });

  return Object.values(merged);
}
