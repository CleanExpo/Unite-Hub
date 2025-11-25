/**
 * GET /api/optimizer/status
 *
 * Returns the status of the latest optimization runs:
 * - Most recent optimizations
 * - System improvement metrics
 * - Optimization patterns detected
 * - Success rate trends
 *
 * Rate limit: 30 req/min (read-only, low-cost query)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 30 req/min
    const rateLimitResult = checkRateLimit({
      identifier: 'optimizer-status',
      limit: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
      );
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
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // 1. Get recent optimizations (last 10)
    const { data: recentOptimizations } = await supabase
      .from('execution_optimizations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 2. Get optimization results
    const { data: optimizationResults } = await supabase
      .from('execution_optimizer_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3. Get detected patterns
    const { data: detectedPatterns } = await supabase
      .from('execution_optimizer_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('occurrences', { ascending: false });

    // Calculate metrics from results
    let avgEfficiencyGain = 0;
    let successRate = 0;
    let totalCostSaved = 0;
    let totalTimeSaved = 0;

    if (optimizationResults && optimizationResults.length > 0) {
      avgEfficiencyGain = optimizationResults.reduce((sum, r) => sum + (r.efficiency_gain || 0), 0) / optimizationResults.length;
      successRate = optimizationResults.filter(r => r.workflow_success).length / optimizationResults.length;
      totalCostSaved = optimizationResults.reduce((sum, r) => sum + ((r.estimated_cost || 0) - (r.actual_cost || 0)), 0);
      totalTimeSaved = optimizationResults.reduce((sum, r) => sum + ((r.estimated_duration || 0) - (r.actual_duration || 0)), 0);
    }

    // 4. Get system improvement trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weeklyOptimizations } = await supabase
      .from('execution_optimizer_results')
      .select('created_at, efficiency_gain, workflow_success')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sevenDaysAgo);

    // Group by day
    const dailyMetrics: Record<string, { count: number; avgGain: number; successCount: number }> = {};
    if (weeklyOptimizations) {
      for (const opt of weeklyOptimizations) {
        const day = new Date(opt.created_at).toLocaleDateString();
        if (!dailyMetrics[day]) {
          dailyMetrics[day] = { count: 0, avgGain: 0, successCount: 0 };
        }
        dailyMetrics[day].count++;
        dailyMetrics[day].avgGain += opt.efficiency_gain || 0;
        if (opt.workflow_success) dailyMetrics[day].successCount++;
      }

      // Normalize averages
      for (const day in dailyMetrics) {
        dailyMetrics[day].avgGain /= dailyMetrics[day].count;
      }
    }

    // 5. Calculate health status
    const healthStatus = {
      optimizationHealth: avgEfficiencyGain >= 5 ? 'Excellent' : avgEfficiencyGain >= 2 ? 'Good' : 'Needs Improvement',
      reliabilityHealth: successRate >= 0.85 ? 'High' : successRate >= 0.7 ? 'Moderate' : 'Low',
      patternDetectionHealth: detectedPatterns && detectedPatterns.length > 0 ? 'Active' : 'Initializing',
    };

    return NextResponse.json({
      success: true,
      status: {
        lastOptimizationTime: recentOptimizations?.[0]?.created_at || null,
        totalOptimizationsRun: optimizationResults?.length || 0,
        activePatterns: detectedPatterns?.length || 0,
      },
      metrics: {
        avgEfficiencyGain: parseFloat(avgEfficiencyGain.toFixed(2)),
        successRate: parseFloat((successRate * 100).toFixed(1)),
        totalCostSaved: parseFloat(totalCostSaved.toFixed(2)),
        totalTimeSavedMs: Math.round(totalTimeSaved),
      },
      patterns: (detectedPatterns || []).slice(0, 5).map(p => ({
        patternType: p.pattern_type,
        occurrences: p.occurrences,
        avgEfficiencyGain: parseFloat((p.avg_efficiency_gain || 0).toFixed(2)),
        successRate: parseFloat((p.success_rate || 0).toFixed(2)),
        firstAppliedAt: p.first_applied_at,
        lastAppliedAt: p.last_applied_at,
      })),
      recentOptimizations: (recentOptimizations || []).slice(0, 5).map(opt => ({
        optimizationId: opt.optimization_id,
        workflowId: opt.workflow_id,
        parallelismLevel: opt.parallelism_level,
        riskScore: opt.risk_score,
        expectedDuration: opt.expected_duration,
        expectedCost: parseFloat((opt.expected_cost || 0).toFixed(4)),
        createdAt: opt.created_at,
      })),
      trends: {
        dailyMetrics: Object.entries(dailyMetrics).slice(-7).map(([day, metrics]) => ({
          day,
          optimizations: metrics.count,
          avgEfficiencyGain: parseFloat(metrics.avgGain.toFixed(2)),
          successRate: parseFloat((metrics.successCount / metrics.count * 100).toFixed(1)),
        })),
      },
      health: healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Optimizer status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimizer status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
