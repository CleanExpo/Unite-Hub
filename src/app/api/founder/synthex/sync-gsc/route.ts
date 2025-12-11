/**
 * Synthex.social Autonomous GSC Sync
 *
 * POST /api/founder/synthex/sync-gsc
 *
 * Automatically fetches Google Search Console data and stores in database
 * Protected by CRON_SECRET for scheduled execution
 *
 * Demonstrates autonomous GSC integration for tier-based clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/synthex/sync-gsc' });

const SYNTHEX_DOMAIN = 'synthex.social';
const SYNTHEX_GSC_SITE_URL = `https://${SYNTHEX_DOMAIN}`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (!secret || secret !== process.env.CRON_SECRET) {
      logger.warn('❌ Unauthorized GSC sync attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting GSC autonomous sync for synthex.social...');

    const supabase = getSupabaseAdmin();

    // ========================================================================
    // FETCH GSC DATA (Last 30 Days)
    // ========================================================================

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateEnd = today.toISOString().split('T')[0];
    const dateStart = thirtyDaysAgo.toISOString().split('T')[0];

    const gscData: Record<string, any> = {
      totalMetrics: {},
      queries: [],
      pages: [],
      countries: [],
      devices: [],
    };

    try {
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : null;

      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      }

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });

      const webmastersClient = google.webmasters({ version: 'v3', auth });

      // Fetch main metrics (no dimensions)
      const mainMetricsResponse = await webmastersClient.searchanalytics.query({
        siteUrl: SYNTHEX_GSC_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dataState: 'final',
        },
      });

      const rows = mainMetricsResponse.data.rows || [];
      const totalClicks = rows.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0);
      const totalImpressions = rows.reduce((sum: number, row: any) => sum + (row.impressions || 0), 0);
      const avgPosition = rows.length > 0
        ? rows.reduce((sum: number, row: any) => sum + (row.position || 0), 0) / rows.length
        : 0;
      const avgCTR = rows.length > 0
        ? rows.reduce((sum: number, row: any) => sum + (row.ctr || 0), 0) / rows.length
        : 0;

      gscData.totalMetrics = {
        clicks: totalClicks,
        impressions: totalImpressions,
        avgPosition: parseFloat(avgPosition.toFixed(2)),
        avgCTR: parseFloat(avgCTR.toFixed(4)),
        queriesCount: rows.length,
      };

      // Fetch top queries
      const queriesResponse = await webmastersClient.searchanalytics.query({
        siteUrl: SYNTHEX_GSC_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 100,
          dataState: 'final',
        },
      });

      gscData.queries = (queriesResponse.data.rows || [])
        .map((row: any) => ({
          query: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: parseFloat((row.ctr || 0).toFixed(4)),
          position: parseFloat((row.position || 0).toFixed(2)),
        }))
        .sort((a: any, b: any) => b.clicks - a.clicks);

      // Fetch top pages
      const pagesResponse = await webmastersClient.searchanalytics.query({
        siteUrl: SYNTHEX_GSC_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 50,
          dataState: 'final',
        },
      });

      gscData.pages = (pagesResponse.data.rows || [])
        .map((row: any) => ({
          page: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: parseFloat((row.ctr || 0).toFixed(4)),
          position: parseFloat((row.position || 0).toFixed(2)),
        }))
        .sort((a: any, b: any) => b.clicks - a.clicks);

      // Fetch by country
      const countriesResponse = await webmastersClient.searchanalytics.query({
        siteUrl: SYNTHEX_GSC_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['country'],
          rowLimit: 50,
          dataState: 'final',
        },
      });

      gscData.countries = (countriesResponse.data.rows || [])
        .map((row: any) => ({
          country: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: parseFloat((row.ctr || 0).toFixed(4)),
          position: parseFloat((row.position || 0).toFixed(2)),
        }))
        .sort((a: any, b: any) => b.clicks - a.clicks);

      // Fetch by device
      const devicesResponse = await webmastersClient.searchanalytics.query({
        siteUrl: SYNTHEX_GSC_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['device'],
          rowLimit: 10,
          dataState: 'final',
        },
      });

      gscData.devices = (devicesResponse.data.rows || [])
        .map((row: any) => ({
          device: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: parseFloat((row.ctr || 0).toFixed(4)),
          position: parseFloat((row.position || 0).toFixed(2)),
        }));

      logger.info('✅ GSC data fetched successfully', {
        clicks: gscData.totalMetrics?.clicks,
        impressions: gscData.totalMetrics?.impressions,
        queriesCount: gscData.queries?.length,
        pagesCount: gscData.pages?.length,
        countriesCount: gscData.countries?.length,
      });

    } catch (error) {
      logger.error('❌ Failed to fetch GSC data', { error });
      throw error;
    }

    // ========================================================================
    // STORE GSC DATA IN DATABASE
    // ========================================================================

    try {
      const { error: insertError } = await supabase
        .from('synthex_gsc_metrics')
        .insert({
          domain: SYNTHEX_DOMAIN,
          site_url: SYNTHEX_GSC_SITE_URL,
          metric_date: dateEnd,
          date_range: {
            start: dateStart,
            end: dateEnd,
          },
          total_metrics: gscData.totalMetrics,
          top_queries: gscData.queries.slice(0, 50), // Store top 50
          top_pages: gscData.pages.slice(0, 30), // Store top 30
          countries: gscData.countries,
          devices: gscData.devices,
          raw_data: gscData,
          synced_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error('❌ Failed to insert GSC metrics:', insertError);
        throw insertError;
      }

      logger.info('✅ GSC metrics stored in database');

    } catch (error) {
      logger.error('❌ Database insertion failed', { error });
      throw error;
    }

    // ========================================================================
    // LOG SYNC OPERATION
    // ========================================================================

    const duration = Date.now() - startTime;

    // Update automation schedule
    await supabase
      .from('synthex_automation_schedules')
      .update({
        last_run: new Date().toISOString(),
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('domain', SYNTHEX_DOMAIN)
      .eq('sync_type', 'gsc');

    await supabase.from('synthex_sync_logs').insert({
      domain: SYNTHEX_DOMAIN,
      sync_type: 'gsc',
      status: 'success',
      records_synced: 1 + (gscData.queries?.length || 0) + (gscData.pages?.length || 0),
      data_summary: {
        period: `${dateStart} to ${dateEnd}`,
        metrics: gscData.totalMetrics,
      },
      duration_ms: duration,
      synced_at: new Date().toISOString(),
    });

    await supabase.from('auditLogs').insert({
      event: 'synthex_gsc_sync',
      details: {
        domain: SYNTHEX_DOMAIN,
        period: `${dateStart} to ${dateEnd}`,
        clicks: gscData.totalMetrics?.clicks,
        impressions: gscData.totalMetrics?.impressions,
        avgPosition: gscData.totalMetrics?.avgPosition,
        topQueries: gscData.queries?.length,
        topPages: gscData.pages?.length,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('✅ GSC sync completed successfully', { duration_ms: duration });

    return NextResponse.json({
      success: true,
      message: '✅ GSC data synced successfully',
      metrics: {
        period: `${dateStart} to ${dateEnd}`,
        ...gscData.totalMetrics,
        topQueriesCount: gscData.queries?.length || 0,
        topPagesCount: gscData.pages?.length || 0,
      },
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('❌ GSC sync failed', { error });

    const supabase = getSupabaseAdmin();

    // Log failure
    await supabase.from('synthex_sync_logs').insert({
      domain: SYNTHEX_DOMAIN,
      sync_type: 'gsc',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime,
      synced_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'GSC sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
