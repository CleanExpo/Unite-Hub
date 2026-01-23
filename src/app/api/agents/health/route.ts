/**
 * API Routes: Agent Health Status
 * Query agent health and degradation status
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getHealthMonitor } from '@/lib/agents/metrics/healthMonitor';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/agents/health
 * Get health status for agents in a workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const agentName = req.nextUrl.searchParams.get('agentName');
  const monitor = getHealthMonitor();

  // If specific agent requested
  if (agentName) {
    const health = await monitor.updateAgentHealth(agentName, workspaceId);
    return successResponse(health);
  }

  // Otherwise return dashboard for all agents
  const dashboard = await monitor.getHealthDashboard(workspaceId);
  return successResponse(dashboard);
});

/**
 * POST /api/agents/health/refresh
 * Manually trigger health check for a workspace
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const monitor = getHealthMonitor();
  const healthUpdates = await monitor.updateAllAgentsHealth(workspaceId);

  return successResponse({
    message: 'Health check completed',
    agents_updated: healthUpdates.length,
    health_status: healthUpdates
  });
});
