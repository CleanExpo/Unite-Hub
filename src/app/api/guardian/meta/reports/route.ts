import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { loadLatestReadinessSnapshot } from '@/lib/guardian/readiness/readinessService';
import { loadLatestEditionFitsForTenant } from '@/lib/guardian/meta/editionFitService';
import { loadLatestUpliftPlanForTenant } from '@/lib/guardian/meta/upliftPlanService';
import {
  assembleExecutiveReportForTenant,
  persistExecutiveReport,
  loadExecutiveReportsForTenant,
} from '@/lib/guardian/meta/executiveReportService';
import { loadRecentTimeline } from '@/lib/guardian/meta/healthTimelineService';
import { enrichReportWithAiNarratives } from '@/lib/guardian/meta/executiveReportAiHelper';

/**
 * GET: List executive reports for a tenant
 * Query params: workspaceId, limit (default 10), reportType
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
  const reportType = req.nextUrl.searchParams.get('reportType'); // optional filter

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  try {
    const reports = await loadExecutiveReportsForTenant(workspaceId, limit);

    // Filter by type if specified
    const filtered = reportType ? reports.filter((r) => r.reportType === reportType) : reports;

    return successResponse({
      reports: filtered.map((r) => ({
        id: r.id,
        title: r.title,
        reportType: r.reportType,
        audience: r.audience,
        createdAt: r.createdAt.toISOString(),
        periodStart: r.periodStart.toISOString(),
        periodEnd: r.periodEnd.toISOString(),
        summary: r.summary,
        editionKey: r.editionKey,
      })),
      count: filtered.length,
    });
  } catch (error) {
    return errorResponse('Failed to load reports', 500);
  }
});

/**
 * POST: Generate and persist a new executive report
 * Query params: workspaceId
 * Body: { reportType?, audience?, editionKey?, enableAiNarrative? }
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const body = await req.json();
    const {
      reportType = 'snapshot',
      audience = 'executive',
      editionKey,
      enableAiNarrative = false,
      title,
    } = body;

    // Load required data
    const readiness = await loadLatestReadinessSnapshot(workspaceId);
    if (!readiness) {
      return errorResponse('No readiness snapshot found for tenant', 404);
    }

    const editionFits = await loadLatestEditionFitsForTenant(workspaceId);
    const upliftPlan = await loadLatestUpliftPlanForTenant(workspaceId);
    const recentTimeline = await loadRecentTimeline(workspaceId, 90);

    // Assemble report
    let report = await assembleExecutiveReportForTenant(
      workspaceId,
      readiness,
      null, // previousSnapshot: optional, would load from DB
      editionFits,
      null, // previousFits: optional
      upliftPlan,
      upliftPlan ? await loadUpliftTasksForPlan(upliftPlan.id) : [],
      recentTimeline,
      {
        reportType: reportType as any,
        audience: audience as any,
        editionKey,
        title,
      }
    );

    // Optionally enrich with AI narratives
    if (enableAiNarrative) {
      report = await enrichReportWithAiNarratives(report, {
        enableNarrative: true,
        enableHighlights: true,
        enableRiskAnalysis: true,
      });
    }

    // Persist
    const persisted = await persistExecutiveReport(report);

    return successResponse({
      message: 'Executive report generated successfully',
      report: {
        id: persisted.id,
        title: persisted.title,
        reportType: persisted.reportType,
        audience: persisted.audience,
        createdAt: persisted.createdAt.toISOString(),
        summary: persisted.summary,
        sections: persisted.sections.map((s) => ({
          sectionKey: s.sectionKey,
          sectionTitle: s.sectionTitle,
          category: s.category,
          metrics: s.metrics,
          highlights: s.highlights,
        })),
        hasNarrative: !!persisted.narrative?.introParagraph,
      },
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return errorResponse('Failed to generate executive report', 500);
  }
});

/**
 * Helper: Load uplift tasks for a plan
 */
async function loadUpliftTasksForPlan(planId: string) {
  // This would normally load from DB; for now return empty array
  // In real implementation, query guardian_tenant_uplift_tasks where uplift_plan_id = planId
  return [];
}
