/**
 * API Routes: Agent Budgets
 * CRUD operations for agent budget limits
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBudgetEnforcer } from '@/lib/agents/cost/budgetEnforcer';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/agents/budgets
 * List all budgets for a workspace or get specific agent budget
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
  const enforcer = getBudgetEnforcer();

  if (agentName) {
    // Get specific agent budget
    const budget = await enforcer.getBudget(agentName, workspaceId);
    return successResponse(budget);
  }

  // Get all budgets
  const budgets = await enforcer.getAllBudgets(workspaceId);
  return successResponse(budgets);
});

/**
 * POST /api/agents/budgets
 * Create or update agent budget
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const {
    agent_name,
    daily_budget_usd,
    monthly_budget_usd,
    per_execution_limit_usd,
    pause_on_exceed,
    alert_at_percentage
  } = body;

  if (!agent_name) {
    return errorResponse('agent_name required', 400);
  }

  const enforcer = getBudgetEnforcer();
  const budget = await enforcer.setBudget(agent_name, workspaceId, {
    daily_budget_usd,
    monthly_budget_usd,
    per_execution_limit_usd,
    pause_on_exceed,
    alert_at_percentage
  });

  return successResponse(budget, 201);
});

/**
 * POST /api/agents/budgets/check
 * Check if estimated cost is within budget
 */
export const PUT = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const agentName = req.nextUrl.searchParams.get('agentName');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!agentName) {
    return errorResponse('agentName required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { estimated_cost_usd } = body;

  if (estimated_cost_usd === undefined) {
    return errorResponse('estimated_cost_usd required', 400);
  }

  const enforcer = getBudgetEnforcer();
  const status = await enforcer.checkBudget(agentName, workspaceId, estimated_cost_usd);

  return successResponse(status);
});
