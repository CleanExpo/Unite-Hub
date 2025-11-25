/**
 * API Route: GET /api/analytics/search-console
 * Returns Search Console data (Google + Bing) with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { searchConsoleService } from '@/lib/analytics/searchConsoleService';

const logger = createApiLogger({ route: '/api/analytics/search-console' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brandSlug = req.nextUrl.searchParams.get('brandSlug');
    const source = req.nextUrl.searchParams.get('source') as
      | 'google_search_console'
      | 'bing_webmaster_tools'
      | 'all'
      | null;
    const dateStart =
      req.nextUrl.searchParams.get('dateStart') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateEnd = req.nextUrl.searchParams.get('dateEnd') || new Date().toISOString().split('T')[0];
    const useCache = req.nextUrl.searchParams.get('useCache') !== 'false';

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

    let googleData = null;
    let bingData = null;

    // Try to get cached data first
    if (useCache) {
      if (!source || source === 'all' || source === 'google_search_console') {
        googleData = await searchConsoleService.getCachedData(
          workspaceId,
          brandSlug || undefined,
          'google_search_console'
        );
      }

      if (!source || source === 'all' || source === 'bing_webmaster_tools') {
        bingData = await searchConsoleService.getCachedData(
          workspaceId,
          brandSlug || undefined,
          'bing_webmaster_tools'
        );
      }
    }

    // If no cached data, fetch fresh data
    if (!googleData && (!source || source === 'all' || source === 'google_search_console')) {
      googleData = await searchConsoleService.fetchGoogleSearchConsoleData(
        workspaceId,
        brandSlug || 'all',
        dateStart,
        dateEnd
      );
    }

    if (!bingData && (!source || source === 'all' || source === 'bing_webmaster_tools')) {
      bingData = await searchConsoleService.fetchBingWebmasterData(
        workspaceId,
        brandSlug || 'all',
        dateStart,
        dateEnd
      );
    }

    // Combine Google and Bing data if "all" sources requested
    const response: any = {
      success: true,
      dateStart,
      dateEnd,
    };

    if (source === 'all' || !source) {
      // Merge both sources
      const allQueries = [
        ...(googleData?.queries || []).map((q) => ({ ...q, source: 'google' })),
        ...(bingData?.queries || []).map((q) => ({ ...q, source: 'bing' })),
      ];

      response.data = {
        queries: allQueries,
        totalImpressions: (googleData?.totalImpressions || 0) + (bingData?.totalImpressions || 0),
        totalClicks: (googleData?.totalClicks || 0) + (bingData?.totalClicks || 0),
        google: googleData
          ? {
              totalImpressions: googleData.totalImpressions,
              totalClicks: googleData.totalClicks,
              averageCtr: googleData.averageCtr,
              averagePosition: googleData.averagePosition,
            }
          : null,
        bing: bingData
          ? {
              totalImpressions: bingData.totalImpressions,
              totalClicks: bingData.totalClicks,
              averageCtr: bingData.averageCtr,
              averagePosition: bingData.averagePosition,
            }
          : null,
      };
    } else if (source === 'google_search_console') {
      response.data = googleData;
    } else if (source === 'bing_webmaster_tools') {
      response.data = bingData;
    }

    // Add top performing queries
    if (response.data?.queries) {
      response.topQueries = response.data.queries
        .sort((a: any, b: any) => b.impressions - a.impressions)
        .slice(0, 20);

      response.topClickQueries = response.data.queries
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 20);

      response.topCtrQueries = response.data.queries
        .filter((q: any) => q.impressions >= 100) // Minimum impressions for meaningful CTR
        .sort((a: any, b: any) => b.ctr - a.ctr)
        .slice(0, 20);

      response.improvementOpportunities = response.data.queries
        .filter((q: any) => q.impressions >= 100 && q.position > 3 && q.position <= 10)
        .sort((a: any, b: any) => b.impressions - a.impressions)
        .slice(0, 10);
    }

    logger.info('Search Console data retrieved', {
      workspaceId,
      brandSlug,
      source,
      useCache,
      googleQueriesCount: googleData?.queries.length || 0,
      bingQueriesCount: bingData?.queries.length || 0,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get Search Console data', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
