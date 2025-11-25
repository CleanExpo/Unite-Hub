/**
 * POST /api/optimizer/run
 *
 * Initiates execution optimization for a workflow:
 * - Analyzes workflow steps and dependencies
 * - Applies calibrated parameters (parallelism, agent selection, reasoning depth)
 * - Computes adaptation profile based on system health
 * - Returns optimized execution plan
 *
 * Rate limit: 10 req/min (optimization analysis is computationally intensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { executionOptimizer, executionAdaptationModel, optimizerArchiveBridge } from '@/lib/autonomy';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 req/min
    const rateLimitResult = checkRateLimit({
      identifier: 'optimizer-run',
      limit: 10,
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

    // Get workspace ID and workflow ID from request
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const body = await req.json();
    const { workflowId, steps, systemHealthScore } = body;

    if (!workflowId || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Missing required parameters: workflowId, steps' },
        { status: 400 }
      );
    }

    if (typeof systemHealthScore !== 'number' || systemHealthScore < 0 || systemHealthScore > 100) {
      return NextResponse.json(
        { error: 'Invalid systemHealthScore: must be a number between 0-100' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // 1. Get calibrated parameters from the latest calibration
    const { data: latestCalibration } = await supabase
      .from('autonomy_calibration_parameters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('applied_at', { ascending: false })
      .limit(1);

    const calibratedParameters = latestCalibration?.[0] || {
      agent_weights: {
        orchestrator: 0.6,
        reasoning_engine: 0.5,
        autonomy_engine: 0.7,
        desktop_agent: 0.4,
        synthex_agent: 0.5,
      },
      risk_weights: {
        cascade_risk: 0.7,
        deadlock_risk: 0.6,
        memory_corruption: 0.8,
      },
      reasoning_depth_allocation: {
        complex_analysis: 10000,
        medium_analysis: 5000,
        simple_tasks: 2000,
      },
      orchestration_schedule: {
        orchestrator_frequency: 50,
        parallel_agents: 3,
      },
    };

    // 2. Compute execution optimization
    const optimization = await executionOptimizer.optimizeWorkflowExecution({
      workspaceId,
      workflowId,
      steps,
      calibratedParameters,
      systemHealthScore,
    });

    // 3. Compute adaptation profile based on current conditions
    const adaptationProfile = await executionAdaptationModel.computeAdaptationScore({
      workspaceId,
      workflowId,
      currentSystemHealth: systemHealthScore,
      recentAgentPerformance: {
        orchestrator: { successRate: 0.95, avgDuration: 500, avgCost: 0.01 },
        reasoning_engine: { successRate: 0.92, avgDuration: 2000, avgCost: 0.05 },
        email_agent: { successRate: 0.98, avgDuration: 1000, avgCost: 0.002 },
        desktop_agent: { successRate: 0.90, avgDuration: 1500, avgCost: 0.03 },
        synthex_agent: { successRate: 0.94, avgDuration: 800, avgCost: 0.015 },
      },
      availableResources: {
        cpu: 100 - (systemHealthScore * 0.5), // Inverse correlation: lower health = higher CPU available for optimization
        memory: 100 - (systemHealthScore * 0.3),
        budget: 1000, // Default monthly budget
      },
      riskLevel: 100 - systemHealthScore,
      stepCount: steps.length,
      avgStepComplexity: steps.reduce((sum, s) => sum + (s.estimatedComplexity || 5), 0) / steps.length,
    });

    // 4. Archive optimization result
    await optimizerArchiveBridge.archiveOptimizationResult({
      workspaceId,
      optimizationId: optimization.optimizationId,
      workflowId,
      estimatedDuration: optimization.expectedDuration,
      estimatedCost: optimization.expectedCost,
      actualDuration: 0, // Will be updated after execution
      actualCost: 0, // Will be updated after execution
      workflowSuccess: false, // Will be updated after execution
      executionNotes: `Parallelism: ${optimization.parallelismLevel}, Risk Score: ${optimization.riskScore}, Agents: ${Object.values(optimization.selectedAgents).join(', ')}`,
    });

    return NextResponse.json({
      success: true,
      optimization: {
        optimizationId: optimization.optimizationId,
        workflowId: optimization.workflowId,
        parallelismLevel: optimization.parallelismLevel,
        riskScore: optimization.riskScore,
        expectedDuration: optimization.expectedDuration,
        expectedCost: optimization.expectedCost,
        contextSizeAdjustment: optimization.contextSizeAdjustment,
        selectedAgents: Object.entries(optimization.selectedAgents).map(([stepId, agent]) => ({
          stepId,
          agent,
        })),
        stepOrdering: optimization.stepOrdering,
        appliedSuccessfully: optimization.appliedSuccessfully,
      },
      adaptation: {
        profileId: adaptationProfile.profileId,
        profileName: adaptationProfile.profileName,
        adaptationScore: adaptationProfile.adaptationScore,
        resourceCostEstimate: adaptationProfile.resourceCostEstimate,
        resourceDurationEstimate: adaptationProfile.resourceDurationEstimate,
        adaptations: {
          parallelismReduction: adaptationProfile.adaptations.parallelismReduction,
          reasoningTokenReduction: adaptationProfile.adaptations.reasoningTokenReduction,
          contextSizeReduction: adaptationProfile.adaptations.contextSizeReduction,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Optimizer run error:', error);
    return NextResponse.json(
      { error: 'Failed to run optimization', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
