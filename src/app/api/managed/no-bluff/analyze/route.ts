/**
 * POST /api/managed/no-bluff/analyze
 *
 * Execute comprehensive No Bluff Protocol SEO/GEO analysis
 * Combines real data from multiple sources for actionable recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import {
  runNoBluffAnalysis,
  generateNoBluffReport,
  generateImplementationRoadmap,
  getRecommendationsByPriority,
  GeographicTarget
} from '@/lib/managed/NoBluffProtocolEngine';

const logger = createApiLogger({ route: '/api/managed/no-bluff/analyze' });

interface NoBluffRequest {
  projectId: string;
  websiteUrl: string;
  targetGeography: GeographicTarget[];
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
    const body: NoBluffRequest = await req.json();
    const {
      projectId,
      websiteUrl,
      targetGeography,
      competitors = [],
      depth = 'standard'
    } = body;

    // Validate required fields
    if (!projectId || !websiteUrl || !targetGeography || targetGeography.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, websiteUrl, targetGeography' },
        { status: 400 }
      );
    }

    logger.info('🔥 Starting No Bluff Protocol analysis', {
      projectId,
      websiteUrl,
      geoTargets: targetGeography.length,
      competitors: competitors.length,
      depth,
      userId: user.id,
    });

    // Run the analysis
    const result = await runNoBluffAnalysis(
      projectId,
      websiteUrl,
      targetGeography,
      competitors,
      depth
    );

    if (!result.success || !result.analysis) {
      logger.error('❌ No Bluff analysis failed', {
        projectId,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    // Generate report
    const reportResult = await generateNoBluffReport(result.analysis);

    if (!reportResult.success) {
      logger.error('❌ Failed to generate report', {
        projectId,
        error: reportResult.error,
      });
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    // Generate implementation roadmap
    const roadmap = generateImplementationRoadmap(result.analysis);
    const recommendations = getRecommendationsByPriority(result.analysis);

    logger.info('✅ No Bluff analysis complete', {
      projectId,
      reportId: reportResult.reportId,
      keywords: result.analysis.keywords.primary.length,
      contentGaps: result.analysis.contentGaps.length,
      quickWins: result.analysis.quickWins.length,
      recommendations: result.analysis.recommendations.length,
    });

    return NextResponse.json({
      success: true,
      reportId: reportResult.reportId,
      projectId,
      analysis: {
        analysisDate: result.analysis.analysisDate,
        keywords: result.analysis.keywords,
        contentGaps: result.analysis.contentGaps,
        quickWins: result.analysis.quickWins,
        localSignals: result.analysis.localSignals,
        eeeatAnalysis: result.analysis.eeeatAnalysis,
        metrics: result.analysis.metrics,
      },
      recommendations: {
        byPriority: recommendations,
        total: result.analysis.recommendations.length,
        criticalCount: recommendations.critical.length,
        highCount: recommendations.high.length,
      },
      roadmap: {
        phase1: {
          name: roadmap.phase1.name,
          count: roadmap.phase1.recommendations.length,
          estimatedTraffic: roadmap.phase1.estimatedTraffic,
        },
        phase2: {
          name: roadmap.phase2.name,
          count: roadmap.phase2.recommendations.length,
          estimatedTraffic: roadmap.phase2.estimatedTraffic,
        },
        phase3: {
          name: roadmap.phase3.name,
          count: roadmap.phase3.recommendations.length,
          estimatedTraffic: roadmap.phase3.estimatedTraffic,
        },
        phase4: {
          name: roadmap.phase4.name,
          count: roadmap.phase4.recommendations.length,
          estimatedTraffic: roadmap.phase4.estimatedTraffic,
        },
      },
      message: 'No Bluff Protocol analysis completed successfully',
    });

  } catch (error) {
    logger.error('❌ Error running No Bluff analysis', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/managed/no-bluff/analyze?projectId=<id>&reportId=<id>
 * Retrieve stored No Bluff analysis report
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    const reportId = req.nextUrl.searchParams.get('reportId');

    if (!projectId && !reportId) {
      return NextResponse.json(
        { error: 'Missing projectId or reportId parameter' },
        { status: 400 }
      );
    }

    logger.info('📊 Fetching No Bluff report', { projectId, reportId });

    // Fetch report from database
    let query = supabase
      .from('managed_service_reports')
      .select('*')
      .eq('report_type', 'no_bluff_seo_geo');

    if (reportId) {
      query = query.eq('id', reportId);
    } else if (projectId) {
      query = query
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data: reports, error } = await query;

    if (error) {
      logger.error('❌ Failed to fetch No Bluff report', { error });
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: 500 }
      );
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { error: 'No Bluff report not found' },
        { status: 404 }
      );
    }

    const report = reports[0];

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        projectId: report.project_id,
        title: report.title,
        createdAt: report.created_at,
        content: report.content,
        metrics: report.metrics,
      },
    });

  } catch (error) {
    logger.error('❌ Error fetching No Bluff report', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
