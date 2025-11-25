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
 * GET /api/strategy/status
 * Get current strategy status, validation results, and conflicts
 * Rate limit: 30 per minute (read-only)
 */
export async function GET(req: NextRequest) {
  try {
    // Extract parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const strategyId = req.nextUrl.searchParams.get('strategyId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(`strategy:status:${workspaceId}`, 30, 60);
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

    // Fetch strategy hierarchy
    const { data: hierarchy, error: hierError } = await supabase
      .from('strategy_hierarchies')
      .select('*')
      .eq('id', strategyId)
      .eq('workspace_id', workspaceId)
      .single();

    if (hierError || !hierarchy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Fetch validation results
    const { data: validation, error: valError } = await supabase
      .from('strategy_validations')
      .select('*')
      .eq('strategy_hierarchy_id', strategyId)
      .eq('workspace_id', workspaceId)
      .order('validation_timestamp', { ascending: false })
      .limit(1)
      .single();

    if (valError && valError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is ok if no validation yet
      console.error('Error fetching validation:', valError);
    }

    // Fetch objective details
    const { data: objective, error: objError } = await supabase
      .from('strategic_objectives')
      .select('*')
      .eq('id', hierarchy.objective_id)
      .eq('workspace_id', workspaceId)
      .single();

    if (objError) {
      console.error('Error fetching objective:', objError);
    }

    // Calculate decomposition metrics
    const l1Items = (hierarchy.l1_strategic_objective?.items || []).length;
    const l2Items = (hierarchy.l2_strategic_pillars?.items || []).length;
    const l3Items = (hierarchy.l3_strategic_tactics?.items || []).length;
    const l4Items = (hierarchy.l4_operational_tasks?.items || []).length;

    const totalItems = l1Items + l2Items + l3Items + l4Items;

    // Calculate effort estimate
    const allLevels = [
      hierarchy.l1_strategic_objective?.items || [],
      hierarchy.l2_strategic_pillars?.items || [],
      hierarchy.l3_strategic_tactics?.items || [],
      hierarchy.l4_operational_tasks?.items || [],
    ];

    const totalMinutes = allLevels.reduce((sum: number, level: any[]) => {
      return sum + level.reduce((levelSum: number, item: any) => levelSum + (item.estimatedDuration || 0), 0);
    }, 0);

    const totalHours = totalMinutes / 60;

    // Count items by risk level
    const allItems = [...(hierarchy.l2_strategic_pillars?.items || []), ...(hierarchy.l3_strategic_tactics?.items || []), ...(hierarchy.l4_operational_tasks?.items || [])];
    const riskCounts = {
      low: allItems.filter((i: any) => i.riskLevel === 'low').length,
      medium: allItems.filter((i: any) => i.riskLevel === 'medium').length,
      high: allItems.filter((i: any) => i.riskLevel === 'high').length,
      critical: allItems.filter((i: any) => i.riskLevel === 'critical').length,
    };

    return NextResponse.json({
      success: true,
      strategy: {
        id: hierarchy.id,
        status: hierarchy.status,
        hierarchyScore: hierarchy.hierarchy_score,
        createdAt: hierarchy.created_at,
        validatedAt: hierarchy.validated_at,
      },
      objective: objective ? {
        id: objective.id,
        title: objective.title,
        description: objective.description,
        priority: objective.priority,
        status: objective.status,
      } : null,
      decomposition: {
        levels: {
          l1: l1Items,
          l2: l2Items,
          l3: l3Items,
          l4: l4Items,
        },
        totalItems,
        ratios: {
          l2ToL1: l2Items / Math.max(l1Items, 1),
          l3ToL2: l3Items / Math.max(l2Items, 1),
          l4ToL3: l4Items / Math.max(l3Items, 1),
        },
      },
      effort: {
        totalHours: Math.round(totalHours * 10) / 10,
        byLevel: {
          l2: Math.round((hierarchy.l2_strategic_pillars?.items || []).reduce((s: number, i: any) => s + i.estimatedDuration / 60, 0) * 10) / 10,
          l3: Math.round((hierarchy.l3_strategic_tactics?.items || []).reduce((s: number, i: any) => s + i.estimatedDuration / 60, 0) * 10) / 10,
          l4: Math.round((hierarchy.l4_operational_tasks?.items || []).reduce((s: number, i: any) => s + i.estimatedDuration / 60, 0) * 10) / 10,
        },
      },
      riskProfile: {
        byLevel: riskCounts,
        totalCritical: riskCounts.critical,
        totalHigh: riskCounts.high,
        healthScore: Math.max(0, 100 - riskCounts.critical * 10 - riskCounts.high * 3),
      },
      validation: validation ? {
        validationScore: validation.validation_score,
        overallStatus: validation.overall_status,
        consensusLevel: validation.consensus_level,
        agentCount: (validation.agent_validations || []).length,
        recommendations: validation.recommendations || [],
        conflicts: {
          count: (validation.conflicts_detected || []).length,
          details: validation.conflicts_detected || [],
        },
        validatedAt: validation.validation_timestamp,
      } : {
        validationScore: null,
        overallStatus: 'not_validated',
        consensusLevel: null,
        agentCount: 0,
        recommendations: [],
        conflicts: { count: 0, details: [] },
        validatedAt: null,
      },
    });
  } catch (error) {
    console.error('Strategy status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
