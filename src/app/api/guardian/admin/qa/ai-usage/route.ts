/**
 * GET /api/guardian/admin/qa/ai-usage — List AI usage windows
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getAiUsageSummaryForTenant } from '@/lib/guardian/ai/aiUsageTracker';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const context = req.nextUrl.searchParams.get('context');
  const budgetState = req.nextUrl.searchParams.get('budgetState');
  const lookbackDaysParam = req.nextUrl.searchParams.get('lookbackDays');
  const lookbackDays = lookbackDaysParam ? Math.min(365, Math.max(1, parseInt(lookbackDaysParam, 10))) : 30;

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - lookbackDays);

    let summary = await getAiUsageSummaryForTenant(workspaceId, fromDate, toDate);

    // Filter by context if specified
    if (context) {
      summary = summary.filter((item) => item.context === context);
    }

    // Filter by budget state if specified
    if (budgetState) {
      summary = summary.filter((item) => item.budgetState === budgetState);
    }

    return successResponse({
      usage: summary,
      lookbackDays,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load AI usage';
    return errorResponse(message, 500);
  }
});
