import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { createCycle, listCycles } from '@/lib/guardian/meta/improvementCycleService';

/**
 * GET /api/guardian/meta/improvement/cycles
 * List improvement cycles for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const status = req.nextUrl.searchParams.get('status') || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  const { cycles, total } = await listCycles(workspaceId, {
    status: status as any,
    limit,
    offset,
  });

  return successResponse({ cycles, total, limit, offset });
});

/**
 * POST /api/guardian/meta/improvement/cycles
 * Create new improvement cycle (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();

  if (
    !body.cycleKey ||
    !body.title ||
    !body.description ||
    !body.periodStart ||
    !body.periodEnd ||
    !body.focusDomains ||
    !Array.isArray(body.focusDomains) ||
    body.focusDomains.length === 0
  ) {
    return errorResponse('cycleKey, title, description, periodStart, periodEnd, focusDomains[] required', 400);
  }

  try {
    const { cycleId } = await createCycle(
      workspaceId,
      {
        cycleKey: body.cycleKey,
        title: body.title,
        description: body.description,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        focusDomains: body.focusDomains,
        owner: body.owner,
      },
      body.actor
    );

    return successResponse({ cycleId, status: 'active' }, 201);
  } catch (error) {
    console.error('[Z12 Improvement API] Failed to create cycle:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create cycle', 500);
  }
});
