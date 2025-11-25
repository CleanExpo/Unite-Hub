import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { strategyHierarchyEngine } from '@/lib/strategy/StrategyHierarchyEngine';
import { strategicDecompositionModel } from '@/lib/strategy/StrategicDecompositionModel';
import { strategyValidationModel } from '@/lib/strategy/StrategyValidationModel';
import type { StrategicObjective, StrategyHierarchy } from '@/lib/strategy/StrategyHierarchyEngine';

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
 * POST /api/strategy/create
 * Create a new strategy hierarchy from an objective
 * Rate limit: 5 per minute (strategic planning is resource-intensive)
 */
export async function POST(req: NextRequest) {
  try {
    // Extract workspace ID from query params
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(`strategy:${workspaceId}`, 5, 60);
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

    // Parse request body
    const body = await req.json();
    const { coalitionId, objectiveTitle, objectiveDescription, context, successCriteria, constraints, priority } = body;

    if (!coalitionId || !objectiveTitle) {
      return NextResponse.json(
        { error: 'coalitionId and objectiveTitle are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const supabase = await getSupabaseServer();

    // Create strategic objective
    const objective: StrategicObjective = {
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      coalitionId,
      title: objectiveTitle,
      description: objectiveDescription || '',
      context: context || '',
      successCriteria: successCriteria || [],
      constraints: constraints || [],
      priority: priority || 'medium',
      createdAt: new Date(),
    };

    // Generate strategy hierarchy
    const hierarchy = await strategyHierarchyEngine.generateHierarchy(objective);

    // Analyze decomposition quality
    const decompositionAnalysis = await strategicDecompositionModel.analyzeDecomposition(hierarchy);

    // Validate strategy with multiple agents
    const agentIds = ['executor-agent', 'validator-agent', 'planner-agent', 'leader-agent'];
    const validationResult = await strategyValidationModel.validateWithMultipleAgents(hierarchy, agentIds);

    // Check for conflicts
    const conflicts = await strategyValidationModel.detectConflicts(hierarchy);

    // Store objective in database
    const { error: objError } = await supabase.from('strategic_objectives').insert({
      id: objective.id,
      workspace_id: workspaceId,
      coalition_id: coalitionId,
      title: objective.title,
      description: objective.description,
      context: objective.context,
      success_criteria: objective.successCriteria,
      constraints: objective.constraints,
      priority: objective.priority,
      status: 'active',
      created_by: userId,
    });

    if (objError) {
      console.error('Failed to store objective:', objError);
      return NextResponse.json({ error: 'Failed to store objective' }, { status: 500 });
    }

    // Store strategy hierarchy in database
    const { error: hierError } = await supabase.from('strategy_hierarchies').insert({
      id: hierarchy.id,
      workspace_id: workspaceId,
      coalition_id: coalitionId,
      objective_id: objective.id,
      l1_strategic_objective: hierarchy.L1_Strategic_Objective,
      l2_strategic_pillars: hierarchy.L2_Strategic_Pillars,
      l3_strategic_tactics: hierarchy.L3_Strategic_Tactics,
      l4_operational_tasks: hierarchy.L4_Operational_Tasks,
      hierarchy_score: hierarchy.hierarchyScore,
      status: 'draft',
    });

    if (hierError) {
      console.error('Failed to store hierarchy:', hierError);
      return NextResponse.json({ error: 'Failed to store hierarchy' }, { status: 500 });
    }

    // Store validation result in database
    const { error: valError } = await supabase.from('strategy_validations').insert({
      workspace_id: workspaceId,
      strategy_hierarchy_id: hierarchy.id,
      validation_score: validationResult.validationScore,
      overall_status: validationResult.overallStatus,
      agent_validations: validationResult.agentValidations,
      consensus_level: validationResult.consensusLevel,
      conflicting_views: validationResult.conflictingViews,
      recommendations: validationResult.recommendations,
      conflicts_detected: conflicts,
    });

    if (valError) {
      console.error('Failed to store validation:', valError);
      return NextResponse.json({ error: 'Failed to store validation' }, { status: 500 });
    }

    // Calculate total effort estimate
    const totalEffort = strategyHierarchyEngine.estimateTotalEffort(hierarchy);
    const criticalPath = strategyHierarchyEngine.identifyCriticalPath(hierarchy);

    return NextResponse.json(
      {
        success: true,
        strategy: {
          id: hierarchy.id,
          objectiveId: objective.id,
          hierarchyScore: hierarchy.hierarchyScore,
          status: 'draft',
          decomposition: {
            l1Count: hierarchy.L1_Strategic_Objective.items.length,
            l2Count: hierarchy.L2_Strategic_Pillars.items.length,
            l3Count: hierarchy.L3_Strategic_Tactics.items.length,
            l4Count: hierarchy.L4_Operational_Tasks.items.length,
          },
          estimatedEffort: {
            totalHours: totalEffort,
            criticalPathLength: criticalPath.length,
          },
          decompositionQuality: {
            completeness: decompositionAnalysis.metrics.completeness,
            balance: decompositionAnalysis.metrics.balance,
            coherence: decompositionAnalysis.metrics.coherence,
            clarity: decompositionAnalysis.metrics.clarity,
            overall: decompositionAnalysis.metrics.overall,
          },
          validation: {
            validationScore: validationResult.validationScore,
            overallStatus: validationResult.overallStatus,
            consensusLevel: validationResult.consensusLevel,
            agentCount: validationResult.agentValidations.length,
          },
          conflicts: {
            count: conflicts.length,
            byType: conflicts.reduce(
              (acc, c) => {
                acc[c.type] = (acc[c.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
          recommendations: validationResult.recommendations.slice(0, 3),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Strategy creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
