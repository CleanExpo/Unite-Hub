/**
 * Synthex.social Autonomous GA4 Sync
 *
 * POST /api/founder/synthex/sync-ga4
 *
 * Automatically fetches GA4 data and stores in database
 * Protected by CRON_SECRET for scheduled execution
 *
 * Called daily by automated cron job (6:00 AM UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/synthex/sync-ga4' });

const SYNTHEX_DOMAIN = 'synthex.social';
const SYNTHEX_PROPERTY_ID = process.env.SYNTHEX_GA4_PROPERTY_ID || 'GA4_PROPERTY_ID';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (!secret || secret !== process.env.CRON_SECRET) {
      logger.warn('❌ Unauthorized GA4 sync attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting GA4 autonomous sync for synthex.social...');

    const supabase = getSupabaseAdmin();

    // ========================================================================
    // FETCH GA4 DATA (Last 30 Days)
    // ========================================================================

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateEnd = today.toISOString().split('T')[0];
    const dateStart = thirtyDaysAgo.toISOString().split('T')[0];

    let ga4Data: Record<string, any> = {};

    try {
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : null;

      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      }

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      });

      const analyticsDataClient = google.analyticsdata({ version: 'v1beta', auth });

      // Fetch main metrics (no dimensions)
      const mainMetricsResponse = await analyticsDataClient.properties.runReport({
        property: `properties/${SYNTHEX_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'engagementRate' },
          ],
        },
      });

      const mainMetrics = mainMetricsResponse.data.rows?.[0]?.metricValues || [];

      ga4Data.main = {
        sessions: parseInt(mainMetrics[0]?.value || '0'),
        users: parseInt(mainMetrics[1]?.value || '0'),
        pageviews: parseInt(mainMetrics[2]?.value || '0'),
        avgSessionDuration: parseFloat(mainMetrics[3]?.value || '0'),
        bounceRate: parseFloat(mainMetrics[4]?.value || '0'),
        engagementRate: parseFloat(mainMetrics[5]?.value || '0'),
      };

      // Fetch top pages
      const topPagesResponse = await analyticsDataClient.properties.runReport({
        property: `properties/${SYNTHEX_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        },
      });

      ga4Data.topPages = (topPagesResponse.data.rows || []).map((row: any) => ({
        path: row.dimensionValues[0]?.value,
        views: parseInt(row.metricValues[0]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues[1]?.value || '0'),
      }));

      // Fetch traffic by source
      const sourceResponse = await analyticsDataClient.properties.runReport({
        property: `properties/${SYNTHEX_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 15,
        },
      });

      ga4Data.trafficSources = (sourceResponse.data.rows || []).map((row: any) => ({
        source: row.dimensionValues[0]?.value,
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        users: parseInt(row.metricValues[1]?.value || '0'),
      }));

      // Fetch device breakdown
      const deviceResponse = await analyticsDataClient.properties.runReport({
        property: `properties/${SYNTHEX_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }, { name: 'bounceRate' }],
        },
      });

      ga4Data.devices = (deviceResponse.data.rows || []).map((row: any) => ({
        category: row.dimensionValues[0]?.value,
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        bounceRate: parseFloat(row.metricValues[1]?.value || '0'),
      }));

      logger.info('✅ GA4 data fetched successfully', {
        sessions: ga4Data.main?.sessions,
        users: ga4Data.main?.users,
        topPagesCount: ga4Data.topPages?.length,
        sourcesCount: ga4Data.trafficSources?.length,
      });

    } catch (error) {
      logger.error('❌ Failed to fetch GA4 data', { error });
      throw error;
    }

    // ========================================================================
    // STORE GA4 DATA IN DATABASE
    // ========================================================================

    try {
      const { error: insertError } = await supabase
        .from('synthex_ga4_metrics')
        .insert({
          domain: SYNTHEX_DOMAIN,
          property_id: SYNTHEX_PROPERTY_ID,
          metric_date: dateEnd,
          date_range: {
            start: dateStart,
            end: dateEnd,
          },
          main_metrics: ga4Data.main,
          top_pages: ga4Data.topPages,
          traffic_sources: ga4Data.trafficSources,
          devices: ga4Data.devices,
          raw_data: ga4Data,
          synced_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error('❌ Failed to insert GA4 metrics:', insertError);
        throw insertError;
      }

      logger.info('✅ GA4 metrics stored in database');

    } catch (error) {
      logger.error('❌ Database insertion failed', { error });
      throw error;
    }

    // ========================================================================
    // LOG SYNC OPERATION
    // ========================================================================

    const duration = Date.now() - startTime;

    await supabase.from('synthex_sync_logs').insert({
      domain: SYNTHEX_DOMAIN,
      sync_type: 'ga4',
      status: 'success',
      records_synced: 1 + (ga4Data.topPages?.length || 0),
      data_summary: {
        period: `${dateStart} to ${dateEnd}`,
        metrics: ga4Data.main,
      },
      duration_ms: duration,
      synced_at: new Date().toISOString(),
    });

    await supabase.from('auditLogs').insert({
      event: 'synthex_ga4_sync',
      details: {
        domain: SYNTHEX_DOMAIN,
        period: `${dateStart} to ${dateEnd}`,
        sessions: ga4Data.main?.sessions,
        users: ga4Data.main?.users,
        pageviews: ga4Data.main?.pageviews,
        topPages: ga4Data.topPages?.length,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    });

    logger.info('✅ GA4 sync completed successfully', { duration_ms: duration });

    return NextResponse.json({
      success: true,
      message: '✅ GA4 data synced successfully',
      metrics: {
        period: `${dateStart} to ${dateEnd}`,
        ...ga4Data.main,
        topPagesCount: ga4Data.topPages?.length || 0,
        sourcesCount: ga4Data.trafficSources?.length || 0,
      },
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('❌ GA4 sync failed', { error });

    const supabase = getSupabaseAdmin();

    // Log failure
    await supabase.from('synthex_sync_logs').insert({
      domain: SYNTHEX_DOMAIN,
      sync_type: 'ga4',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime,
      synced_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'GA4 sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
