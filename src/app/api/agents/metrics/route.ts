/**
 * API Routes: Agent Execution Metrics
 * Query agent performance, costs, and business metrics
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getMetricsCollector } from '@/lib/agents/metrics/metricsCollector';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/agents/metrics
 * Get aggregated metrics for an agent
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const agentName = req.nextUrl.searchParams.get('agentName');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!agentName) {
    return errorResponse('agentName required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const hoursAgo = parseInt(req.nextUrl.searchParams.get('hoursAgo') || '24');
  const collector = getMetricsCollector();

  const metrics = await collector.getAgentMetrics(agentName, workspaceId, hoursAgo);

  return successResponse({
    agent_name: agentName,
    workspace_id: workspaceId,
    hours_ago: hoursAgo,
    metrics
  });
});
