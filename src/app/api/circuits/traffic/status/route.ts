/**
 * Traffic Allocation Status Endpoint
 * GET /api/circuits/traffic/status
 *
 * Retrieve current and historical allocation state for an A/B test
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getAllocationState,
  getAllocationHistory,
} from '@/lib/decision-circuits/traffic-allocation-engine';

/**
 * GET /api/circuits/traffic/status?workspaceId=<uuid>&abTestId=<string>&historyLimit=<number>
 * Retrieve current allocation state and history
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const abTestId = req.nextUrl.searchParams.get('abTestId');
  const historyLimitStr = req.nextUrl.searchParams.get('historyLimit') || '50';

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!abTestId) {
    return errorResponse('abTestId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Validate historyLimit
  let historyLimit = 50;
  try {
    historyLimit = Math.min(Math.max(parseInt(historyLimitStr, 10), 1), 500);
  } catch {
    historyLimit = 50;
  }

  const supabase = getSupabaseServer();

  // Verify A/B test exists
  const { data: testData } = await supabase
    .from('circuit_ab_tests')
    .select('id, test_id, test_name, status')
    .eq('workspace_id', workspaceId)
    .eq('test_id', abTestId)
    .single();

  if (!testData) {
    return errorResponse('A/B test not found', 404);
  }

  // Get current allocation state
  const currentState = await getAllocationState(workspaceId, abTestId);

  // Get allocation history
  const history = await getAllocationHistory(workspaceId, abTestId, historyLimit);

  // Get latest allocation event for metadata
  const { data: latestEvent } = await supabase
    .from('traffic_allocation_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();

  // Get rate limit status
  const { data: rateLimitData } = await supabase
    .from('traffic_allocation_limits')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  // Build response
  const response = {
    workspace_id: workspaceId,
    ab_test: {
      test_id: testData.test_id,
      test_name: testData.test_name,
      status: testData.status,
    },
    current_allocation: {
      state: currentState,
      active_variants: currentState.filter((s) => s.is_active).map((s) => ({
        variant_id: s.variant_id,
        allocation_percent: s.allocation_percent,
        applied_at: s.applied_at,
        can_rollback: s.can_rollback,
      })),
      last_applied_at: latestEvent?.triggered_at || null,
      last_event_type: latestEvent?.event_type || null,
    },
    allocation_history: {
      total_changes: history.length,
      recent_changes: history.slice(0, 10).map((event) => ({
        event_id: event.id,
        event_type: event.event_type,
        variant_id: event.variant_id,
        allocation_percent: event.allocation_percent,
        confidence_score: event.confidence_score,
        performance_delta: event.performance_delta,
        rollback_reason: event.rollback_reason,
        triggered_at: event.triggered_at,
      })),
      limit: historyLimit,
    },
    rate_limit: rateLimitData
      ? {
          allocations_today: rateLimitData.allocations_today,
          last_allocation_at: rateLimitData.last_allocation_at,
          reset_at: rateLimitData.reset_at,
          can_allocate:
            rateLimitData.allocations_today < 2 && // Default max 2/day
            (!rateLimitData.last_allocation_at ||
              new Date(rateLimitData.last_allocation_at).getTime() +
                24 * 60 * 60 * 1000 <
                Date.now()),
        }
      : null,
    timestamp: new Date().toISOString(),
  };

  return successResponse(response, 200);
});
