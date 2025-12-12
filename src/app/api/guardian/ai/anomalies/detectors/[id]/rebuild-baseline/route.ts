import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { buildAndStoreBaseline } from '@/lib/guardian/ai/anomalyBaselineService';

/**
 * POST /api/guardian/ai/anomalies/detectors/[id]/rebuild-baseline
 * Rebuild baseline for a detector (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  // Verify detector exists and belongs to tenant
  const { data: detector, error: detectorError } = await supabase
    .from('guardian_anomaly_detectors')
    .select('id, is_active, method, metric_key')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (detectorError || !detector) {
    return errorResponse('Detector not found', 404);
  }

  try {
    // Build and store baseline
    const result = await buildAndStoreBaseline(workspaceId, id);

    return successResponse({
      baselineId: result.baselineId,
      detectorId: id,
      datapoints: result.datapoints,
      method: detector.method,
      computedAt: new Date().toISOString(),
      stats: result.stats,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to rebuild baseline: ${errorMsg}`, 500);
  }
});
