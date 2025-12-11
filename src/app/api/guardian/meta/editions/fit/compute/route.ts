import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  persistEditionFitSnapshotForTenant,
  loadLatestEditionFitsForTenant,
} from '@/lib/guardian/meta/editionFitService';
import { getAllEditionProfiles } from '@/lib/guardian/meta/editionProfileService';

/**
 * POST: Compute and persist edition fit snapshot for a tenant
 * Admin/internal endpoint; triggers fit computation for all active editions
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  try {
    // Get active editions
    const editions = await getAllEditionProfiles();

    // Compute and persist
    await persistEditionFitSnapshotForTenant(workspaceId, editions);

    // Load and return newly computed results
    const fits = await loadLatestEditionFitsForTenant(workspaceId);
    const editionMap = new Map(editions.map((e) => [e.key, e]));

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

    return successResponse({
      message: 'Edition fit snapshot computed successfully',
      editions: enrichedFits,
      count: enrichedFits.length,
      computedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Failed to compute edition fit', 500);
  }
});
