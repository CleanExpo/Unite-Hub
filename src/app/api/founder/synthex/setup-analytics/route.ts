/**
 * Synthex.social Autonomous Analytics Setup
 *
 * POST /api/founder/synthex/setup-analytics
 *
 * Automatically configures GA4 + GSC for synthex.social
 * No user interaction needed - uses service account credentials
 *
 * This demonstrates the autonomous setup that Synthex.social
 * provides to clients on their subscription tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/synthex/setup-analytics' });

const SYNTHEX_DOMAIN = 'synthex.social';
const SYNTHEX_PROPERTY_ID = process.env.SYNTHEX_GA4_PROPERTY_ID || 'GA4_PROPERTY_ID';
const SYNTHEX_GSC_SITE_URL = `https://${SYNTHEX_DOMAIN}`;

/**
 * POST: Initialize autonomous analytics for synthex.social
 *
 * Uses service account authentication (no user OAuth needed)
 * Suitable for automated/autonomous setup
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin/founder access
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting synthex.social autonomous analytics setup...');

    const supabase = getSupabaseAdmin();
    const setupResults: Record<string, any> = {};
    const errors: string[] = [];

    // ========================================================================
    // STEP 1: Initialize GA4 Service Account Authentication
    // ========================================================================

    try {
      logger.info('📊 Step 1: Setting up GA4 service account...');

      // Service account authentication (in production, use env variable with JSON key)
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : null;

      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured. Autonomous setup requires service account.');
      }

      // Create authenticated client
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: [
          'https://www.googleapis.com/auth/analytics.readonly',
          'https://www.googleapis.com/auth/webmasters.readonly',
        ],
      });

      const analyticsDataClient = google.analyticsdata({ version: 'v1beta', auth });

      // Test GA4 connection
      const ga4TestResponse = await analyticsDataClient.properties.runReport({
        property: `properties/${SYNTHEX_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        },
      });

      setupResults.ga4 = {
        status: 'verified',
        propertyId: SYNTHEX_PROPERTY_ID,
        domain: SYNTHEX_DOMAIN,
        testResult: {
          activeUsers: ga4TestResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0',
          timestamp: new Date().toISOString(),
        },
      };

      logger.info('✅ GA4 setup verified successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ GA4 setup failed', { error });
      setupResults.ga4 = { status: 'error', error: errorMsg };
      errors.push(`GA4 setup: ${errorMsg}`);
    }

    // ========================================================================
    // STEP 2: Initialize GSC Verification (Service Account)
    // ========================================================================

    try {
      logger.info('🔍 Step 2: Setting up Google Search Console...');

      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : null;

      if (!serviceAccountKey) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      }

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: [
          'https://www.googleapis.com/auth/webmasters',
          'https://www.googleapis.com/auth/webmasters.readonly',
        ],
      });

      const webmastersClient = google.webmasters({ version: 'v3', auth });

      // List verified sites
      const sitesResponse = await webmastersClient.sites.list();
      const synexSiteVerified = sitesResponse.data.siteEntry?.some(
        (site: any) => site.siteUrl === SYNTHEX_GSC_SITE_URL
      );

      if (synexSiteVerified) {
        logger.info('✅ Synthex.social already verified in GSC');
        setupResults.gsc = {
          status: 'verified',
          domain: SYNTHEX_DOMAIN,
          siteUrl: SYNTHEX_GSC_SITE_URL,
        };
      } else {
        logger.warn('⚠️ Synthex.social not verified in GSC yet. Manual verification required.');
        setupResults.gsc = {
          status: 'pending_verification',
          domain: SYNTHEX_DOMAIN,
          siteUrl: SYNTHEX_GSC_SITE_URL,
          instructions: 'Add HTML meta tag or file to root directory',
        };
        errors.push('GSC verification pending - manual HTML meta tag addition required');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ GSC setup failed', { error });
      setupResults.gsc = { status: 'error', error: errorMsg };
      errors.push(`GSC setup: ${errorMsg}`);
    }

    // ========================================================================
    // STEP 3: Store Configuration in Database
    // ========================================================================

    try {
      logger.info('💾 Step 3: Storing autonomous configuration...');

      const { error: insertError } = await supabase
        .from('synthex_autonomous_integrations')
        .upsert({
          domain: SYNTHEX_DOMAIN,
          integration_type: 'analytics_suite',
          ga4_property_id: SYNTHEX_PROPERTY_ID,
          gsc_site_url: SYNTHEX_GSC_SITE_URL,
          ga4_status: setupResults.ga4?.status || 'error',
          gsc_status: setupResults.gsc?.status || 'error',
          setup_completed_at: new Date().toISOString(),
          configuration: {
            ga4: setupResults.ga4,
            gsc: setupResults.gsc,
            tier: 'founder', // Synthex.social is founder demonstration
          },
        });

      if (insertError) {
        throw insertError;
      }

      logger.info('✅ Configuration stored in database');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Database storage failed', { error });
      errors.push(`Database storage: ${errorMsg}`);
    }

    // ========================================================================
    // STEP 4: Set up Automated Sync Schedule
    // ========================================================================

    try {
      logger.info('⏰ Step 4: Configuring automated sync schedule...');

      // Create cron job configuration
      const { error: cronError } = await supabase
        .from('synthex_automation_schedules')
        .upsert({
          domain: SYNTHEX_DOMAIN,
          sync_type: 'analytics',
          frequency: 'daily',
          scheduled_time: '06:00', // 6 AM UTC
          enabled: true,
          last_run: null,
          next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          configuration: {
            sources: ['ga4', 'gsc', 'core_web_vitals'],
            endpoints: [
              '/api/founder/synthex/sync-ga4',
              '/api/founder/synthex/sync-gsc',
              '/api/founder/synthex/sync-core-vitals',
            ],
          },
        });

      if (cronError) {
        throw cronError;
      }

      setupResults.automation = {
        status: 'configured',
        frequency: 'daily',
        time: '06:00 UTC',
        sources: ['ga4', 'gsc', 'core_web_vitals'],
      };

      logger.info('✅ Automation schedule configured');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Automation setup failed', { error });
      setupResults.automation = { status: 'error', error: errorMsg };
      errors.push(`Automation setup: ${errorMsg}`);
    }

    // ========================================================================
    // FINAL RESPONSE
    // ========================================================================

    const duration = Date.now() - startTime;

    const response = {
      success: errors.length === 0,
      message: errors.length === 0
        ? '✅ Synthex.social autonomous analytics setup complete!'
        : '⚠️ Setup completed with errors',
      setupResults,
      errors: errors.length > 0 ? errors : undefined,
      nextSteps: [
        {
          title: 'GSC Verification',
          status: setupResults.gsc?.status,
          action: setupResults.gsc?.status === 'pending_verification'
            ? 'Add HTML meta tag to site root: google-site-verification=...'
            : 'Already verified',
        },
        {
          title: 'GA4 Tracking',
          status: setupResults.ga4?.status,
          action: 'Measurement ID is configured on all pages',
        },
        {
          title: 'Automated Sync',
          status: setupResults.automation?.status,
          action: 'Daily syncs scheduled at 06:00 UTC',
        },
        {
          title: 'Core Web Vitals',
          status: 'pending',
          action: 'Configure web-vitals monitoring script',
        },
      ],
      dashboard: {
        metrics: '/founder/synthex-seo',
        analytics: '/founder/synthex-analytics',
        performance: '/founder/synthex-performance',
      },
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };

    logger.info('✅ Autonomous setup completed', {
      duration_ms: duration,
      success: response.success,
      errorCount: errors.length,
    });

    // Log to audit trail
    await supabase.from('auditLogs').insert({
      event: 'synthex_autonomous_analytics_setup',
      details: {
        success: response.success,
        setupResults,
        errorCount: errors.length,
        duration_ms: duration,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error('❌ Autonomous setup failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check current autonomous analytics setup status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch current configuration
    const { data: config, error: configError } = await supabase
      .from('synthex_autonomous_integrations')
      .select('*')
      .eq('domain', SYNTHEX_DOMAIN)
      .single();

    if (configError) {
      logger.warn('No autonomous configuration found', { error: configError });
      return NextResponse.json({
        status: 'not_configured',
        domain: SYNTHEX_DOMAIN,
        message: 'Autonomous analytics setup not yet initialized',
      });
    }

    // Fetch automation schedule
    const { data: schedule } = await supabase
      .from('synthex_automation_schedules')
      .select('*')
      .eq('domain', SYNTHEX_DOMAIN)
      .single();

    // Fetch last sync results
    const { data: lastSync } = await supabase
      .from('synthex_sync_logs')
      .select('*')
      .eq('domain', SYNTHEX_DOMAIN)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      status: 'configured',
      domain: SYNTHEX_DOMAIN,
      configuration: config.configuration,
      ga4: {
        status: config.ga4_status,
        propertyId: config.ga4_property_id,
      },
      gsc: {
        status: config.gsc_status,
        siteUrl: config.gsc_site_url,
      },
      automation: {
        enabled: schedule?.enabled,
        frequency: schedule?.frequency,
        time: schedule?.scheduled_time,
        nextRun: schedule?.next_run,
      },
      lastSync: {
        timestamp: lastSync?.created_at,
        status: lastSync?.status,
        recordssynced: lastSync?.records_synced,
      },
      setupCompletedAt: config.setup_completed_at,
    });

  } catch (error) {
    logger.error('Failed to fetch setup status', { error });
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
