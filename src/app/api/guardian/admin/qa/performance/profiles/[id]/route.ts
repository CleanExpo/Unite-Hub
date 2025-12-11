/**
 * GET /api/guardian/admin/qa/performance/profiles/[id] — Get profile
 * PATCH /api/guardian/admin/qa/performance/profiles/[id] — Update profile
 * DELETE /api/guardian/admin/qa/performance/profiles/[id] — Archive profile
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('guardian_performance_profiles')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', workspaceId)
      .single();

    if (error || !data) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse({ profile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load profile';
    return errorResponse(message, 500);
  }
});

export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON in request body', 400);
  }

  try {
    const supabase = getSupabaseServer();

    const updateData: Record<string, unknown> = {};
    if (body.description !== undefined) {
updateData.description = body.description;
}
    if (body.isActive !== undefined) {
updateData.is_active = body.isActive;
}
    if (body.loadConfig !== undefined) {
updateData.load_config = body.loadConfig;
}
    if (body.sloConfig !== undefined) {
updateData.slo_config = body.sloConfig;
}
    if (body.aiBudget !== undefined) {
updateData.ai_budget = body.aiBudget;
}
    if (body.metadata !== undefined) {
updateData.metadata = body.metadata;
}

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updateData.updated_at = new Date();

    const { data, error } = await supabase
      .from('guardian_performance_profiles')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', workspaceId)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse({ profile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return errorResponse(message, 500);
  }
});

export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const supabase = getSupabaseServer();

    // Soft delete: mark as inactive
    const { error } = await supabase
      .from('guardian_performance_profiles')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', workspaceId);

    if (error) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to archive profile';
    return errorResponse(message, 500);
  }
});
