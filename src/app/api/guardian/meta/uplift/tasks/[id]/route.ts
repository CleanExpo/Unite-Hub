import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * PATCH: Update uplift task status, priority, due date, and owner
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
  const { status, priority, dueDate, owner } = body;

  // Validate status if provided
  const validStatuses = ['todo', 'in_progress', 'blocked', 'done'];
  if (status && !validStatuses.includes(status)) {
    return errorResponse('Invalid status', 400);
  }

  // Validate priority if provided
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (priority && !validPriorities.includes(priority)) {
    return errorResponse('Invalid priority', 400);
  }

  const supabase = getSupabaseServer();

  // Get task and verify it belongs to current tenant via plan
  const { data: task } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .select(
      `
      id,
      plan_id,
      guardian_tenant_uplift_plans(tenant_id)
      `
    )
    .eq('id', id)
    .single();

  if (!task) {
    return errorResponse('Task not found', 404);
  }

  // Verify task belongs to current workspace via plan tenant_id
  if (task.guardian_tenant_uplift_plans?.tenant_id !== workspaceId) {
    return errorResponse('Unauthorized', 403);
  }

  // Build update object with only provided fields
  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (dueDate !== undefined) updateData.due_date = dueDate;
  if (owner !== undefined) updateData.owner = owner;

  // Add updated_at
  updateData.updated_at = new Date();

  // Update task
  const { data: updated, error } = await supabase
    .from('guardian_tenant_uplift_tasks')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return errorResponse('Failed to update task', 500);
  }

  return successResponse({
    id: updated.id,
    status: updated.status,
    priority: updated.priority,
    dueDate: updated.due_date,
    owner: updated.owner,
    updatedAt: updated.updated_at,
  });
});
