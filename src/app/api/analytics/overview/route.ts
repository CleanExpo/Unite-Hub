/**
 * API Route: GET /api/analytics/overview
 * Returns comprehensive analytics overview combining all sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { searchConsoleService } from '@/lib/analytics/searchConsoleService';
import { analyticsService } from '@/lib/analytics/analyticsService';
import { dataForSEOWrapper } from '@/lib/analytics/dataForSEOWrapper';

const logger = createApiLogger({ route: '/api/analytics/overview' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brandSlug = req.nextUrl.searchParams.get('brandSlug');
    const dateStart =
      req.nextUrl.searchParams.get('dateStart') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateEnd = req.nextUrl.searchParams.get('dateEnd') || new Date().toISOString().split('T')[0];

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden - Founder role required' },
        { status: 403 }
      );
    }

    // Fetch data from all sources (use cached if available)
    const [googleData, bingData, ga4Overview, keywordData, cacheStatus] = await Promise.all([
      searchConsoleService.getCachedData(workspaceId, brandSlug || undefined, 'google_search_console'),
      searchConsoleService.getCachedData(workspaceId, brandSlug || undefined, 'bing_webmaster_tools'),
      analyticsService.getAnalyticsOverview(workspaceId, brandSlug || 'all', dateStart, dateEnd),
      dataForSEOWrapper.getCachedKeywordData(workspaceId, brandSlug || undefined),
      analyticsService.getCacheStatus(workspaceId),
    ]);

    // Build overview response
    const overview: any = {
      success: true,
      dateStart,
      dateEnd,
      brandSlug: brandSlug || 'all',
      lastUpdated: new Date().toISOString(),
    };

    // Search Console metrics
    if (googleData || bingData) {
      overview.searchConsole = {
        totalImpressions: (googleData?.totalImpressions || 0) + (bingData?.totalImpressions || 0),
        totalClicks: (googleData?.totalClicks || 0) + (bingData?.totalClicks || 0),
        averageCtr:
          ((googleData?.averageCtr || 0) + (bingData?.averageCtr || 0)) /
          ((googleData ? 1 : 0) + (bingData ? 1 : 0) || 1),
        averagePosition:
          ((googleData?.averagePosition || 0) + (bingData?.averagePosition || 0)) /
          ((googleData ? 1 : 0) + (bingData ? 1 : 0) || 1),
        google: googleData
          ? {
              impressions: googleData.totalImpressions,
              clicks: googleData.totalClicks,
              ctr: googleData.averageCtr,
              position: googleData.averagePosition,
            }
          : null,
        bing: bingData
          ? {
              impressions: bingData.totalImpressions,
              clicks: bingData.totalClicks,
              ctr: bingData.averageCtr,
              position: bingData.averagePosition,
            }
          : null,
        topQueries: [
          ...(googleData?.queries || []).map((q) => ({ ...q, source: 'google' })),
          ...(bingData?.queries || []).map((q) => ({ ...q, source: 'bing' })),
        ]
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 10),
      };
    }

    // Google Analytics metrics
    if (ga4Overview) {
      overview.analytics = {
        sessions: ga4Overview.sessions,
        users: ga4Overview.users,
        pageviews: ga4Overview.pageviews,
        averageSessionDuration: ga4Overview.averageSessionDuration,
        bounceRate: ga4Overview.bounceRate,
        conversions: ga4Overview.conversions,
        topPages: ga4Overview.topPages.slice(0, 10),
        topSources: ga4Overview.topSources.slice(0, 10),
        deviceBreakdown: ga4Overview.deviceBreakdown,
      };
    }

    // Keyword data (SEO opportunities)
    if (keywordData && keywordData.length > 0) {
      overview.keywords = {
        totalKeywords: keywordData.length,
        totalSearchVolume: keywordData.reduce((sum, kw) => sum + kw.searchVolume, 0),
        averageDifficulty:
          keywordData.reduce((sum, kw) => sum + kw.keywordDifficulty, 0) / keywordData.length,
        averageCpc: keywordData.reduce((sum, kw) => sum + kw.cpc, 0) / keywordData.length,
        topKeywords: keywordData
          .sort((a, b) => b.searchVolume - a.searchVolume)
          .slice(0, 10)
          .map((kw) => ({
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            difficulty: kw.keywordDifficulty,
            cpc: kw.cpc,
          })),
        lowHangingFruit: keywordData
          .filter((kw) => kw.keywordDifficulty < 30 && kw.searchVolume > 100)
          .sort((a, b) => b.searchVolume - a.searchVolume)
          .slice(0, 5)
          .map((kw) => ({
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            difficulty: kw.keywordDifficulty,
            opportunity: 'Low difficulty, good volume',
          })),
      };
    }

    // Performance insights
    overview.insights = [];

    // Search visibility insight
    if (overview.searchConsole) {
      const avgPosition = overview.searchConsole.averagePosition;
      if (avgPosition > 10) {
        overview.insights.push({
          type: 'warning',
          category: 'search_visibility',
          message: `Average position is ${avgPosition.toFixed(1)}. Focus on improving rankings for high-impression queries.`,
          recommendation: 'Review top queries and optimize content for better rankings.',
        });
      } else if (avgPosition <= 5) {
        overview.insights.push({
          type: 'success',
          category: 'search_visibility',
          message: `Excellent average position of ${avgPosition.toFixed(1)}. Continue monitoring and maintaining rankings.`,
          recommendation: 'Maintain content freshness and monitor competitor movements.',
        });
      }

      // CTR insight
      const avgCtr = overview.searchConsole.averageCtr;
      if (avgCtr < 0.02) {
        overview.insights.push({
          type: 'warning',
          category: 'ctr_optimization',
          message: `CTR is ${(avgCtr * 100).toFixed(2)}%, which is below average for your position.`,
          recommendation: 'Improve title tags and meta descriptions to increase click-through rate.',
        });
      }
    }

    // Traffic insight
    if (overview.analytics) {
      const bounceRate = overview.analytics.bounceRate;
      if (bounceRate > 0.7) {
        overview.insights.push({
          type: 'warning',
          category: 'user_engagement',
          message: `Bounce rate is ${(bounceRate * 100).toFixed(1)}%, indicating users are leaving quickly.`,
          recommendation:
            'Review landing pages and ensure content matches search intent. Improve page speed and UX.',
        });
      }

      if (overview.analytics.conversions === 0) {
        overview.insights.push({
          type: 'info',
          category: 'conversion_tracking',
          message: 'No conversions tracked in this period.',
          recommendation: 'Verify conversion tracking is properly configured in GA4.',
        });
      }
    }

    // Keyword opportunities
    if (overview.keywords?.lowHangingFruit?.length > 0) {
      overview.insights.push({
        type: 'success',
        category: 'keyword_opportunities',
        message: `Found ${overview.keywords.lowHangingFruit.length} low-difficulty keywords with good search volume.`,
        recommendation: 'Create targeted content for these keywords to capture additional traffic.',
        keywords: overview.keywords.lowHangingFruit.map((k: any) => k.keyword),
      });
    }

    // Cache status
    overview.cacheStatus = cacheStatus;

    logger.info('Analytics overview retrieved', {
      workspaceId,
      brandSlug,
      hasSearchConsole: !!overview.searchConsole,
      hasAnalytics: !!overview.analytics,
      hasKeywords: !!overview.keywords,
      insightsCount: overview.insights.length,
    });

    return NextResponse.json(overview);
  } catch (error) {
    logger.error('Failed to get analytics overview', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
