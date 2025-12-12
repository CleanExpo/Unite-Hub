/**
 * GET /api/guardian/meta/automation/schedules/[id] - Get schedule
 * PATCH /api/guardian/meta/automation/schedules/[id] - Update schedule (admin-only)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_automation_schedules')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (error) throw error;

  return successResponse(data);
});

export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });
  const supabase = getSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from('guardian_meta_automation_schedules')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select('*')
    .single();

  if (error) throw error;

  return successResponse(data);
});
