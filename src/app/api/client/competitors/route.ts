import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  analyzeCompetitorSchema,
  generateCompetitiveComparison,
  generateCompetitiveIntelligenceReport,
} from '@/lib/schema/competitive-schema-scanner';

/**
 * GET /api/client/competitors?workspaceId={id}
 *
 * Fetch stored competitor analyses for a workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data: competitors, error } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('analyzed_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch competitors:', error);
    return errorResponse(`Failed to fetch competitors: ${error.message}`, 500);
  }

  return successResponse({
    competitors: competitors || [],
    total: competitors?.length || 0,
  });
});

/**
 * POST /api/client/competitors?workspaceId={id}
 *
 * Analyze competitor(s) and store results
 *
 * Request body:
 *   - competitorUrls: string[] - URLs to analyze
 *   - generateReport: boolean - Generate intelligence report (default: true)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId query parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { competitorUrls, generateReport = true } = body;

  if (!competitorUrls || !Array.isArray(competitorUrls) || competitorUrls.length === 0) {
    return errorResponse('competitorUrls array required', 400);
  }

  if (competitorUrls.length > 5) {
    return errorResponse('Maximum 5 competitors can be analyzed at once', 400);
  }

  try {
    // Analyze all competitors in parallel
    const analyses = await Promise.all(
      competitorUrls.map((url) => analyzeCompetitorSchema(url))
    );

    // Store analyses in database
    const supabase = getSupabaseServer();
    const { data: stored, error: storeError } = await supabase
      .from('competitor_analyses')
      .insert(
        analyses.map((analysis) => ({
          workspace_id: workspaceId,
          competitor_url: analysis.competitorUrl,
          analysis_data: analysis,
          analyzed_at: new Date().toISOString(),
        }))
      )
      .select();

    if (storeError) {
      console.error('Failed to store analyses:', storeError);
      return errorResponse(`Failed to store analyses: ${storeError.message}`, 500);
    }

    // Generate intelligence report if requested
    let report = null;
    if (generateReport && analyses.length > 0) {
      report = generateCompetitiveIntelligenceReport(analyses);
    }

    return successResponse({
      analyses,
      stored: stored?.length || 0,
      report,
      message: `Analyzed ${analyses.length} competitor(s)`,
    });
  } catch (error) {
    console.error('Competitor analysis failed:', error);
    return errorResponse(
      `Failed to analyze competitors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});
