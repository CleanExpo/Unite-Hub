import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/guardian/meta/playbooks/[id]
 * Fetch playbook with all sections and tags
 */
export const GET = withErrorBoundary(async (
  req: NextRequest,
  context: RouteContext
) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
return errorResponse('workspaceId required', 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: playbook, error } = await supabase
    .from('guardian_playbooks')
    .select(`
      id,
      key,
      title,
      summary,
      category,
      complexity,
      is_global,
      is_active,
      estimated_duration_minutes,
      metadata,
      created_at,
      updated_at,
      guardian_playbook_sections (
        id,
        order_index,
        heading,
        body,
        section_type,
        metadata
      ),
      guardian_playbook_tags (
        id,
        tag_key,
        source_domain,
        metadata
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Playbook not found', 404);
    }
    throw error;
  }

  return successResponse({ playbook });
});

/**
 * PATCH /api/guardian/meta/playbooks/[id]
 * Update playbook metadata (title, summary, category, etc.)
 */
export const PATCH = withErrorBoundary(async (
  req: NextRequest,
  context: RouteContext
) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
return errorResponse('workspaceId required', 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const body = await req.json();
  const { title, summary, category, complexity, is_active, metadata } = body;

  const supabase = await createClient();

  // Verify playbook belongs to workspace
  const { data: existing, error: checkError } = await supabase
    .from('guardian_playbooks')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (checkError || !existing) {
    return errorResponse('Playbook not found or access denied', 404);
  }

  // Build update object
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (title !== undefined) {
updates.title = title;
}
  if (summary !== undefined) {
updates.summary = summary;
}
  if (category !== undefined) {
updates.category = category;
}
  if (complexity !== undefined) {
updates.complexity = complexity;
}
  if (is_active !== undefined) {
updates.is_active = is_active;
}
  if (metadata !== undefined) {
updates.metadata = metadata;
}

  const { data: playbook, error: updateError } = await supabase
    .from('guardian_playbooks')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
throw updateError;
}

  return successResponse({ playbook });
});

/**
 * DELETE /api/guardian/meta/playbooks/[id]
 * Delete playbook and cascade child tables
 */
export const DELETE = withErrorBoundary(async (
  req: NextRequest,
  context: RouteContext
) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
return errorResponse('workspaceId required', 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify playbook belongs to workspace
  const { data: existing, error: checkError } = await supabase
    .from('guardian_playbooks')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (checkError || !existing) {
    return errorResponse('Playbook not found or access denied', 404);
  }

  // Delete playbook (cascades to sections and tags)
  const { error: deleteError } = await supabase
    .from('guardian_playbooks')
    .delete()
    .eq('id', id);

  if (deleteError) {
throw deleteError;
}

  return successResponse({ message: 'Playbook deleted successfully' });
});
