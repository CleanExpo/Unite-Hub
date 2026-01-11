import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { generateAndPersistUpliftPlanForTenant } from '@/lib/guardian/meta/upliftPlanService';

/**
 * GET: List uplift plans for a tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 200);

  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_tenant_uplift_plans')
    .select('id, name, status, created_at, updated_at, target_overall_score, target_overall_status, source')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: plans, error } = await query;

  if (error) {
    return errorResponse('Failed to retrieve plans', 500);
  }

  return successResponse({
    plans: plans || [],
    count: (plans || []).length,
  });
});

/**
 * POST: Generate and create a new uplift plan
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { nameOverride, descriptionOverride, includeRecommendations } = body;

  const { planId } = await generateAndPersistUpliftPlanForTenant(workspaceId, {
    now: new Date(),
    nameOverride,
    descriptionOverride,
    includeRecommendations: includeRecommendations ?? true,
  });

  return successResponse({
    planId,
    message: 'Uplift plan generated successfully',
  });
});
