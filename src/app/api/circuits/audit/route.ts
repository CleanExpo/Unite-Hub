/**
 * Circuit Audit & Metrics API
 * Retrieve execution history and performance metrics
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getCircuitExecutionHistory,
  getCircuitMetrics,
} from '@/lib/decision-circuits';

interface AuditQueryParams {
  clientId?: string;
  circuitId?: string;
  limit?: number;
  days?: number;
}

/**
 * Get circuit execution history and metrics
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const clientId = req.nextUrl.searchParams.get('clientId');
  const circuitId = req.nextUrl.searchParams.get('circuitId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

  if (!clientId) {
    return errorResponse('clientId required', 400);
  }

  try {
    const [history, metrics] = await Promise.all([
      getCircuitExecutionHistory(workspaceId, clientId, limit),
      circuitId
        ? getCircuitMetrics(workspaceId, circuitId, days)
        : Promise.resolve(null),
    ]);

    return successResponse({
      workspace_id: workspaceId,
      client_id: clientId,
      circuit_id: circuitId,
      execution_history: history.map((log) => ({
        circuit_id: log.circuit_id,
        execution_id: log.execution_id,
        timestamp: new Date(log.timestamp).toISOString(),
        success: log.success,
        latency_ms: log.latency_ms,
        confidence_score: log.confidence_score,
        decision_path: log.decision_path,
        error: log.error,
      })),
      metrics: metrics
        ? {
            total_executions: metrics.total_executions,
            success_rate: metrics.success_rate,
            avg_latency_ms: metrics.avg_latency_ms,
            error_count: metrics.error_count,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve audit data',
      500
    );
  }
});
