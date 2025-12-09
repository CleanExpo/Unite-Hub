/**
 * Synthex.social Autonomous Core Web Vitals Sync
 *
 * POST /api/founder/synthex/sync-core-vitals
 *
 * Autonomously monitors Core Web Vitals using:
 * 1. CrUX API - Real-world Chrome user metrics
 * 2. PageSpeed Insights - Performance recommendations
 * 3. Web Vitals library data - Collected from page visits
 *
 * Protected by CRON_SECRET for scheduled execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/synthex/sync-core-vitals' });

const SYNTHEX_DOMAIN = 'synthex.social';

interface CrUXMetric {
  name: string;
  good: number;
  needsImprovement: number;
  poor: number;
  percentile75: number;
}

/**
 * Fetch CrUX (Chrome User Experience) data from API
 * Provides real-world Core Web Vitals measurements
 */
async function fetchCrUXData(domain: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    logger.warn('GOOGLE_API_KEY not configured - CrUX data unavailable');
    return {};
  }

  try {
    const response = await fetch('https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: `https://${domain}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`CrUX API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to fetch CrUX data', { error });
    return {};
  }
}

/**
 * Fetch PageSpeed Insights data
 * Provides synthetic performance testing and recommendations
 */
async function fetchPageSpeedInsights(domain: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    logger.warn('GOOGLE_API_KEY not configured - PageSpeed data unavailable');
    return {};
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&strategy=${strategy}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.statusText}`);
    }

    const data = await response.json();
    const metrics = data.lighthouseResult?.audits?.metrics?.details?.items[0] || {};

    return {
      strategy,
      scores: {
        performance: data.lighthouseResult?.categories?.performance?.score || 0,
        accessibility: data.lighthouseResult?.categories?.accessibility?.score || 0,
        bestPractices: data.lighthouseResult?.categories?.['best-practices']?.score || 0,
        seo: data.lighthouseResult?.categories?.seo?.score || 0,
      },
      metrics: {
        firstContentfulPaint: metrics.first_contentful_paint,
        largestContentfulPaint: metrics.largest_contentful_paint,
        cumulativeLayoutShift: metrics.cumulative_layout_shift,
        totalBlockingTime: metrics.total_blocking_time,
        interactionToNextPaint: metrics.interaction_to_next_paint,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch PageSpeed Insights', { error });
    return {};
  }
}

/**
 * Generate Core Web Vitals health status
 */
function generateVitalsStatus(
  lcp: number | undefined,
  cls: number | undefined,
  inp: number | undefined
): 'good' | 'needs_improvement' | 'poor' {
  const metrics = [
    (lcp !== undefined && lcp > 4000 ? 'poor' : lcp !== undefined && lcp > 2500 ? 'needs_improvement' : 'good'),
    (cls !== undefined && cls > 0.25 ? 'poor' : cls !== undefined && cls > 0.1 ? 'needs_improvement' : 'good'),
    (inp !== undefined && inp > 500 ? 'poor' : inp !== undefined && inp > 200 ? 'needs_improvement' : 'good'),
  ];

  if (metrics.includes('poor')) {
return 'poor';
}
  if (metrics.includes('needs_improvement')) {
return 'needs_improvement';
}
  return 'good';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (!secret || secret !== process.env.CRON_SECRET) {
      logger.warn('❌ Unauthorized Core Vitals sync attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting Core Web Vitals autonomous sync for synthex.social...');

    const supabase = getSupabaseAdmin();
    const vitalsSummary: Record<string, any> = {};
    const errors: string[] = [];

    // ========================================================================
    // FETCH CrUX DATA (Real-world measurements)
    // ========================================================================

    try {
      logger.info('📊 Fetching CrUX data (real-world users)...');
      const cruxData = await fetchCrUXData(SYNTHEX_DOMAIN);

      if (cruxData.record) {
        const metrics = cruxData.record.metrics || {};

        vitalsSummary.crux = {
          source: 'Chrome User Experience Report',
          collectionPeriod: cruxData.record.collectionPeriod,
          lcpData: metrics.largest_contentful_paint_ms || {},
          clsData: metrics.cumulative_layout_shift || {},
          inpData: metrics.interaction_to_next_paint_ms || {},
          fclsData: metrics.first_input_delay_ms || {},
        };

        logger.info('✅ CrUX data fetched');
      } else {
        logger.warn('⚠️ CrUX data not available (domain may be new)');
        errors.push('CrUX data not available - domain may be new to CrUX dataset');
      }
    } catch (error) {
      logger.error('❌ CrUX data fetch failed', { error });
      errors.push(`CrUX fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // ========================================================================
    // FETCH PAGESPEED INSIGHTS DATA (Synthetic testing)
    // ========================================================================

    try {
      logger.info('⚡ Fetching PageSpeed Insights (mobile)...');
      const mobileData = await fetchPageSpeedInsights(SYNTHEX_DOMAIN, 'mobile');

      logger.info('⚡ Fetching PageSpeed Insights (desktop)...');
      const desktopData = await fetchPageSpeedInsights(SYNTHEX_DOMAIN, 'desktop');

      vitalsSummary.pagespeed = {
        mobile: mobileData,
        desktop: desktopData,
      };

      logger.info('✅ PageSpeed Insights data fetched', {
        mobileScore: mobileData.scores?.performance,
        desktopScore: desktopData.scores?.performance,
      });
    } catch (error) {
      logger.error('❌ PageSpeed Insights fetch failed', { error });
      errors.push(`PageSpeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // ========================================================================
    // CALCULATE OVERALL STATUS & RECOMMENDATIONS
    // ========================================================================

    const lcpValue = vitalsSummary.pagespeed?.mobile?.metrics?.largestContentfulPaint;
    const clsValue = vitalsSummary.pagespeed?.mobile?.metrics?.cumulativeLayoutShift;
    const inpValue = vitalsSummary.pagespeed?.mobile?.metrics?.interactionToNextPaint;

    vitalsSummary.overallStatus = generateVitalsStatus(lcpValue, clsValue, inpValue);

    vitalsSummary.recommendations = [
      {
        metric: 'LCP (Largest Contentful Paint)',
        target: '< 2.5s',
        current: lcpValue ? `${(lcpValue / 1000).toFixed(2)}s` : 'N/A',
        status: lcpValue ? (lcpValue > 4000 ? 'poor' : lcpValue > 2500 ? 'needs_improvement' : 'good') : 'unknown',
        actions: lcpValue && lcpValue > 2500
          ? [
              'Optimize images and video delivery',
              'Minify CSS/JavaScript',
              'Implement lazy loading',
              'Use CDN for static assets',
            ]
          : ['Monitor for regressions'],
      },
      {
        metric: 'CLS (Cumulative Layout Shift)',
        target: '< 0.1',
        current: clsValue ? clsValue.toFixed(3) : 'N/A',
        status: clsValue ? (clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs_improvement' : 'good') : 'unknown',
        actions: clsValue && clsValue > 0.1
          ? [
              'Set explicit dimensions for images and videos',
              'Avoid inserting content above existing content',
              'Use transform animations instead of position changes',
            ]
          : ['Monitor for regressions'],
      },
      {
        metric: 'INP (Interaction to Next Paint)',
        target: '< 200ms',
        current: inpValue ? `${(inpValue / 1000).toFixed(2)}s` : 'N/A',
        status: inpValue ? (inpValue > 500 ? 'poor' : inpValue > 200 ? 'needs_improvement' : 'good') : 'unknown',
        actions: inpValue && inpValue > 200
          ? [
              'Reduce JavaScript execution time',
              'Break up long tasks (>50ms)',
              'Use Web Workers for heavy computation',
              'Profile with DevTools',
            ]
          : ['Monitor for regressions'],
      },
    ];

    // ========================================================================
    // STORE CORE VITALS DATA IN DATABASE
    // ========================================================================

    try {
      const { error: insertError } = await supabase
        .from('synthex_core_vitals_metrics')
        .insert({
          domain: SYNTHEX_DOMAIN,
          metric_date: new Date().toISOString().split('T')[0],
          crux_data: vitalsSummary.crux,
          pagespeed_data: vitalsSummary.pagespeed,
          overall_status: vitalsSummary.overallStatus,
          recommendations: vitalsSummary.recommendations,
          synced_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error('❌ Failed to insert vitals metrics:', insertError);
        throw insertError;
      }

      logger.info('✅ Core Vitals metrics stored in database');
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
      sync_type: 'core_vitals',
      status: errors.length === 0 ? 'success' : 'partial',
      records_synced: 1,
      data_summary: {
        overall_status: vitalsSummary.overallStatus,
        metrics_tested: 3,
      },
      error_count: errors.length,
      duration_ms: duration,
      synced_at: new Date().toISOString(),
    });

    if (vitalsSummary.overallStatus !== 'good') {
      await supabase.from('auditLogs').insert({
        event: 'synthex_core_vitals_warning',
        details: {
          domain: SYNTHEX_DOMAIN,
          status: vitalsSummary.overallStatus,
          metrics: {
            lcp: lcpValue,
            cls: clsValue,
            inp: inpValue,
          },
          recommendations: vitalsSummary.recommendations,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('✅ Core Vitals sync completed', {
      status: vitalsSummary.overallStatus,
      errorCount: errors.length,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? '✅ Core Web Vitals synced successfully'
        : '⚠️ Core Web Vitals sync completed with errors',
      vitals: {
        overallStatus: vitalsSummary.overallStatus,
        recommendations: vitalsSummary.recommendations,
        sources: {
          crux: vitalsSummary.crux ? 'available' : 'unavailable',
          pagespeed: vitalsSummary.pagespeed ? 'available' : 'unavailable',
        },
      },
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('❌ Core Vitals sync failed', { error });

    const supabase = getSupabaseAdmin();

    await supabase.from('synthex_sync_logs').insert({
      domain: SYNTHEX_DOMAIN,
      sync_type: 'core_vitals',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime,
      synced_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Core Vitals sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
