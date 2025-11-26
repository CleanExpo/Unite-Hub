/**
 * POST /api/managed/seo/baseline
 *
 * Run SEO baseline analysis for a project using DataForSEO
 * This endpoint calls SEOBaselineEngine to:
 * - Query DataForSEO for keyword rankings
 * - Analyze competitor positioning
 * - Generate baseline metrics (domain authority, backlinks, etc.)
 * - Create baseline report for comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { runSEOBaseline, saveBaselineReport } from '@/lib/managed/SEOBaselineEngine';

const logger = createApiLogger({ route: '/api/managed/seo/baseline' });

interface BaselineRequest {
  projectId: string;
  websiteUrl: string;
  targetKeywords: string[];
  competitors?: string[];
  depth?: 'quick' | 'standard' | 'comprehensive';
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: BaselineRequest = await req.json();
    const {
      projectId,
      websiteUrl,
      targetKeywords,
      competitors,
      depth = 'standard'
    } = body;

    // Validate required fields
    if (!projectId || !websiteUrl || !targetKeywords || targetKeywords.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, websiteUrl, targetKeywords' },
        { status: 400 }
      );
    }

    logger.info('🔍 Running SEO baseline analysis', {
      projectId,
      websiteUrl,
      keywordCount: targetKeywords.length,
      depth,
      userId: user.id,
    });

    // Call SEOBaselineEngine to run analysis
    const baselineData = await runSEOBaseline({
      projectId,
      websiteUrl,
      targetKeywords,
      competitors: competitors || [],
      analysisDepth: depth,
    });

    if (!baselineData || !baselineData.success) {
      logger.error('❌ Failed to run SEO baseline', {
        projectId,
        error: baselineData?.error,
      });
      return NextResponse.json(
        { error: baselineData?.error || 'Failed to run baseline analysis' },
        { status: 500 }
      );
    }

    // Save baseline report to database
    const reportId = await saveBaselineReport(projectId, baselineData);

    logger.info('✅ SEO baseline analysis completed', {
      projectId,
      reportId,
      metricsCollected: baselineData.metrics?.length || 0,
    });

    return NextResponse.json({
      success: true,
      reportId,
      projectId,
      analysis: {
        websiteUrl,
        analysisDate: new Date().toISOString(),
        depth,
        keywordCount: targetKeywords.length,
        competitorCount: competitors?.length || 0,
        metricsCollected: baselineData.metrics?.length || 0,
        rankings: baselineData.rankings,
        domainMetrics: baselineData.domainMetrics,
        competitors: baselineData.competitors,
      },
      message: 'SEO baseline analysis completed successfully',
    });

  } catch (error) {
    logger.error('❌ Error running SEO baseline', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/managed/seo/baseline?projectId=<id>
 * Retrieve baseline report for a project
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    logger.info('📊 Fetching SEO baseline report', { projectId });

    // Fetch latest baseline report from database
    const { data: reports, error } = await supabase
      .from('managed_service_reports')
      .select('*')
      .eq('project_id', projectId)
      .eq('report_type', 'seo_baseline')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('❌ Failed to fetch baseline report', { projectId, error });
      return NextResponse.json(
        { error: 'Failed to fetch baseline report' },
        { status: 500 }
      );
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { error: 'No baseline report found for this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: reports[0],
    });

  } catch (error) {
    logger.error('❌ Error fetching baseline report', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
