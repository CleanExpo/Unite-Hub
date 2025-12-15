/**
 * Circuit Release Control API
 * Autonomous canary rollout, validation, and automatic rollback
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  createCircuitVersion,
  startCanaryRollout,
  progressCanaryPhase,
  evaluateRollbackTriggers,
  executeAutomaticRollback,
  monitorCanaryRelease,
  getCanaryReleaseReport,
  getReleaseState,
} from '@/lib/decision-circuits/release-control';

/**
 * GET: Retrieve release status and report
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const action = req.nextUrl.searchParams.get('action');

  try {
    if (action === 'status') {
      // Get current release state
      const state = await getReleaseState(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        current_phase: state.current_phase,
        current_version_id: state.current_version_id,
        traffic_percent:
          state.current_phase === 'canary_10'
            ? 10
            : state.current_phase === 'canary_50'
              ? 50
              : 100,
        phase_started_at: state.phase_started_at,
        ready_for_next_phase: state.ready_for_next_phase,
        health_checks_passing: state.health_checks_passing,
        can_rollback: state.can_rollback,
      });
    }

    if (action === 'report') {
      // Get full canary release report
      const report = await getCanaryReleaseReport(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        current_phase: report.current_state.current_phase,
        current_version_id: report.current_state.current_version_id,
        previous_version_id: report.current_state.previous_version_id,
        timeline: report.release_timeline,
        recent_events: report.recent_events,
        metrics: {
          current_version_health:
            report.current_version?.health_score || 0,
          previous_version_health:
            report.previous_version?.health_score || 0,
          can_rollback: report.current_state.can_rollback,
        },
      });
    }

    // Default: Get status
    const state = await getReleaseState(workspaceId);

    return successResponse({
      workspace_id: workspaceId,
      release_status: {
        phase: state.current_phase,
        version: state.current_version_id,
        traffic_percent:
          state.current_phase === 'canary_10'
            ? 10
            : state.current_phase === 'canary_50'
              ? 50
              : 100,
      },
      state: state,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve release status',
      500
    );
  }
});

/**
 * POST: Start canary rollout or manage release
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const action = req.nextUrl.searchParams.get('action');
  const body = await req.json();

  try {
    if (action === 'start_canary') {
      // Create new circuit version
      const { circuit_id, version_number } = body;

      if (!circuit_id || !version_number) {
        return errorResponse('circuit_id and version_number required', 400);
      }

      const version = await createCircuitVersion(
        workspaceId,
        circuit_id,
        version_number
      );

      // Start canary rollout
      const rollout = await startCanaryRollout(workspaceId, version.version_id);

      return successResponse({
        workspace_id: workspaceId,
        rollout_status: rollout,
        version_id: version.version_id,
        initial_traffic_percent: 10,
      });
    }

    if (action === 'progress_canary') {
      // Progress to next canary phase
      const progress = await progressCanaryPhase(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        progress_status: progress,
      });
    }

    if (action === 'evaluate_rollback') {
      // Check if rollback should trigger
      const evaluation = await evaluateRollbackTriggers(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        should_rollback: evaluation.should_rollback,
        trigger: evaluation.trigger,
        reason: evaluation.reason,
      });
    }

    if (action === 'execute_rollback') {
      // Manually execute rollback
      const { trigger } = body;

      if (!trigger) {
        return errorResponse('trigger required', 400);
      }

      const rollback = await executeAutomaticRollback(
        workspaceId,
        trigger,
        `Manual rollback request: ${trigger.metric}`
      );

      return successResponse({
        workspace_id: workspaceId,
        rollback_status: rollback,
      });
    }

    if (action === 'monitor') {
      // Run monitoring and auto-progress/rollback
      const monitoring = await monitorCanaryRelease(workspaceId);

      return successResponse({
        workspace_id: workspaceId,
        monitoring_result: {
          status: monitoring.status,
          actions_taken: monitoring.actions_taken,
          current_phase: monitoring.current_phase,
        },
      });
    }

    return errorResponse('action parameter required', 400);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Release control operation failed',
      500
    );
  }
});
