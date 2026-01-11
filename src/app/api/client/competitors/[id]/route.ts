import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  analyzeCompetitorSchema,
  generateCompetitiveComparison,
} from '@/lib/schema/competitive-schema-scanner';

/**
 * GET /api/client/competitors/[id]?workspaceId={id}
 *
 * Get detailed competitor analysis with comparison to our metrics
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Fetch stored competitor analysis
  const { data: analysis, error } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !analysis) {
    return errorResponse('Competitor analysis not found', 404);
  }

  // Fetch workspace schema metrics for comparison
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('schema_metrics')
    .eq('id', workspaceId)
    .single();

  if (workspaceError) {
    return errorResponse('Failed to fetch workspace metrics', 500);
  }

  // Generate comparison using stored metrics
  const ourMetrics = workspace?.schema_metrics || {
    schemaTypes: [],
    schemaCoverage: 0,
    contentMetrics: {
      totalPages: 0,
      pagesWithSchema: 0,
      avgWordsPerPage: 0,
      multimediaCount: { images: 0, videos: 0, total: 0 },
      internalLinkCount: 0,
    },
    depthScore: 0,
    technicalScore: 0,
  };

  const comparison = generateCompetitiveComparison(analysis.analysis_data, ourMetrics);

  return successResponse({
    analysis: analysis.analysis_data,
    comparison,
    lastUpdated: analysis.analyzed_at,
  });
});

/**
 * DELETE /api/client/competitors/[id]?workspaceId={id}
 *
 * Remove competitor from analysis tracking
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('competitor_analyses')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return errorResponse(`Failed to delete competitor: ${error.message}`, 500);
  }

  return successResponse({ message: 'Competitor analysis deleted' });
});

/**
 * POST /api/client/competitors/[id]/refresh?workspaceId={id}
 *
 * Refresh competitor analysis (re-scan website)
 */
export const POST = withErrorBoundary(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Fetch existing competitor URL
  const { data: competitor, error: fetchError } = await supabase
    .from('competitor_analyses')
    .select('competitor_url')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !competitor) {
    return errorResponse('Competitor not found', 404);
  }

  try {
    // Re-analyze competitor
    const updatedAnalysis = await analyzeCompetitorSchema(competitor.competitor_url);

    // Update database
    const { data: updated, error: updateError } = await supabase
      .from('competitor_analyses')
      .update({
        analysis_data: updatedAnalysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) {
      return errorResponse(`Failed to update competitor: ${updateError.message}`, 500);
    }

    return successResponse({
      analysis: updatedAnalysis,
      refreshedAt: new Date().toISOString(),
      message: 'Competitor analysis refreshed',
    });
  } catch (error) {
    console.error('Failed to refresh competitor analysis:', error);
    return errorResponse(
      `Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});
