import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getExportBundle } from '@/lib/guardian/meta/exportBundleService';

/**
 * GET /api/guardian/meta/exports/[id]
 * Fetch export bundle metadata and manifest
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: bundleId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!bundleId) {
    return errorResponse('bundleId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const bundle = await getExportBundle(workspaceId, bundleId);

  if (!bundle) {
    return errorResponse('Bundle not found', 404);
  }

  return successResponse({ bundle });
});

/**
 * PATCH /api/guardian/meta/exports/[id]
 * Update bundle metadata or archive
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: bundleId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!bundleId) {
    return errorResponse('bundleId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();

  const supabase = getSupabaseServer();

  // Verify ownership
  const { data: bundle } = await supabase
    .from('guardian_meta_export_bundles')
    .select('id, tenant_id')
    .eq('id', bundleId)
    .eq('tenant_id', workspaceId)
    .single();

  if (!bundle) {
    return errorResponse('Bundle not found', 404);
  }

  // Build update object
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (body.label !== undefined) {
    updates.label = body.label;
  }

  if (body.description !== undefined) {
    updates.description = body.description;
  }

  // Allow archiving
  if (body.status === 'archived') {
    updates.status = 'archived';
  }

  const { data: updated, error } = await supabase
    .from('guardian_meta_export_bundles')
    .update(updates)
    .eq('id', bundleId)
    .select('*')
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ bundle: updated });
});
