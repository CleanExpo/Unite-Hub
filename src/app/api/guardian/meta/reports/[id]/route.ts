import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadExecutiveReportById,
} from '@/lib/guardian/meta/executiveReportService';

/**
 * GET: Retrieve a specific executive report by ID
 * Params: id (report ID)
 * Query: workspaceId
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: any) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const report = await loadExecutiveReportById(workspaceId, id);

    if (!report) {
      return errorResponse('Report not found', 404);
    }

    return successResponse({
      report: {
        id: report.id,
        title: report.title,
        reportType: report.reportType,
        audience: report.audience,
        createdAt: report.createdAt.toISOString(),
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        summary: report.summary,
        sections: report.sections,
        narrative: report.narrative,
        editionKey: report.editionKey,
        upliftPlanId: report.upliftPlanId,
        exportMetadata: report.exportMetadata,
        metadata: report.metadata,
      },
    });
  } catch (error) {
    return errorResponse('Failed to load report', 500);
  }
});
