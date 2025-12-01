/**
 * GET /api/calibration/parameters
 *
 * Returns current active calibrated parameters:
 * - Agent weights
 * - Risk threshold values
 * - Uncertainty scaling factors
 * - Reasoning depth allocations
 * - Orchestration scheduling
 * - Applied history with confidence scores
 *
 * Rate limit: 30 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 30 req/min
    const rateLimitResult = checkRateLimit('calibration-parameters', {
      requests: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
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

    // 1. Get all current calibration parameters
    const { data: parameters } = await supabase
      .from('autonomy_calibration_parameters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('applied_at', { ascending: false });

    // Organize parameters by category
    const organized = {
      agentWeights: {} as Record<string, any>,
      riskThresholds: {} as Record<string, any>,
      uncertaintyFactors: {} as Record<string, any>,
      reasoningDepth: {} as Record<string, any>,
      orchestration: {} as Record<string, any>,
    };

    const history: Record<string, any[]> = {};

    for (const param of parameters || []) {
      const key = param.parameter_name;
      const entry = {
        value: param.current_value,
        baseline: param.baseline_value,
        minValue: param.min_value,
        maxValue: param.max_value,
        confidence: param.confidence_score,
        timesApplied: param.times_applied,
        appliedAt: param.applied_at,
      };

      // Track history
      if (!history[key]) {
        history[key] = [];
      }
      history[key].push(entry);

      // Only include latest for each parameter
      if (!organized[param.parameter_category as keyof typeof organized][key] ||
          new Date(param.applied_at) > new Date(organized[param.parameter_category as keyof typeof organized][key].appliedAt)) {
        organized[param.parameter_category as keyof typeof organized][key] = entry;
      }
    }

    // 2. Get tuning results for additional metadata
    const { data: tuningResults } = await supabase
      .from('autonomy_tuning_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Get threshold adjustments
    const { data: thresholdAdjustments } = await supabase
      .from('threshold_adjustment_executions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('executed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      currentParameters: {
        agentWeights: organized.agentWeights,
        riskThresholds: organized.riskThresholds,
        uncertaintyFactors: organized.uncertaintyFactors,
        reasoningDepth: organized.reasoningDepth,
        orchestration: organized.orchestration,
      },
      tuningMetadata: tuningResults ? {
        tuningId: tuningResults.tuning_id,
        overallConfidence: tuningResults.confidence_score,
        parametersLocked: tuningResults.parameters_locked,
        createdAt: tuningResults.created_at,
        explainabilityNotes: tuningResults.explainability_notes?.substring(0, 500) + '...',
      } : null,
      thresholdAdjustmentHistory: thresholdAdjustments?.map(ta => ({
        parameter: ta.parameter_name,
        currentValue: ta.current_value,
        finalValue: ta.final_value,
        constraintActive: ta.safety_constraint_active,
        executedAt: ta.executed_at,
      })) || [],
      parameterHistory: Object.fromEntries(
        Object.entries(history).map(([key, values]) => [
          key,
          values.slice(0, 5), // Last 5 applications
        ])
      ),
      metadata: {
        totalParameters: Object.keys(organized).reduce((sum, cat) => sum + Object.keys(organized[cat as keyof typeof organized]).length, 0),
        lastUpdate: parameters?.[0]?.applied_at,
        workspace: workspaceId,
      },
    });
  } catch (error) {
    console.error('Calibration parameters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibration parameters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
