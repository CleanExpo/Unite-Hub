import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// Simple in-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * GET /api/strategy/history
 * Get historical strategies, patterns, and analytics
 * Rate limit: 30 per minute (read-only)
 */
export async function GET(req: NextRequest) {
  try {
    // Extract parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100); // Max 100
    const coalitionId = req.nextUrl.searchParams.get('coalitionId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(`strategy:history:${workspaceId}`, 30, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}s` },
        { status: 429 }
      );
    }

    // Get authentication
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

    // Initialize Supabase
    const supabase = await getSupabaseServer();

    // Build query for strategy hierarchies
    let query = supabase
      .from('strategy_hierarchies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (coalitionId) {
      query = query.eq('coalition_id', coalitionId);
    }

    // Fetch recent strategies
    const { data: recentStrategies, error: strategiesError } = await query;

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
    }

    // Fetch strategy archives
    let archiveQuery = supabase
      .from('strategy_archives')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('archived_at', { ascending: false })
      .limit(limit);

    if (coalitionId) {
      archiveQuery = archiveQuery.eq('workspace_id', workspaceId);
    }

    const { data: archives, error: archivesError } = await archiveQuery;

    if (archivesError) {
      console.error('Error fetching archives:', archivesError);
    }

    // Fetch strategy patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('strategy_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('efficacy', { ascending: false })
      .limit(10);

    if (patternsError) {
      console.error('Error fetching patterns:', patternsError);
    }

    // Calculate analytics
    const successfulArchives = (archives || []).filter((a) => a.outcome_status === 'successful').length;
    const totalArchives = (archives || []).length;
    const successRate = totalArchives > 0 ? (successfulArchives / totalArchives) * 100 : 0;

    const avgHierarchyScore = recentStrategies && recentStrategies.length > 0
      ? recentStrategies.reduce((sum, s) => sum + (s.hierarchy_score || 0), 0) / recentStrategies.length
      : 0;

    // Calculate average effort
    const totalHours = (archives || []).reduce((sum, a) => {
      const metrics = a.actual_metrics || {};
      return sum + (metrics.totalTime || 0) / 60;
    }, 0);

    const avgHours = totalArchives > 0 ? totalHours / totalArchives : 0;

    // Categorize strategies by status
    const strategyStatus = {
      draft: (recentStrategies || []).filter((s) => s.status === 'draft').length,
      validated: (recentStrategies || []).filter((s) => s.status === 'validated').length,
      executing: (recentStrategies || []).filter((s) => s.status === 'executing').length,
      completed: (recentStrategies || []).filter((s) => s.status === 'completed').length,
    };

    // Format response with strategy summaries
    const strategySummaries = (recentStrategies || []).map((s) => {
      const l1Items = (s.l1_strategic_objective?.items || []).length;
      const l2Items = (s.l2_strategic_pillars?.items || []).length;
      const l3Items = (s.l3_strategic_tactics?.items || []).length;
      const l4Items = (s.l4_operational_tasks?.items || []).length;

      const totalMinutes = [
        ...(s.l1_strategic_objective?.items || []),
        ...(s.l2_strategic_pillars?.items || []),
        ...(s.l3_strategic_tactics?.items || []),
        ...(s.l4_operational_tasks?.items || []),
      ].reduce((sum: number, item: any) => sum + (item.estimatedDuration || 0), 0);

      return {
        id: s.id,
        objectiveId: s.objective_id,
        status: s.status,
        hierarchyScore: s.hierarchy_score,
        decomposition: {
          l1: l1Items,
          l2: l2Items,
          l3: l3Items,
          l4: l4Items,
          total: l1Items + l2Items + l3Items + l4Items,
        },
        estimatedHours: Math.round((totalMinutes / 60) * 10) / 10,
        createdAt: s.created_at,
        validatedAt: s.validated_at,
        completedAt: s.completed_at,
      };
    });

    // Format archives with outcome details
    const archiveSummaries = (archives || []).map((a) => ({
      id: a.id,
      strategyId: a.strategy_hierarchy_id,
      outcome: a.outcome_status,
      completionRate: a.completion_rate,
      timeEfficiency: a.time_efficiency,
      costEfficiency: a.cost_efficiency,
      patterns: a.detected_patterns || [],
      insights: (a.insights || []).slice(0, 3), // First 3 insights
      archivedAt: a.archived_at,
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        totalStrategies: recentStrategies?.length || 0,
        totalArchives,
        successRate: Math.round(successRate * 10) / 10,
        avgHierarchyScore: Math.round(avgHierarchyScore * 10) / 10,
        avgExecutionHours: Math.round(avgHours * 10) / 10,
        byStatus: strategyStatus,
      },
      recentStrategies: strategySummaries,
      completedStrategies: archiveSummaries,
      patterns: (patterns || []).map((p) => ({
        name: p.pattern_name,
        type: p.pattern_type,
        description: p.description,
        frequency: p.frequency,
        successRate: p.success_rate,
        efficacy: p.efficacy,
      })),
    });
  } catch (error) {
    console.error('Strategy history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
