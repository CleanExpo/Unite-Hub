import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Retrieve a single uplift plan with its tasks
 */
export const GET = withErrorBoundary(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Get plan
  const { data: plan, error: planError } = await supabase
    .from('guardian_tenant_uplift_plans')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (planError || !plan) {
    return errorResponse('Plan not found', 404);
  }

  // Get tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select('*')
    .eq('plan_id', id)
    .eq('tenant_id', workspaceId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (tasksError) {
    return errorResponse('Failed to retrieve tasks', 500);
  }

  return successResponse({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    targetOverallScore: plan.target_overall_score,
    targetOverallStatus: plan.target_overall_status,
    readinessSnapshotAt: plan.readiness_snapshot_at,
    source: plan.source,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    tasks: (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      effortEstimate: t.effort_estimate,
      dueDate: t.due_date,
      owner: t.owner,
      capabilityKey: t.capability_key,
      recommendationId: t.recommendation_id,
      hints: t.hints,
    })),
  });
});

/**
 * PATCH: Update plan status and metadata
 */
export const PATCH = withErrorBoundary(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { status, name, description } = body;

  // Validate status transition
  const validStatuses = ['draft', 'active', 'completed', 'archived'];
  if (status && !validStatuses.includes(status)) {
    return errorResponse('Invalid status', 400);
  }

  const supabase = getSupabaseServer();

  // Check plan exists
  const { data: plan } = await supabase
    .from('guardian_tenant_uplift_plans')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (!plan) {
    return errorResponse('Plan not found', 404);
  }

  // Update plan
  const { data: updated, error } = await supabase
    .from('guardian_tenant_uplift_plans')
    .update({
      ...(status && { status }),
      ...(name && { name }),
      ...(description && { description }),
      updated_at: new Date(),
    })
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select('*')
    .single();

  if (error) {
    return errorResponse('Failed to update plan', 500);
  }

  return successResponse({
    id: updated.id,
    status: updated.status,
    name: updated.name,
    description: updated.description,
    updatedAt: updated.updated_at,
  });
});
