/**
 * Competitor Benchmarking API
 * GET /api/health-check/competitors?jobId={jobId}
 *
 * Returns competitor analysis and benchmarking data
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Validate workspace
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const jobId = req.nextUrl.searchParams.get('jobId');

  if (!workspaceId || !jobId) {
    return errorResponse('workspaceId and jobId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // 1. Verify job exists and belongs to workspace
  const { data: job, error: jobError } = await supabase
    .from('health_check_jobs')
    .select('id, status, url, domain')
    .eq('id', jobId)
    .eq('workspace_id', workspaceId)
    .single();

  if (jobError || !job) {
    return errorResponse('Job not found', 404);
  }

  // 2. Get competitor benchmarks
  const { data: competitors, error: competitorError } = await supabase
    .from('competitor_benchmarks')
    .select(
      `
      id,
      competitor_domain,
      competitor_name,
      source,
      serp_position,
      health_score,
      domain_authority,
      page_authority,
      page_speed_score,
      mobile_friendly_score,
      security_score,
      estimated_monthly_traffic,
      estimated_organic_value,
      score_difference,
      traffic_difference,
      missing_features,
      weak_areas,
      last_analyzed_at,
      analyzed_count
    `
    )
    .eq('health_check_job_id', jobId)
    .order('serp_position', { ascending: true });

  if (competitorError) {
    return errorResponse('Failed to fetch competitors', 500);
  }

  // 3. Get analyzed site's results for comparison
  const { data: siteResults } = await supabase
    .from('health_check_results')
    .select('overall_score, core_web_vitals_score, mobile_friendly_score, security_score')
    .eq('job_id', jobId)
    .single();

  // 4. Format response
  const competitorData = (competitors || []).map((competitor) => ({
    id: competitor.id,
    domain: competitor.competitor_domain,
    name: competitor.competitor_name,
    source: competitor.source,
    serpPosition: competitor.serp_position,
    healthScore: competitor.health_score,
    authority: {
      domain: competitor.domain_authority,
      page: competitor.page_authority,
    },
    metrics: {
      pageSpeed: competitor.page_speed_score,
      mobileFriendly: competitor.mobile_friendly_score,
      security: competitor.security_score,
    },
    traffic: {
      estimated: competitor.estimated_monthly_traffic,
      estimatedValue: competitor.estimated_organic_value,
    },
    comparison: {
      scoreGap: competitor.score_difference, // Positive: competitor better
      trafficGap: competitor.traffic_difference,
    },
    gaps: {
      missing: competitor.missing_features || [],
      weakAreas: competitor.weak_areas || [],
    },
    analyzed: {
      at: competitor.last_analyzed_at,
      count: competitor.analyzed_count,
    },
  }));

  return successResponse({
    jobId: job.id,
    url: job.url,
    domain: job.domain,
    yourScore: siteResults?.overall_score,
    competitors: competitorData,
    summary: {
      topCompetitor: competitorData[0] || null,
      averageCompetitorScore: competitorData.length
        ? Math.round(
            competitorData.reduce((sum, c) => sum + (c.healthScore || 0), 0) /
              competitorData.length
          )
        : 0,
      totalCompetitors: competitorData.length,
      opportunities: generateOpportunities(competitorData, siteResults?.overall_score || 0),
    },
  });
});

/**
 * Generate list of competitive opportunities
 */
function generateOpportunities(
  competitors: any[],
  siteScore: number
): Array<{ opportunity: string; impact: string; effortToClose: string }> {
  const opportunities = [];

  if (!competitors.length) {
    return opportunities;
  }

  // Find gaps where competitors excel
  const avgMetrics = {
    pageSpeed: Math.round(
      competitors.reduce((sum, c) => sum + (c.metrics?.pageSpeed || 0), 0) / competitors.length
    ),
    mobileFriendly: Math.round(
      competitors.reduce((sum, c) => sum + (c.metrics?.mobileFriendly || 0), 0) /
        competitors.length
    ),
    security: Math.round(
      competitors.reduce((sum, c) => sum + (c.metrics?.security || 0), 0) / competitors.length
    ),
  };

  // Common missing features
  const allMissing = new Set<string>();
  competitors.forEach((c) => {
    (c.gaps?.missing || []).forEach((f: string) => allMissing.add(f));
  });

  return Array.from(allMissing)
    .slice(0, 3)
    .map((feature) => ({
      opportunity: feature,
      impact: 'high',
      effortToClose: 'medium',
    }));
}
