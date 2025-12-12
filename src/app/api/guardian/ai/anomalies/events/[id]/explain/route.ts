import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { explainAnomaly } from '@/lib/guardian/ai/anomalyExplainerAiHelper';

/**
 * GET /api/guardian/ai/anomalies/events/[id]/explain
 * Generate AI explanation for an anomaly event (admin-only)
 * Governance-gated: respects Z10 ai_usage_policy
 */
export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  try {
    // Fetch event with detector info
    const { data: event, error: eventError } = await supabase
      .from('guardian_anomaly_events')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', workspaceId)
      .single();

    if (eventError || !event) {
      return errorResponse('Event not found', 404);
    }

    // Fetch detector
    const { data: detector, error: detectorError } = await supabase
      .from('guardian_anomaly_detectors')
      .select('*')
      .eq('id', event.detector_id)
      .eq('tenant_id', workspaceId)
      .single();

    if (detectorError || !detector) {
      return errorResponse('Detector not found', 404);
    }

    // Fetch latest baseline for statistical context
    const { data: baseline } = await supabase
      .from('guardian_anomaly_baselines')
      .select('stats')
      .eq('detector_id', event.detector_id)
      .eq('tenant_id', workspaceId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    // Generate explanation (AI or deterministic based on governance)
    const explanation = await explainAnomaly(workspaceId, event, detector, baseline?.stats);

    return successResponse({
      eventId: id,
      explanation,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to generate explanation: ${errorMsg}`, 500);
  }
});
