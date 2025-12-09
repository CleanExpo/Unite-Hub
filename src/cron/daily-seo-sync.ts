/**
 * Daily SEO Sync Cron Job for Synthex.social
 *
 * Automatically fetches keyword rankings from DataForSEO + Semrush
 * and stores consensus data in the database.
 *
 * Scheduled to run daily at 6:00 AM UTC via Vercel Cron.
 *
 * Setup in vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/seo/sync-rankings",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 * ```
 *
 * Manual trigger:
 * ```bash
 * curl -X POST https://synthex.social/api/seo/sync-rankings \
 *   -H "Authorization: Bearer $CRON_SECRET"
 * ```
 */

export async function dailySeoSyncJob() {
  console.log('🔄 Starting daily SEO sync job...');

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/seo/sync-rankings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sync failed with status ${response.status}: ${error}`);
    }

    const data = await response.json();

    const duration = Date.now() - startTime;

    console.log('✅ Daily SEO sync completed:', {
      keywords_tracked: data.metrics.total_keywords,
      top_10_count: data.metrics.top_10_count,
      top_20_count: data.metrics.top_20_count,
      visibility_score: data.metrics.visibility_score,
      confidence_score: data.metrics.confidence_score,
      duration_ms: duration,
    });

    return {
      success: true,
      data,
      duration_ms: duration,
    };
  } catch (error) {
    console.error('❌ Daily SEO sync failed:', error);

    // Log to auditLogs via admin client
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabase = getSupabaseAdmin();

      await supabase.from('auditLogs').insert({
        event: 'seo_sync_cron_failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          duration_ms: Date.now() - startTime,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('⚠️ Failed to log error:', logError);
    }

    throw error;
  }
}

/**
 * Weekly SEO Report Generator
 *
 * Runs every Monday at 8:00 AM UTC
 * Generates a summary of the past week's SEO performance
 */
export async function weeklySeoReport() {
  console.log('📊 Generating weekly SEO report...');

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase');
    const supabase = getSupabaseAdmin();

    // Get last 7 days of summary data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: summaries, error } = await supabase
      .from('synthex_seo_daily_summary')
      .select('*')
      .gte('summary_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('summary_date', { ascending: false });

    if (error) {
throw error;
}

    if (!summaries || summaries.length === 0) {
      console.warn('⚠️ No summary data available for weekly report');
      return { success: false, message: 'No data available' };
    }

    // Calculate weekly metrics
    const avgPosition = summaries.reduce((sum, s) => sum + parseFloat(s.average_position), 0) / summaries.length;
    const avgTop10 = summaries.reduce((sum, s) => sum + s.top_10_count, 0) / summaries.length;
    const avgTop20 = summaries.reduce((sum, s) => sum + s.top_20_count, 0) / summaries.length;
    const avgVisibility = summaries.reduce((sum, s) => sum + s.visibility_score, 0) / summaries.length;

    // Find biggest movers
    const latestSummary = summaries[0];
    const oldestSummary = summaries[summaries.length - 1];

    const positionChange = parseFloat(oldestSummary.average_position) - parseFloat(latestSummary.average_position);
    const visibilityChange = latestSummary.visibility_score - oldestSummary.visibility_score;

    const report = {
      period: {
        start: oldestSummary.summary_date,
        end: latestSummary.summary_date,
        days: summaries.length,
      },
      averages: {
        position: Math.round(avgPosition * 100) / 100,
        top_10_count: Math.round(avgTop10),
        top_20_count: Math.round(avgTop20),
        visibility: Math.round(avgVisibility),
      },
      changes: {
        position: Math.round(positionChange * 100) / 100,
        visibility: visibilityChange,
      },
      trend: {
        position: positionChange > 0 ? 'improving' : positionChange < 0 ? 'declining' : 'stable',
        visibility: visibilityChange > 0 ? 'improving' : visibilityChange < 0 ? 'declining' : 'stable',
      },
    };

    console.log('✅ Weekly SEO report generated:', report);

    // Store report in database (optional)
    await supabase.from('auditLogs').insert({
      event: 'seo_weekly_report_generated',
      details: report,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error('❌ Weekly report generation failed:', error);
    throw error;
  }
}

export default {
  dailySeoSyncJob,
  weeklySeoReport,
};
