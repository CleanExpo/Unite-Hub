/**
 * SEO Sync Endpoint for Synthex.social
 *
 * POST /api/seo/sync-rankings
 *
 * Fetches current rankings from DataForSEO + Semrush,
 * calculates consensus scores, and stores in database.
 *
 * Protected by CRON_SECRET for automated daily syncs.
 *
 * Usage:
 * ```bash
 * curl -X POST https://synthex.social/api/seo/sync-rankings \
 *   -H "Authorization: Bearer $CRON_SECRET"
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSeoMonitor } from '@/lib/seo/providers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Primary keywords tracked for Synthex.social
const SYNTHEX_PRIMARY_KEYWORDS = [
  'SEO intelligence',
  'local search rankings',
  'keyword research',
  'competitor analysis',
  'DataForSEO alternative',
  'Semrush alternative',
  'keyword tracking',
  'SERP tracking',
  'local SEO tool',
  'ranking tracker',
  'SEO monitoring',
  'domain authority',
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (!secret || secret !== process.env.CRON_SECRET) {
      console.error('❌ Unauthorized SEO sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting SEO sync for synthex.social...');

    // Fetch rankings from unified monitor
    const monitor = createSeoMonitor();
    const rankings = await monitor.getConsensusRankings(
      'synthex.social',
      SYNTHEX_PRIMARY_KEYWORDS,
      {
        country: 'AU', // Australia
        limit: 100
      }
    );

    console.log(`✅ Fetched ${rankings.rankings.length} keyword rankings`);
    console.log(`   Confidence: ${rankings.confidence.score}% (${rankings.confidence.level})`);
    console.log(`   Top 10: ${rankings.summary.top10Count}`);
    console.log(`   Top 20: ${rankings.summary.top20Count}`);
    console.log(`   Visibility: ${rankings.summary.visibility}%`);

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Store metrics in database
    const metricsToStore = rankings.rankings.map(r => ({
      metric_date: today,
      keyword: r.keyword,
      position: r.position,
      search_volume: r.searchVolume,
      difficulty_score: r.difficulty,
      provider: r.provider,
      confidence_score: r.confidence,
      trend: r.trend,
      trend_days: r.trendDays,
      visibility_score: rankings.summary.visibility,
      data: {
        last_updated: r.lastUpdated.toISOString(),
        summary: rankings.summary,
        confidence: rankings.confidence
      }
    }));

    const { error: insertError } = await supabase
      .from('synthex_seo_metrics')
      .insert(metricsToStore);

    if (insertError) {
      console.error('❌ Failed to insert metrics:', insertError);
      throw insertError;
    }

    console.log(`✅ Stored ${metricsToStore.length} metrics in database`);

    // Update daily summary
    const { error: summaryError } = await supabase
      .from('synthex_seo_daily_summary')
      .upsert({
        summary_date: today,
        total_keywords_tracked: rankings.rankings.length,
        average_position: rankings.summary.averagePosition,
        top_10_count: rankings.summary.top10Count,
        top_20_count: rankings.summary.top20Count,
        visibility_score: rankings.summary.visibility,
        confidence_score: rankings.confidence.score,
        updated_keywords: rankings.rankings.length,
        new_keywords: 0, // TODO: Calculate from previous day
        lost_keywords: 0, // TODO: Calculate from previous day
      });

    if (summaryError) {
      console.error('❌ Failed to update summary:', summaryError);
      throw summaryError;
    }

    console.log('✅ Updated daily summary');

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('auditLogs')
      .insert({
        event: 'seo_sync_completed',
        details: {
          keywords_tracked: rankings.rankings.length,
          top_10_count: rankings.summary.top10Count,
          top_20_count: rankings.summary.top20Count,
          visibility_score: rankings.summary.visibility,
          confidence_score: rankings.confidence.score,
          duration_ms: Date.now() - startTime
        },
        timestamp: new Date().toISOString(),
      });

    if (auditError) {
      console.warn('⚠️ Failed to log audit:', auditError);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      metrics: {
        total_keywords: rankings.rankings.length,
        top_10_count: rankings.summary.top10Count,
        top_20_count: rankings.summary.top20Count,
        average_position: rankings.summary.averagePosition,
        visibility_score: rankings.summary.visibility,
        confidence_score: rankings.confidence.score,
        confidence_level: rankings.confidence.level,
      },
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    });

  } catch (error) {
    console.error('❌ SEO sync error:', error);

    const supabase = getSupabaseAdmin();

    // Log error to audit trail
    await supabase.from('auditLogs').insert({
      event: 'seo_sync_failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: Date.now() - startTime
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve latest rankings
 *
 * GET /api/seo/sync-rankings?domain=synthex.social
 *
 * Returns latest SEO metrics from database (no API calls)
 */
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get('domain');

    if (!domain || domain !== 'synthex.social') {
      return NextResponse.json(
        { error: 'Only synthex.social domain is tracked' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get latest daily summary
    const { data: summary, error: summaryError } = await supabase
      .from('synthex_seo_daily_summary')
      .select('*')
      .order('summary_date', { ascending: false })
      .limit(1)
      .single();

    if (summaryError) {
      console.error('Failed to fetch summary:', summaryError);
      throw summaryError;
    }

    // Get latest metrics for all keywords
    const { data: metrics, error: metricsError } = await supabase
      .from('synthex_seo_metrics')
      .select('*')
      .eq('metric_date', summary.summary_date)
      .eq('provider', 'consensus') // Only show consensus data
      .order('position', { ascending: true });

    if (metricsError) {
      console.error('Failed to fetch metrics:', metricsError);
      throw metricsError;
    }

    // Transform to expected format
    const rankings = metrics.map(m => ({
      keyword: m.keyword,
      position: m.position,
      searchVolume: m.search_volume,
      difficulty: m.difficulty_score,
      provider: m.provider,
      confidence: m.confidence_score,
      lastUpdated: new Date(m.created_at),
      trend: m.trend,
      trendDays: m.trend_days,
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        rankings,
        summary: {
          totalKeywords: summary.total_keywords_tracked,
          averagePosition: parseFloat(summary.average_position),
          top10Count: summary.top_10_count,
          top20Count: summary.top_20_count,
          visibility: summary.visibility_score,
        },
        confidence: {
          score: summary.confidence_score,
          level: summary.confidence_score >= 85 ? 'high' :
                 summary.confidence_score >= 70 ? 'medium' : 'low',
          agreementPercentage: summary.confidence_score,
        }
      },
      lastUpdated: summary.summary_date,
    });

  } catch (error) {
    console.error('GET rankings error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch rankings',
      },
      { status: 500 }
    );
  }
}
