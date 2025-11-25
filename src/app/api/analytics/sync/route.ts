/**
 * API Route: POST /api/analytics/sync
 * Triggers manual sync of analytics data from all sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { searchConsoleService } from '@/lib/analytics/searchConsoleService';
import { analyticsService } from '@/lib/analytics/analyticsService';
import { dataForSEOWrapper } from '@/lib/analytics/dataForSEOWrapper';

const logger = createApiLogger({ route: '/api/analytics/sync' });

export async function POST(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { brandSlug, sources, dateRange } = body;

    // Default date range: last 30 days
    const dateEnd = dateRange?.end || new Date().toISOString().split('T')[0];
    const dateStart =
      dateRange?.start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Determine which sources to sync
    const sourcesToSync = sources || [
      'google_search_console',
      'bing_webmaster_tools',
      'google_analytics_4',
      'dataforseo',
    ];

    const results: Record<string, any> = {};
    const errors: string[] = [];

    // Invalidate cache first (manual refresh)
    if (sourcesToSync.includes('google_search_console') || sourcesToSync.includes('bing_webmaster_tools')) {
      await searchConsoleService.invalidateCache(workspaceId, brandSlug);
    }
    if (sourcesToSync.includes('google_analytics_4')) {
      await analyticsService.invalidateCache(workspaceId, brandSlug);
    }
    if (sourcesToSync.includes('dataforseo')) {
      await dataForSEOWrapper.invalidateCache(workspaceId, brandSlug);
    }

    // Sync Google Search Console
    if (sourcesToSync.includes('google_search_console')) {
      try {
        const gscData = await searchConsoleService.fetchGoogleSearchConsoleData(
          workspaceId,
          brandSlug || 'all',
          dateStart,
          dateEnd
        );

        results.google_search_console = gscData
          ? {
              success: true,
              queriesCount: gscData.queries.length,
              totalImpressions: gscData.totalImpressions,
              totalClicks: gscData.totalClicks,
            }
          : { success: false };

        if (!gscData) {
          errors.push('Google Search Console sync failed');
        }
      } catch (error) {
        logger.error('Google Search Console sync error', { error, workspaceId, brandSlug });
        results.google_search_console = { success: false };
        errors.push('Google Search Console sync error');
      }
    }

    // Sync Bing Webmaster Tools
    if (sourcesToSync.includes('bing_webmaster_tools')) {
      try {
        const bingData = await searchConsoleService.fetchBingWebmasterData(
          workspaceId,
          brandSlug || 'all',
          dateStart,
          dateEnd
        );

        results.bing_webmaster_tools = bingData
          ? {
              success: true,
              queriesCount: bingData.queries.length,
              totalImpressions: bingData.totalImpressions,
              totalClicks: bingData.totalClicks,
            }
          : { success: false };

        if (!bingData) {
          errors.push('Bing Webmaster Tools sync failed');
        }
      } catch (error) {
        logger.error('Bing Webmaster Tools sync error', { error, workspaceId, brandSlug });
        results.bing_webmaster_tools = { success: false };
        errors.push('Bing Webmaster Tools sync error');
      }
    }

    // Sync Google Analytics 4
    if (sourcesToSync.includes('google_analytics_4')) {
      try {
        const ga4Data = await analyticsService.fetchGA4Data(
          workspaceId,
          brandSlug || 'all',
          dateStart,
          dateEnd
        );

        results.google_analytics_4 = ga4Data
          ? {
              success: true,
              metricsCount: ga4Data.metrics.length,
            }
          : { success: false };

        if (!ga4Data) {
          errors.push('Google Analytics 4 sync failed');
        }
      } catch (error) {
        logger.error('Google Analytics 4 sync error', { error, workspaceId, brandSlug });
        results.google_analytics_4 = { success: false };
        errors.push('Google Analytics 4 sync error');
      }
    }

    // Sync DataForSEO (keyword data for brand)
    if (sourcesToSync.includes('dataforseo')) {
      try {
        // Get brand keywords from database or use defaults
        const { data: brandKeywords } = await supabase
          .from('founder_ops_tasks')
          .select('metadata->keywords')
          .eq('workspace_id', workspaceId)
          .eq('brand_slug', brandSlug || 'unite_group')
          .limit(10);

        const keywords =
          brandKeywords?.map((k: any) => k.keywords).flat().filter(Boolean) || [
            'stainless steel balustrades',
            'glass railings',
            'custom metalwork',
          ];

        const keywordData = await dataForSEOWrapper.getKeywordData(
          workspaceId,
          brandSlug || 'unite_group',
          keywords.slice(0, 10) // Limit to 10 keywords to avoid excessive API calls
        );

        results.dataforseo = keywordData
          ? {
              success: true,
              keywordsCount: keywordData.length,
              totalSearchVolume: keywordData.reduce((sum, kw) => sum + kw.searchVolume, 0),
            }
          : { success: false };

        if (!keywordData) {
          errors.push('DataForSEO sync failed');
        }
      } catch (error) {
        logger.error('DataForSEO sync error', { error, workspaceId, brandSlug });
        results.dataforseo = { success: false };
        errors.push('DataForSEO sync error');
      }
    }

    // Get updated cache status
    const cacheStatus = await analyticsService.getCacheStatus(workspaceId);

    logger.info('Analytics sync completed', {
      workspaceId,
      brandSlug,
      results,
      errorsCount: errors.length,
    });

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      cacheStatus,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to sync analytics', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}
