/**
 * Circuit Autonomy API
 * Manage self-correction, strategy rotation, and autonomous healing
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  evaluateStrategyHealth,
  executeAutoCorrection,
  updateStrategyMetrics,
  getAutonomyDashboard,
} from '@/lib/decision-circuits/autonomy';

interface EvaluateHealthRequest {
  clientId: string;
  audienceSegment: string;
}

interface UpdateMetricsRequest {
  clientId: string;
  audienceSegment: string;
  engagementScore: number;
  conversionScore: number;
}

/**
 * GET: Retrieve autonomy dashboard and health status
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
  const action = req.nextUrl.searchParams.get('action');

  try {
    if (action === 'health') {
      // Evaluate health for specific client/segment
      const clientId = req.nextUrl.searchParams.get('clientId');
      const audienceSegment = req.nextUrl.searchParams.get('audienceSegment');

      if (!clientId || !audienceSegment) {
        return errorResponse('clientId and audienceSegment required', 400);
      }

      const health = await evaluateStrategyHealth(
        clientId,
        workspaceId,
        audienceSegment
      );

      return successResponse({
        workspace_id: workspaceId,
        client_id: clientId,
        audience_segment: audienceSegment,
        needs_correction: health.needs_correction,
        action: health.action,
        current_state: {
          strategy_id: health.current_state.strategy_id,
          engagement_score: health.current_state.engagement_score,
          conversion_score: health.current_state.conversion_score,
          cycle_count: health.current_state.cycle_count,
          decline_cycles: health.current_state.decline_cycles,
          updated_at: health.current_state.updated_at,
        },
      });
    }

    // Default: dashboard view
    const dashboard = await getAutonomyDashboard(workspaceId, days);

    return successResponse({
      workspace_id: workspaceId,
      days,
      summary: {
        total_corrections: dashboard.total_corrections,
        successful_rotations: dashboard.successful_rotations,
        escalations: dashboard.escalations,
        avg_correction_confidence: dashboard.avg_correction_confidence,
      },
      strategy_states: dashboard.strategy_states.map((state) => ({
        client_id: state.client_id,
        audience_segment: state.audience_segment,
        strategy_id: state.strategy_id,
        engagement_score: state.engagement_score,
        conversion_score: state.conversion_score,
        cycle_count: state.cycle_count,
        decline_cycles: state.decline_cycles,
        updated_at: state.updated_at,
      })),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve autonomy data',
      500
    );
  }
});

/**
 * POST: Evaluate strategy health and trigger corrections
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as EvaluateHealthRequest;
  const { clientId, audienceSegment } = body;

  if (!clientId || !audienceSegment) {
    return errorResponse('clientId and audienceSegment required', 400);
  }

  try {
    // Evaluate health
    const health = await evaluateStrategyHealth(
      clientId,
      workspaceId,
      audienceSegment
    );

    // Execute auto-correction if needed
    let correction_result = null;
    if (health.needs_correction) {
      correction_result = await executeAutoCorrection(
        clientId,
        workspaceId,
        audienceSegment,
        health.action
      );
    }

    return successResponse({
      workspace_id: workspaceId,
      client_id: clientId,
      audience_segment: audienceSegment,
      health_status: {
        needs_correction: health.needs_correction,
        reason: health.action.reason,
        confidence: health.action.confidence,
        action_type: health.action.action_type,
      },
      current_metrics: {
        engagement_score: health.current_state.engagement_score,
        conversion_score: health.current_state.conversion_score,
        cycle_count: health.current_state.cycle_count,
        decline_cycles: health.current_state.decline_cycles,
      },
      correction_result: correction_result
        ? {
            success: correction_result.success,
            new_strategy_id: correction_result.new_strategy_id,
            log_id: correction_result.log_id,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to evaluate health',
      500
    );
  }
});

/**
 * PATCH: Update strategy metrics
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as UpdateMetricsRequest;
  const { clientId, audienceSegment, engagementScore, conversionScore } = body;

  if (
    !clientId ||
    !audienceSegment ||
    engagementScore === undefined ||
    conversionScore === undefined
  ) {
    return errorResponse(
      'clientId, audienceSegment, engagementScore, and conversionScore required',
      400
    );
  }

  try {
    await updateStrategyMetrics(
      clientId,
      workspaceId,
      audienceSegment,
      engagementScore,
      conversionScore
    );

    // Evaluate health after update
    const health = await evaluateStrategyHealth(
      clientId,
      workspaceId,
      audienceSegment
    );

    return successResponse({
      workspace_id: workspaceId,
      client_id: clientId,
      audience_segment: audienceSegment,
      message: 'Metrics updated',
      updated_metrics: {
        engagement_score: engagementScore,
        conversion_score: conversionScore,
      },
      health_status: {
        needs_correction: health.needs_correction,
        reason: health.action.reason,
      },
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update metrics',
      500
    );
  }
});
