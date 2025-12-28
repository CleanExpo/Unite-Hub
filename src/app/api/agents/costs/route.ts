/**
 * API Routes: Agent Cost Analysis
 * Query AI spend by agent, model, and time period
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getMetricsCollector } from '@/lib/agents/metrics/metricsCollector';

/**
 * GET /api/agents/costs
 * Get cost breakdown and analysis
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const hoursAgo = parseInt(req.nextUrl.searchParams.get('hoursAgo') || '24');
  const collector = getMetricsCollector();

  // Get cost breakdown by model
  const byModel = await collector.getCostBreakdown(workspaceId, hoursAgo);

  // Get top expensive agents
  const topAgents = await collector.getTopExpensiveAgents(workspaceId, hoursAgo, 10);

  // Calculate total
  const totalCost = Object.values(byModel).reduce((sum, cost) => sum + cost, 0);

  return successResponse({
    workspace_id: workspaceId,
    hours_ago: hoursAgo,
    total_cost_usd: Math.round(totalCost * 100) / 100,
    by_model: byModel,
    top_agents: topAgents,
    meta: {
      generated_at: new Date().toISOString(),
      period: `Last ${hoursAgo} hours`
    }
  });
});
