/**
 * Circuit Health & Production Monitoring API
 * Production observability and enforcement status
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  collectHealthMetrics,
  getCircuitHealthSnapshot,
  generateHealthReport,
  exportHealthMetrics,
  runHealthMonitoring,
} from '@/lib/decision-circuits/health-monitor';
import {
  runDeploymentPreflightCheck,
  checkProductionHealth,
} from '@/lib/decision-circuits/enforcement';

/**
 * GET: Retrieve health metrics and status
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const action = req.nextUrl.searchParams.get('action');
  const circuitId = req.nextUrl.searchParams.get('circuitId');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

  try {
    if (action === 'circuit_snapshot' && circuitId) {
      // Get specific circuit health
      const snapshot = await getCircuitHealthSnapshot(
        workspaceId,
        circuitId,
        days
      );

      return successResponse({
        workspace_id: workspaceId,
        circuit_id: circuitId,
        period_days: days,
        snapshot: {
          circuit_id: snapshot.circuit_id,
          success_rate: snapshot.success_rate,
          avg_latency_ms: snapshot.avg_latency_ms,
          error_count: snapshot.error_count,
          total_executions: snapshot.total_executions,
          avg_confidence: snapshot.avg_confidence,
        },
      });
    }

    if (action === 'report') {
      // Generate comprehensive health report
      const report = await generateHealthReport(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        generated_at: new Date().toISOString(),
        summary: {
          system_healthy: report.summary.system_healthy,
          success_rate: report.summary.circuit_success_rate,
          avg_latency_ms: report.summary.circuit_avg_latency_ms,
          avg_confidence: report.summary.circuit_avg_confidence,
          autocorrections_24h: report.summary.autocorrection_count_24h,
          escalations_24h: report.summary.escalation_count_24h,
          rotations_24h: report.summary.strategy_rotation_count_24h,
          brand_violation_rate_7d: report.summary.brand_violation_rate_7d,
          health_checks: {
            passed: report.summary.health_checks_passed,
            total: report.summary.health_checks_total,
          },
        },
        circuit_health: report.circuit_snapshots.map((snapshot) => ({
          circuit_id: snapshot.circuit_id,
          success_rate: snapshot.success_rate,
          error_count: snapshot.error_count,
          total_executions: snapshot.total_executions,
        })),
        recommendations: report.recommendations,
        critical_issues: report.critical_issues,
      });
    }

    if (action === 'production_health') {
      // Run production health checks
      const health = await checkProductionHealth(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        timestamp: new Date().toISOString(),
        healthy: health.healthy,
        checks: health.checks.map((check) => ({
          check_id: check.check_id,
          passed: check.passed,
          value: check.value,
          threshold: check.threshold,
          action: check.action,
        })),
      });
    }

    // Default: metrics collection
    const metrics = await collectHealthMetrics(workspaceId);

    return successResponse({
      workspace_id: workspaceId,
      timestamp: new Date(metrics.timestamp).toISOString(),
      metrics: {
        circuits: {
          success_rate: metrics.circuit_success_rate,
          avg_latency_ms: metrics.circuit_avg_latency_ms,
          avg_confidence: metrics.circuit_avg_confidence,
        },
        autonomy: {
          autocorrections_24h: metrics.autocorrection_count_24h,
          escalations_24h: metrics.escalation_count_24h,
          rotations_24h: metrics.strategy_rotation_count_24h,
        },
        compliance: {
          brand_violation_rate_7d: metrics.brand_violation_rate_7d,
        },
        system: {
          healthy: metrics.system_healthy,
          health_checks_passed: metrics.health_checks_passed,
          health_checks_total: metrics.health_checks_total,
        },
      },
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Health check failed',
      500
    );
  }
});

/**
 * POST: Run health monitoring and trigger actions
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const action = req.nextUrl.searchParams.get('action');

  try {
    if (action === 'run_monitoring') {
      // Execute full monitoring cycle
      const result = await runHealthMonitoring(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        executed_at: new Date().toISOString(),
        monitoring_result: {
          checks_performed: result.checks_performed,
          actions_triggered: result.actions_triggered,
          system_healthy: result.metrics.system_healthy,
          summary: {
            success_rate: result.metrics.circuit_success_rate,
            avg_latency_ms: result.metrics.circuit_avg_latency_ms,
            escalations_24h: result.metrics.escalation_count_24h,
          },
        },
      });
    }

    if (action === 'preflight_check') {
      // Run deployment pre-flight check
      const check = await runDeploymentPreflightCheck();

      return successResponse({
        workspace_id: workspaceId,
        preflight_check: {
          ready_for_production: check.ready_for_production,
          issues: check.issues,
          warnings: check.warnings,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Default action
    return errorResponse('action parameter required', 400);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Monitoring failed',
      500
    );
  }
});
