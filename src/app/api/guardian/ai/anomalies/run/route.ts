import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runAllActiveDetectors } from '@/lib/guardian/ai/anomalyDetectionService';

/**
 * POST /api/guardian/ai/anomalies/run
 * Run all active detectors for a tenant (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();

  try {
    const now = new Date();

    // Get active detectors count
    const { count, error: countError } = await supabase
      .from('guardian_anomaly_detectors')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', workspaceId)
      .eq('is_active', true);

    if (countError) {
      return errorResponse('Failed to fetch detectors', 500);
    }

    if (!count || count === 0) {
      return successResponse({
        detectors_run: 0,
        anomalies_detected: 0,
        errors: [],
        completed_at: now.toISOString(),
      });
    }

    // Run all active detectors
    const results = await runAllActiveDetectors(workspaceId, now, {
      skipBaselineCheck: false,
    });

    // Count anomalies detected
    const anomaliesDetected = results.filter((r) => r.anomalyDetected).length;

    // Count errors
    const errors = results.filter((r) => r.error).map((r) => ({
      detectorId: r.detectorId,
      error: r.error,
    }));

    return successResponse({
      detectors_run: results.length,
      anomalies_detected: anomaliesDetected,
      errors: errors.length > 0 ? errors : [],
      results_summary: {
        total: results.length,
        with_anomalies: anomaliesDetected,
        with_errors: errors.length,
        successful: results.length - errors.length,
      },
      completed_at: now.toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to run detectors: ${errorMsg}`, 500);
  }
});
