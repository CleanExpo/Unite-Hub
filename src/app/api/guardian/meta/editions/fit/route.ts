import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { loadLatestEditionFitsForTenant } from '@/lib/guardian/meta/editionFitService';
import { getAllEditionProfiles } from '@/lib/guardian/meta/editionProfileService';

/**
 * GET: Retrieve latest edition fit snapshot for a tenant
 * Returns fit scores for all active editions
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  try {
    // Load latest fits for all editions
    const fits = await loadLatestEditionFitsForTenant(workspaceId);

    if (fits.length === 0) {
      // No edition fit data yet
      return successResponse({
        computedAt: null,
        editions: [],
        message: 'No edition fit snapshot computed yet',
      });
    }

    // Get edition profiles for labels
    const editions = await getAllEditionProfiles();
    const editionMap = new Map(editions.map((e) => [e.key, e]));

    // Enrich fit results with edition labels
    const enrichedFits = fits.map((fit) => {
      const edition = editionMap.get(fit.editionKey);
      return {
        key: fit.editionKey,
        label: edition?.label || fit.editionKey,
        tier: edition?.tier || 'custom',
        overallFitScore: fit.overallFitScore,
        status: fit.status,
        capabilityScores: fit.capabilityScores,
        gaps: fit.gaps,
      };
    });

    // Derive computed_at from first result (all in same snapshot)
    const computedAt = fits.length > 0 ? new Date().toISOString() : null;

    return successResponse({
      computedAt,
      editions: enrichedFits,
      count: enrichedFits.length,
    });
  } catch (error) {
    return errorResponse('Failed to retrieve edition fit', 500);
  }
});
