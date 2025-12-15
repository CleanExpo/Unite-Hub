/**
 * Decision Circuits Health Monitoring
 * Production observability for circuit execution, autonomy, and system health
 */

import { createClient } from '@/lib/supabase/server';
import {
  PRODUCTION_HEALTH_CHECKS,
  executeHealthCheckAction,
  checkProductionHealth,
} from './enforcement';

export interface HealthMetrics {
  workspace_id: string;
  timestamp: number;
  circuit_success_rate: number;
  circuit_avg_latency_ms: number;
  circuit_avg_confidence: number;
  autocorrection_count_24h: number;
  escalation_count_24h: number;
  strategy_rotation_count_24h: number;
  brand_violation_rate_7d: number;
  system_healthy: boolean;
  health_checks_passed: number;
  health_checks_total: number;
}

export interface CircuitHealthSnapshot {
  circuit_id: string;
  success_rate: number;
  avg_latency_ms: number;
  error_count: number;
  total_executions: number;
  avg_confidence: number;
}

/**
 * Collect comprehensive health metrics
 */
export async function collectHealthMetrics(
  workspace_id: string
): Promise<HealthMetrics> {
  const supabase = createClient();
  const now = Date.now();
  const _24h_ago = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const _7d_ago = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Collect execution metrics (24h)
  const { data: execLogs } = await supabase
    .from('circuit_execution_logs')
    .select('success, latency_ms, confidence_score')
    .eq('workspace_id', workspace_id)
    .gte('timestamp', _24h_ago);

  const execLogsData = execLogs || [];
  const successCount = execLogsData.filter(
    (log: { success: boolean }) => log.success
  ).length;
  const totalExecs = execLogsData.length;
  const successRate = totalExecs > 0 ? successCount / totalExecs : 0;
  const avgLatency =
    totalExecs > 0
      ? execLogsData.reduce((sum, log: { latency_ms: number }) => sum + (log.latency_ms || 0), 0) /
        totalExecs
      : 0;
  const avgConfidence =
    totalExecs > 0
      ? execLogsData.reduce(
          (sum, log: { confidence_score?: number }) =>
            sum + (log.confidence_score || 0),
          0
        ) / totalExecs
      : 0;

  // Autocorrection activity (24h)
  const { data: autoCorrections } = await supabase
    .from('circuit_autocorrection_logs')
    .select('action_type')
    .eq('workspace_id', workspace_id)
    .gte('timestamp', _24h_ago);

  const autoCorrectionData = autoCorrections || [];
  const escalationCount = autoCorrectionData.filter(
    (log: { action_type: string }) => log.action_type === 'escalate_to_admin'
  ).length;
  const rotationCount = autoCorrectionData.filter(
    (log: { action_type: string }) => log.action_type === 'rotate_strategy'
  ).length;

  // Brand violations (7d)
  const { data: brandLogs } = await supabase
    .from('circuit_execution_logs')
    .select('outputs')
    .eq('workspace_id', workspace_id)
    .eq('circuit_id', 'CX05_BRAND_GUARD')
    .gte('timestamp', _7d_ago);

  const brandLogsData = brandLogs || [];
  const violationCount = (
    brandLogsData as Array<{ outputs: Record<string, unknown> }>
  ).filter(
    (log) =>
      log.outputs &&
      (log.outputs as Record<string, unknown>).violations &&
      Array.isArray(
        (log.outputs as Record<string, unknown>).violations
      ) &&
      ((log.outputs as Record<string, unknown>)
        .violations as unknown[]).length > 0
  ).length;
  const brandViolationRate =
    brandLogsData.length > 0 ? violationCount / brandLogsData.length : 0;

  // Run health checks
  const healthCheck = await checkProductionHealth(workspace_id);

  return {
    workspace_id,
    timestamp: now,
    circuit_success_rate: successRate,
    circuit_avg_latency_ms: avgLatency,
    circuit_avg_confidence: avgConfidence,
    autocorrection_count_24h: autoCorrectionData.length,
    escalation_count_24h: escalationCount,
    strategy_rotation_count_24h: rotationCount,
    brand_violation_rate_7d: brandViolationRate,
    system_healthy: healthCheck.healthy,
    health_checks_passed: healthCheck.checks.filter((c) => c.passed).length,
    health_checks_total: healthCheck.checks.length,
  };
}

/**
 * Get health snapshot for a circuit
 */
export async function getCircuitHealthSnapshot(
  workspace_id: string,
  circuit_id: string,
  days: number = 30
): Promise<CircuitHealthSnapshot> {
  const supabase = createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('circuit_execution_logs')
    .select('success, latency_ms, confidence_score')
    .eq('workspace_id', workspace_id)
    .eq('circuit_id', circuit_id)
    .gte('timestamp', since);

  const logs = data || [];
  const successCount = logs.filter((log: { success: boolean }) => log.success).length;
  const totalExecs = logs.length;
  const errorCount = totalExecs - successCount;

  return {
    circuit_id,
    success_rate: totalExecs > 0 ? successCount / totalExecs : 0,
    avg_latency_ms:
      totalExecs > 0
        ? logs.reduce((sum, log: { latency_ms: number }) => sum + (log.latency_ms || 0), 0) /
          totalExecs
        : 0,
    error_count: errorCount,
    total_executions: totalExecs,
    avg_confidence:
      totalExecs > 0
        ? logs.reduce(
            (sum, log: { confidence_score?: number }) =>
              sum + (log.confidence_score || 0),
            0
          ) / totalExecs
        : 0,
  };
}

/**
 * Run continuous health monitoring
 * Execute health checks and trigger actions if thresholds exceeded
 */
export async function runHealthMonitoring(
  workspace_id: string
): Promise<{
  metrics: HealthMetrics;
  checks_performed: number;
  actions_triggered: string[];
}> {
  const metrics = await collectHealthMetrics(workspace_id);
  const healthCheck = await checkProductionHealth(workspace_id);
  const actions_triggered: string[] = [];

  // Execute actions for failed checks
  for (const check of healthCheck.checks) {
    if (!check.passed && check.action) {
      await executeHealthCheckAction(
        workspace_id,
        check.action as 'trigger_autocorrection_review' | 'freeze_strategy_rotation' | 'tighten_guard_constraints'
      );
      actions_triggered.push(`${check.check_id}: ${check.action}`);
    }
  }

  return {
    metrics,
    checks_performed: healthCheck.checks.length,
    actions_triggered,
  };
}

/**
 * Generate health report for dashboard
 */
export async function generateHealthReport(
  workspace_id: string
): Promise<{
  summary: HealthMetrics;
  circuit_snapshots: CircuitHealthSnapshot[];
  recommendations: string[];
  critical_issues: string[];
}> {
  const metrics = await collectHealthMetrics(workspace_id);
  const circuits = [
    'CX01_INTENT_DETECTION',
    'CX02_AUDIENCE_CLASSIFICATION',
    'CX03_STATE_MEMORY_RETRIEVAL',
    'CX04_CONTENT_STRATEGY_SELECTION',
    'CX05_BRAND_GUARD',
    'CX06_GENERATION_EXECUTION',
    'CX07_ENGAGEMENT_EVALUATION',
    'CX08_SELF_CORRECTION',
  ];

  const snapshots = await Promise.all(
    circuits.map((circuit) =>
      getCircuitHealthSnapshot(workspace_id, circuit, 30)
    )
  );

  const recommendations: string[] = [];
  const critical_issues: string[] = [];

  // Generate recommendations based on metrics
  if (metrics.circuit_success_rate < 0.95) {
    recommendations.push(
      `Circuit success rate is ${(metrics.circuit_success_rate * 100).toFixed(1)}% - review error logs`
    );
  }

  if (metrics.circuit_avg_latency_ms > 500) {
    recommendations.push(
      `Average latency is ${metrics.circuit_avg_latency_ms.toFixed(0)}ms - optimize circuit logic`
    );
  }

  if (metrics.circuit_avg_confidence < 0.85) {
    recommendations.push(
      'Average confidence below 0.85 - review constraint logic'
    );
  }

  if (metrics.brand_violation_rate_7d > 0.01) {
    critical_issues.push(
      `Brand guard violations exceed 1%: ${(metrics.brand_violation_rate_7d * 100).toFixed(2)}%`
    );
  }

  if (metrics.escalation_count_24h > 5) {
    critical_issues.push(
      `High escalation rate: ${metrics.escalation_count_24h} escalations in 24h`
    );
  }

  // Circuit-specific recommendations
  for (const snapshot of snapshots) {
    if (snapshot.success_rate < 0.92) {
      recommendations.push(
        `${snapshot.circuit_id}: Success rate ${(snapshot.success_rate * 100).toFixed(1)}%`
      );
    }

    if (snapshot.error_count > 10) {
      critical_issues.push(
        `${snapshot.circuit_id}: ${snapshot.error_count} errors detected`
      );
    }
  }

  return {
    summary: metrics,
    circuit_snapshots: snapshots,
    recommendations,
    critical_issues,
  };
}

/**
 * Export health metrics to monitoring system
 */
export async function exportHealthMetrics(
  workspace_id: string
): Promise<Record<string, unknown>> {
  const metrics = await collectHealthMetrics(workspace_id);

  return {
    timestamp: new Date(metrics.timestamp).toISOString(),
    workspace_id,
    metrics: {
      'circuits.success_rate': metrics.circuit_success_rate,
      'circuits.avg_latency_ms': metrics.circuit_avg_latency_ms,
      'circuits.avg_confidence': metrics.circuit_avg_confidence,
      'autonomy.autocorrections_24h': metrics.autocorrection_count_24h,
      'autonomy.escalations_24h': metrics.escalation_count_24h,
      'autonomy.rotations_24h': metrics.strategy_rotation_count_24h,
      'compliance.brand_violation_rate_7d': metrics.brand_violation_rate_7d,
      'system.healthy': metrics.system_healthy ? 1 : 0,
    },
  };
}
