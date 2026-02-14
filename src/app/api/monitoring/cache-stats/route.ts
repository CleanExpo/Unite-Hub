/**
 * Cache Statistics Monitoring API
 * GET /api/monitoring/cache-stats
 *
 * Tracks prompt caching performance across all Anthropic AI agents.
 * Provides real-time visibility into cache hit rates and cost savings.
 *
 * Query Parameters:
 * - period: 1h, 24h, 7d, 30d (default: 24h)
 * - workspace_id: UUID (optional, uses authenticated user's workspace if not provided)
 *
 * Returns:
 * - summary: overall cache hit rate, tokens saved, cost savings
 * - agents: per-agent performance with status (excellent/good/needs_improvement/poor)
 * - top_performers: agents with >80% hit rate
 * - needs_attention: agents with <60% hit rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CacheStatsResult {
  agent: string;
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  tokens_saved: number;
  cost_savings: number;
  avg_latency_ms: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

function getCacheStatus(hitRate: number): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
  if (hitRate >= 0.8) return 'excellent';
  if (hitRate >= 0.6) return 'good';
  if (hitRate >= 0.4) return 'needs_improvement';
  return 'poor';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || '24h';
    const workspaceIdParam = searchParams.get('workspace_id');

    // Validate period
    const validPeriods = ['1h', '24h', '7d', '30d'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period. Must be one of: 1h, 24h, 7d, 30d' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const targetWorkspaceId = workspaceIdParam || profile.id;

    // Calculate start date based on period
    const now = new Date();
    const startDate = new Date(now);
    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Query ai_usage_logs for Anthropic API calls with cache data
    const { data: rawData, error: queryError } = await supabase
      .from('ai_usage_logs')
      .select('task_type, tokens_cached, tokens_input, cost_usd, latency_ms, success')
      .eq('workspace_id', targetWorkspaceId)
      .gte('created_at', startDate.toISOString())
      .eq('provider', 'anthropic_direct') // Only Anthropic supports prompt caching
      .eq('success', true);

    if (queryError) {
      console.error('[CacheStats] Query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to query usage logs' },
        { status: 500 }
      );
    }

    // Process data into cache statistics per agent
    const statsMap = new Map<string, {
      total: number;
      hits: number;
      misses: number;
      tokensSaved: number;
      totalLatency: number;
      costSavings: number;
    }>();

    let totalRequests = 0;
    let totalCacheHits = 0;
    let totalCacheMisses = 0;
    let totalTokensSaved = 0;
    let totalCostSavings = 0;

    rawData?.forEach((row) => {
      const agent = row.task_type || 'unknown';
      const isCacheHit = (row.tokens_cached || 0) > 0;
      const tokensCached = row.tokens_cached || 0;

      // Calculate cost savings (90% discount on cached tokens)
      // Anthropic pricing: ~$0.003/1K tokens for cached reads
      const costSavings = (tokensCached / 1000) * 0.003 * 0.9;

      if (!statsMap.has(agent)) {
        statsMap.set(agent, {
          total: 0,
          hits: 0,
          misses: 0,
          tokensSaved: 0,
          totalLatency: 0,
          costSavings: 0,
        });
      }

      const stats = statsMap.get(agent)!;
      stats.total += 1;
      stats.totalLatency += row.latency_ms || 0;
      stats.costSavings += costSavings;

      if (isCacheHit) {
        stats.hits += 1;
        stats.tokensSaved += tokensCached;
        totalCacheHits += 1;
        totalTokensSaved += tokensCached;
        totalCostSavings += costSavings;
      } else {
        stats.misses += 1;
        totalCacheMisses += 1;
      }

      totalRequests += 1;
    });

    // Convert to array and calculate rates
    const agents: CacheStatsResult[] = Array.from(statsMap.entries())
      .map(([agent, stats]) => {
        const hitRate = stats.total > 0 ? stats.hits / stats.total : 0;
        const avgLatency = stats.total > 0 ? stats.totalLatency / stats.total : 0;

        return {
          agent,
          total_requests: stats.total,
          cache_hits: stats.hits,
          cache_misses: stats.misses,
          cache_hit_rate: Math.round(hitRate * 10000) / 100, // Convert to percentage with 2 decimals
          tokens_saved: stats.tokensSaved,
          cost_savings: Math.round(stats.costSavings * 100) / 100, // Round to 2 decimals
          avg_latency_ms: Math.round(avgLatency),
          status: getCacheStatus(hitRate),
        };
      })
      .sort((a, b) => b.cache_hit_rate - a.cache_hit_rate);

    // Identify top performers and agents needing attention
    const topPerformers = agents.filter((a) => a.cache_hit_rate >= 80);
    const needsAttention = agents.filter((a) => a.cache_hit_rate < 60 && a.total_requests >= 5);

    // Calculate overall cache hit rate
    const overallHitRate =
      totalRequests > 0 ? Math.round((totalCacheHits / totalRequests) * 10000) / 100 : 0;
    const overallStatus = getCacheStatus(totalCacheHits / Math.max(totalRequests, 1));

    const summary = {
      period,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      total_requests: totalRequests,
      cache_hits: totalCacheHits,
      cache_misses: totalCacheMisses,
      cache_hit_rate: overallHitRate,
      tokens_saved: totalTokensSaved,
      cost_savings: Math.round(totalCostSavings * 100) / 100,
      status: overallStatus,
    };

    return NextResponse.json({
      success: true,
      summary,
      agents,
      top_performers: topPerformers,
      needs_attention: needsAttention,
      meta: {
        agents_count: agents.length,
        top_performers_count: topPerformers.length,
        needs_attention_count: needsAttention.length,
      },
    });
  } catch (error) {
    console.error('[CacheStats] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
