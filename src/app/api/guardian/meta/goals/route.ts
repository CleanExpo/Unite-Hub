import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { loadProgramGoalsForTenant, persistProgramGoal, type ProgramGoal } from '@/lib/guardian/meta/programGoalService';

/**
 * GET /api/guardian/meta/goals
 * List all program goals for a workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const goals = await loadProgramGoalsForTenant(workspaceId);
  const supabase = getSupabaseServer();

  // Load OKR/KPI counts for each goal
  const goalsWithCounts = await Promise.all(
    goals.map(async (goal) => {
      if (!goal.id) return { ...goal, okrCount: 0, kpiCount: 0 };

      const { count: okrCount } = await supabase
        .from('guardian_program_okrs')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', goal.id)
        .eq('tenant_id', workspaceId);

      const { count: kpiCount } = await supabase
        .from('guardian_program_kpis')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', workspaceId);

      // This is a rough estimate; ideally would join through OKRs
      return {
        ...goal,
        okrCount: okrCount || 0,
        kpiCount: kpiCount || 0,
      };
    })
  );

  return successResponse({
    goals: goalsWithCounts,
    total: goalsWithCounts.length,
  });
});

/**
 * POST /api/guardian/meta/goals
 * Create a new program goal
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const {
    goal_key,
    title,
    description,
    timeframe_start,
    timeframe_end,
    owner,
    category = 'governance',
    status = 'draft',
  } = body;

  if (!goal_key || !title || !description || !timeframe_start || !timeframe_end) {
    return errorResponse('Missing required fields: goal_key, title, description, timeframe_start, timeframe_end', 400);
  }

  const goal: ProgramGoal = {
    tenantId: workspaceId,
    goalKey: goal_key,
    title,
    description,
    timeframeStart: new Date(timeframe_start),
    timeframeEnd: new Date(timeframe_end),
    owner,
    category: category || 'governance',
    status: status || 'draft',
  };

  const persisted = await persistProgramGoal(goal);

  return successResponse(
    {
      goal: persisted,
      message: 'Goal created successfully',
    },
    { status: 201 }
  );
});
