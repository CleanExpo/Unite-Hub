import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadRecentTimeline,
  loadTimelineByCategory,
  projectTimelineForward,
} from '@/lib/guardian/meta/healthTimelineService';

/**
 * GET: Load recent health timeline for a tenant
 * Query params: workspaceId, daysPast (default 90), category (optional filter)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const daysPast = parseInt(req.nextUrl.searchParams.get('daysPast') || '90');
  const category = req.nextUrl.searchParams.get('category'); // optional

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  try {
    let timeline;

    if (category) {
      timeline = await loadTimelineByCategory(workspaceId, category, daysPast);
    } else {
      timeline = await loadRecentTimeline(workspaceId, daysPast);
    }

    // Project forward for forecasting
    const projections = projectTimelineForward(workspaceId, timeline, 30);

    return successResponse({
      timeline: timeline.map((t) => ({
        id: t.id,
        occurredAt: t.occurredAt.toISOString(),
        source: t.source,
        label: t.label,
        category: t.category,
        metricKey: t.metricKey,
        metricValue: t.metricValue,
        narrativeSnippet: t.narrativeSnippet,
        relatedIds: t.relatedIds,
      })),
      projections: projections.map((p) => ({
        projectedDate: p.projectedDate.toISOString(),
        label: p.label,
        category: p.category,
        confidence: p.confidence,
        narrativeSnippet: p.narrativeSnippet,
      })),
      count: timeline.length,
      periodDays: daysPast,
      category: category || 'all',
    });
  } catch (error) {
    return errorResponse('Failed to load timeline', 500);
  }
});
