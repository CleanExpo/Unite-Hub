/**
 * Guardian H06: Unified Intelligence Summary API
 * GET /api/guardian/ai/summary
 * Returns PII-free aggregated summary of H01-H05 outputs + governance state
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getHSeriesSummary, validateSummaryForPII } from '@/lib/guardian/ai/hSeriesSummaryService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  // Parse optional range parameter
  const daysParam = req.nextUrl.searchParams.get('days');
  const days = daysParam ? Math.min(parseInt(daysParam), 90) : 30; // Max 90 days

  // Get summary
  const summary = await getHSeriesSummary(workspaceId, { days });

  // Validate for PII (defense-in-depth)
  const piiValidation = validateSummaryForPII(summary);
  if (!piiValidation.valid) {
    console.warn(`[H06] Summary PII validation warnings: ${piiValidation.warnings.join(', ')}`);
  }

  return successResponse(summary);
});
