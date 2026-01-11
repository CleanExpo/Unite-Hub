/**
 * GET /api/guardian/meta/z-series/validate
 * Run Z-series validation gate and return comprehensive status
 * Admin-only endpoint for checking production readiness
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { validateZSeriesStack } from '@/lib/guardian/meta/zSeriesValidationGate';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  // Run validation
  const result = await validateZSeriesStack(workspaceId);

  // Format response
  return successResponse({
    validation: {
      overallStatus: result.overallStatus,
      timestamp: result.timestamp,
      summary: result.summary,
      checks: result.checks.map((check) => ({
        category: check.category,
        name: check.name,
        status: check.status,
        message: check.message,
        remediation: check.remediation,
      })),
      recommendations: result.recommendations,
    },
  });
});
