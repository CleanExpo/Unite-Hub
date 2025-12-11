/**
 * GET /api/guardian/admin/drills/[id] — Get drill details
 * PATCH /api/guardian/admin/drills/[id] — Update drill
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
  const supabase = getSupabaseServer();

  // Get drill
  const { data: drill, error: drillError } = await supabase
    .from('guardian_incident_drills')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .single();

  if (drillError || !drill) {
    return errorResponse('Drill not found', 404);
  }

  // Get events
  const { data: events, error: eventsError } = await supabase
    .from('guardian_incident_drill_events')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('drill_id', id)
    .order('sequence_index', { ascending: true });

  if (eventsError) {
    return errorResponse(`Failed to load events: ${eventsError.message}`, 500);
  }

  return successResponse({
    drill,
    events: events || [],
  });
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

  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_incident_drills')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', workspaceId)
    .eq('id', id);

  if (error) {
    return errorResponse(`Failed to update drill: ${error.message}`, 500);
  }

  return successResponse({ success: true });
});
