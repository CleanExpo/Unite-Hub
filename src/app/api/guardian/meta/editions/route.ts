import { NextRequest } from 'next/server';
import { getAllEditionProfiles } from '@/lib/guardian/meta/editionProfileService';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Retrieve all active Guardian edition profiles
 * No tenant context required; editions are global reference data
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  try {
    const editions = await getAllEditionProfiles();

    return successResponse({
      editions: editions.map((e) => ({
        key: e.key,
        label: e.label,
        description: e.description,
        tier: e.tier,
        capabilitiesRequired: e.capabilitiesRequired,
        capabilitiesNiceToHave: e.capabilitiesNiceToHave,
        minOverallScore: e.minOverallScore,
        recommendedOverallScore: e.recommendedOverallScore,
        isDefault: e.isDefault,
      })),
      count: editions.length,
    });
  } catch (error) {
    return errorResponse('Failed to retrieve editions', 500);
  }
});
