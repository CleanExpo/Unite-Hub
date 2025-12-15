/**
 * Content Lineage Endpoint
 * GET /api/circuits/content/lineage
 *
 * Retrieve variant lineage and regeneration history
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getContentLineage } from '@/lib/decision-circuits/content-regeneration-engine';

/**
 * GET /api/circuits/content/lineage?workspaceId=<uuid>&abTestId=<string>&variantId=<string>
 * Retrieve variant lineage and regeneration history
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const abTestId = req.nextUrl.searchParams.get('abTestId');
  const variantId = req.nextUrl.searchParams.get('variantId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!abTestId) {
    return errorResponse('abTestId required', 400);
  }

  if (!variantId) {
    return errorResponse('variantId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Get lineage
  const lineage = await getContentLineage(workspaceId, abTestId, variantId);

  return successResponse(
    {
      workspace_id: workspaceId,
      ab_test_id: abTestId,
      variant_id: variantId,
      lineage: {
        parents: lineage.parents.map((p) => ({
          child_variant_id: p.child_variant_id,
          parent_variant_id: p.parent_variant_id,
          depth: p.depth,
          created_at: p.created_at,
        })),
        children: lineage.children.map((c) => ({
          child_variant_id: c.child_variant_id,
          parent_variant_id: c.parent_variant_id,
          depth: c.depth,
          created_at: c.created_at,
        })),
        total_parents: lineage.parents.length,
        total_children: lineage.children.length,
      },
      regeneration_history: {
        total_events: lineage.recent_events.length,
        recent_events: lineage.recent_events.map((event) => ({
          event_id: event.id,
          status: event.status,
          parent_variant: event.parent_variant_id,
          child_variant: event.new_variant_id,
          confidence_score: event.confidence_score,
          performance_delta: event.performance_delta,
          cx08_approved: event.cx08_approved_at ? true : false,
          cx06_generated: event.cx06_generated_at ? true : false,
          cx05_passed: event.cx05_validated_at && event.cx05_validation_score ? true : false,
          cx05_score: event.cx05_validation_score,
          initiated_at: event.initiated_at,
          completed_at: event.completed_at,
          duration_ms: event.duration_ms,
        })),
      },
      timestamp: new Date().toISOString(),
    },
    200
  );
});
