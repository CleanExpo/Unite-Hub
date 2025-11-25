/**
 * GET /api/coalition/history
 * Retrieve historical coalition performance and analytics
 * Rate limit: 30 req/min (read-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { coalitionArchiveBridge } from '@/lib/coalition';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit({
      identifier: 'coalition-history',
      limit: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = req.nextUrl.searchParams.get('limit') || '50';

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get coalition history
    const { data: history, error: historyError } = await supabase
      .from('coalition_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (historyError) {
      console.error('Error fetching coalition history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch coalition history' },
        { status: 500 }
      );
    }

    // Get coalition patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('coalition_patterns')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (patternsError) {
      console.error('Error fetching coalition patterns:', patternsError);
    }

    // Calculate analytics from history
    let totalCoalitions = 0;
    let successCount = 0;
    let partialCount = 0;
    let failureCount = 0;
    let totalValue = 0;
    let totalDuration = 0;
    const agentLeaderStats: Record<string, { coalitions: number; success: number }> = {};

    (history || []).forEach((coalition: any) => {
      totalCoalitions++;

      if (coalition.outcome === 'success') successCount++;
      if (coalition.outcome === 'partial_success') partialCount++;
      if (coalition.outcome === 'failure') failureCount++;

      totalDuration += coalition.execution_time_ms || 0;

      // Track leader stats
      if (coalition.leader_id) {
        if (!agentLeaderStats[coalition.leader_id]) {
          agentLeaderStats[coalition.leader_id] = { coalitions: 0, success: 0 };
        }
        agentLeaderStats[coalition.leader_id].coalitions++;
        if (coalition.outcome === 'success') {
          agentLeaderStats[coalition.leader_id].success++;
        }
      }
    });

    // Get most effective leader
    let mostEffectiveLeader = '';
    let highestSuccessRate = 0;

    for (const [leaderId, stats] of Object.entries(agentLeaderStats)) {
      const successRate = stats.coalitions > 0 ? stats.success / stats.coalitions : 0;
      if (successRate > highestSuccessRate) {
        highestSuccessRate = successRate;
        mostEffectiveLeader = leaderId;
      }
    }

    const successRate = totalCoalitions > 0 ? (successCount / totalCoalitions) * 100 : 0;
    const avgDuration = totalCoalitions > 0 ? Math.floor(totalDuration / totalCoalitions) : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalCoalitions,
        successfulCoalitions: successCount,
        partialCoalitions: partialCount,
        failedCoalitions: failureCount,
        successRate: parseFloat(successRate.toFixed(1)),
        averageDuration: avgDuration,
        mostEffectiveLeader,
        leaderStats: Object.entries(agentLeaderStats).map(([leaderId, stats]) => ({
          leaderId,
          coalitionCount: stats.coalitions,
          successRate: parseFloat(((stats.success / stats.coalitions) * 100).toFixed(1)),
        })),
      },
      patterns: (patterns || []).map((p: any) => ({
        patternType: p.pattern_type,
        occurrenceCount: p.occurrence_count,
        averageSynergy: p.average_synergy,
        successRate: p.success_rate,
        insights: p.insights || [],
      })),
      recentCoalitions: (history || [])
        .slice(0, 10)
        .map((c: any) => ({
          taskId: c.task_id,
          leaderId: c.leader_id,
          agentCount: (c.agent_ids || []).length,
          synergySc ore: c.synergy_score,
          outcome: c.outcome,
          executionTime: c.execution_time_ms,
          patternType: c.pattern_type,
          completedAt: c.completed_at,
        })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Coalition history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
