/**
 * Guardian I05: QA Drift Engine
 *
 * Purpose:
 * Detect behavioral drift by comparing current run metrics against baseline
 * Produce drift reports with severity flags and recommendations
 *
 * Drift criteria:
 * - Alert volume changes (increases may indicate regression, decreases may indicate under-detection)
 * - Incident volume changes
 * - Risk score changes
 * - Notification changes
 * - Playbook action changes
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { GuardianQaMetrics } from './qaMetrics';

/**
 * Configuration for drift detection thresholds
 */
export interface GuardianQaDriftConfig {
  thresholds: {
    alertsRelativeChange?: number; // e.g., 0.1 for 10% change
    incidentsRelativeChange?: number;
    riskRelativeChange?: number;
    notificationsRelativeChange?: number;
    playbookActionsRelativeChange?: number;
  };
  minSampleSize?: number; // Minimum baseline count to consider valid
  severityRules?: {
    warningAbove?: number; // Relative change % threshold for warning
    criticalAbove?: number; // Relative change % threshold for critical
  };
}

/**
 * Drift comparison result
 */
export interface GuardianQaDriftResult {
  severity: 'info' | 'warning' | 'critical';
  deltas: {
    alertsRelative?: number;
    incidentsRelative?: number;
    riskRelative?: number;
    notificationsRelative?: number;
    playbookActionsRelative?: number;
  };
  flags: string[];
  summaryMarkdown: string;
}

/**
 * Drift report as stored in database
 */
export interface GuardianQaDriftReport {
  id: string;
  tenant_id: string;
  schedule_id?: string;
  baseline_id: string;
  comparison_run_id: string;
  created_at: string;
  status: 'completed' | 'failed';
  severity: 'info' | 'warning' | 'critical';
  summary: {
    baselineMetrics?: GuardianQaMetrics;
    currentMetrics?: GuardianQaMetrics;
    deltas: Record<string, number>;
    flags: string[];
  };
  details: Record<string, unknown>;
  created_by?: string;
  metadata: Record<string, unknown>;
}

/**
 * Default drift detection configuration
 */
const DEFAULT_DRIFT_CONFIG: GuardianQaDriftConfig = {
  thresholds: {
    alertsRelativeChange: 0.15, // 15% change
    incidentsRelativeChange: 0.2, // 20% change
    riskRelativeChange: 0.1, // 10% change
    notificationsRelativeChange: 0.15,
    playbookActionsRelativeChange: 0.2,
  },
  minSampleSize: 1,
  severityRules: {
    warningAbove: 0.15, // 15% relative change = warning
    criticalAbove: 0.35, // 35% relative change = critical
  },
};

/**
 * Compute relative change: (current - baseline) / max(1, baseline)
 */
function computeRelativeChange(baseline: number, current: number): number {
  if (baseline === 0 && current === 0) {
    return 0;
  }
  if (baseline === 0) {
    return current > 0 ? 1.0 : -1.0; // Treat zero baseline as 100% change
  }
  return (current - baseline) / Math.abs(baseline);
}

/**
 * Determine severity from absolute relative change
 */
function determineSeverity(
  absRelativeChange: number,
  config: GuardianQaDriftConfig
): 'info' | 'warning' | 'critical' {
  const critical = config.severityRules?.criticalAbove ?? 0.35;
  const warning = config.severityRules?.warningAbove ?? 0.15;

  if (absRelativeChange >= critical) {
    return 'critical';
  }
  if (absRelativeChange >= warning) {
    return 'warning';
  }
  return 'info';
}

/**
 * Compare two metrics sets and produce drift report
 */
export function computeDrift(
  baseline: GuardianQaMetrics,
  current: GuardianQaMetrics,
  config: GuardianQaDriftConfig = DEFAULT_DRIFT_CONFIG
): GuardianQaDriftResult {
  const deltas: Record<string, number> = {};
  const flags: string[] = [];
  let maxAbsChange = 0;

  // Alerts drift
  const alertsRelative = computeRelativeChange(baseline.alerts.total, current.alerts.total);
  deltas.alertsRelative = alertsRelative;

  if (Math.abs(alertsRelative) >= (config.thresholds.alertsRelativeChange ?? 0.15)) {
    flags.push(
      `Alert volume changed by ${(alertsRelative * 100).toFixed(1)}% (${baseline.alerts.total} → ${current.alerts.total})`
    );
    maxAbsChange = Math.max(maxAbsChange, Math.abs(alertsRelative));
  }

  // Incidents drift
  const incidentsRelative = computeRelativeChange(
    baseline.incidents.total,
    current.incidents.total
  );
  deltas.incidentsRelative = incidentsRelative;

  if (Math.abs(incidentsRelative) >= (config.thresholds.incidentsRelativeChange ?? 0.2)) {
    flags.push(
      `Incident volume changed by ${(incidentsRelative * 100).toFixed(1)}% (${baseline.incidents.total} → ${current.incidents.total})`
    );
    maxAbsChange = Math.max(maxAbsChange, Math.abs(incidentsRelative));
  }

  // Risk drift
  const baselineRisk = baseline.risk.avgScore ?? 0;
  const currentRisk = current.risk.avgScore ?? 0;
  const riskRelative = computeRelativeChange(baselineRisk, currentRisk);
  deltas.riskRelative = riskRelative;

  if (Math.abs(riskRelative) >= (config.thresholds.riskRelativeChange ?? 0.1)) {
    flags.push(
      `Risk score changed by ${(riskRelative * 100).toFixed(1)}% (${baselineRisk.toFixed(2)} → ${currentRisk.toFixed(2)})`
    );
    maxAbsChange = Math.max(maxAbsChange, Math.abs(riskRelative));
  }

  // Notifications drift
  const notifRelative = computeRelativeChange(
    baseline.notifications.simulatedTotal,
    current.notifications.simulatedTotal
  );
  deltas.notificationsRelative = notifRelative;

  if (Math.abs(notifRelative) >= (config.thresholds.notificationsRelativeChange ?? 0.15)) {
    flags.push(
      `Notification count changed by ${(notifRelative * 100).toFixed(1)}% (${baseline.notifications.simulatedTotal} → ${current.notifications.simulatedTotal})`
    );
    maxAbsChange = Math.max(maxAbsChange, Math.abs(notifRelative));
  }

  // Playbook actions drift
  if (baseline.playbooks || current.playbooks) {
    const basePbActions = baseline.playbooks?.totalActions ?? 0;
    const currPbActions = current.playbooks?.totalActions ?? 0;
    const pbRelative = computeRelativeChange(basePbActions, currPbActions);
    deltas.playbookActionsRelative = pbRelative;

    if (Math.abs(pbRelative) >= (config.thresholds.playbookActionsRelativeChange ?? 0.2)) {
      flags.push(
        `Playbook actions changed by ${(pbRelative * 100).toFixed(1)}% (${basePbActions} → ${currPbActions})`
      );
      maxAbsChange = Math.max(maxAbsChange, Math.abs(pbRelative));
    }
  }

  // Determine severity
  const severity = determineSeverity(maxAbsChange, config);

  // Generate summary markdown
  const summaryMarkdown = generateDriftSummary(
    baseline,
    current,
    deltas,
    flags,
    severity
  );

  return {
    severity,
    deltas,
    flags,
    summaryMarkdown,
  };
}

/**
 * Generate markdown summary of drift
 */
function generateDriftSummary(
  baseline: GuardianQaMetrics,
  current: GuardianQaMetrics,
  deltas: Record<string, number>,
  flags: string[],
  severity: 'info' | 'warning' | 'critical'
): string {
  let md = `# Guardian QA Drift Report\n\n`;

  // Severity badge
  const badge =
    severity === 'critical'
      ? '🔴 **CRITICAL**'
      : severity === 'warning'
        ? '🟡 **WARNING**'
        : '🟢 **INFO**';
  md += `**Status**: ${badge}\n\n`;

  // Summary
  if (flags.length === 0) {
    md += `No significant drift detected. All metrics within threshold.\n\n`;
  } else {
    md += `## Key Changes\n\n`;
    for (const flag of flags) {
      md += `- ${flag}\n`;
    }
    md += `\n`;
  }

  // Metrics comparison table
  md += `## Metrics Comparison\n\n`;
  md += `| Metric | Baseline | Current | Change |\n`;
  md += `|--------|----------|---------|--------|\n`;
  md += `| Alerts | ${baseline.alerts.total} | ${current.alerts.total} | ${formatPercent(deltas.alertsRelative)} |\n`;
  md += `| Incidents | ${baseline.incidents.total} | ${current.incidents.total} | ${formatPercent(deltas.incidentsRelative)} |\n`;

  if (baseline.risk.avgScore !== undefined || current.risk.avgScore !== undefined) {
    md += `| Avg Risk | ${(baseline.risk.avgScore ?? 0).toFixed(2)} | ${(current.risk.avgScore ?? 0).toFixed(2)} | ${formatPercent(deltas.riskRelative)} |\n`;
  }

  md += `| Notifications | ${baseline.notifications.simulatedTotal} | ${current.notifications.simulatedTotal} | ${formatPercent(deltas.notificationsRelative)} |\n`;

  if (baseline.playbooks || current.playbooks) {
    md += `| Playbook Actions | ${baseline.playbooks?.totalActions ?? 0} | ${current.playbooks?.totalActions ?? 0} | ${formatPercent(deltas.playbookActionsRelative)} |\n`;
  }

  md += `\n`;

  // Recommendations
  if (severity === 'critical') {
    md += `## Recommended Actions\n\n`;
    md += `1. **Review rule changes** — significant metric drift may indicate rule config issues\n`;
    md += `2. **Compare scenarios** — check if chaos profile or patterns differ\n`;
    md += `3. **Validate baselines** — ensure baseline is still representative\n`;
    md += `4. **Check for regressions** — investigate whether pipeline behavior changed\n\n`;
  } else if (severity === 'warning') {
    md += `## Review Recommended\n\n`;
    md += `- Monitor trend: does drift persist in next run?\n`;
    md += `- Check for gradual degradation\n\n`;
  }

  return md;
}

/**
 * Helper to format relative change as percentage string
 */
function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

/**
 * Create and store a drift report in database
 */
export async function createDriftReportForRegressionRun(
  tenantId: string,
  baselineId: string,
  comparisonRunId: string,
  scheduleId: string | null,
  baseline: GuardianQaMetrics,
  current: GuardianQaMetrics,
  config?: GuardianQaDriftConfig,
  createdBy?: string
): Promise<GuardianQaDriftReport> {
  const supabase = getSupabaseServer();

  // Compute drift
  const driftResult = computeDrift(baseline, current, config);

  // Insert report
  const { data, error } = await supabase
    .from('guardian_qa_drift_reports')
    .insert({
      tenant_id: tenantId,
      schedule_id: scheduleId,
      baseline_id: baselineId,
      comparison_run_id: comparisonRunId,
      created_at: new Date().toISOString(),
      status: 'completed',
      severity: driftResult.severity,
      summary: {
        baselineMetrics: baseline,
        currentMetrics: current,
        deltas: driftResult.deltas,
        flags: driftResult.flags,
      },
      details: {
        summaryMarkdown: driftResult.summaryMarkdown,
      },
      created_by: createdBy,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create drift report: ${error.message}`);
  }

  return data as GuardianQaDriftReport;
}

/**
 * List recent drift reports for a tenant
 */
export async function listDriftReports(
  tenantId: string,
  filters?: {
    severity?: string;
    scheduleId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<GuardianQaDriftReport[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_qa_drift_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.scheduleId) {
    query = query.eq('schedule_id', filters.scheduleId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list drift reports: ${error.message}`);
  }

  return (data || []) as GuardianQaDriftReport[];
}

/**
 * Get a single drift report
 */
export async function getDriftReport(
  tenantId: string,
  reportId: string
): Promise<GuardianQaDriftReport> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_drift_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', reportId)
    .single();

  if (error) {
    throw new Error(`Failed to get drift report: ${error.message}`);
  }

  return data as GuardianQaDriftReport;
}
