import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { addClusterAnnotation } from '@/lib/guardian/ai/correlationRefinementOrchestrator';

/**
 * GET /api/guardian/correlation/annotations
 * List annotations (optionally filtered by cluster_id)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const clusterId = req.nextUrl.searchParams.get('clusterId');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);

  let query = supabase
    .from('guardian_correlation_cluster_annotations')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (clusterId) {
    query = query.eq('cluster_id', clusterId);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse('Failed to fetch annotations', 500);
  }

  return successResponse({
    annotations: data || [],
    count: (data || []).length,
  });
});

/**
 * POST /api/guardian/correlation/annotations
 * Create annotation for a cluster (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const body = await req.json();
  const { clusterId, label, category, notes, tags } = body;

  if (!clusterId || !label) {
    return errorResponse('clusterId and label are required', 400);
  }

  try {
    const annotation = await addClusterAnnotation(workspaceId, clusterId, label, {
      category,
      notes,
      tags,
    });

    return successResponse(annotation);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to create annotation: ${msg}`, 500);
  }
});
