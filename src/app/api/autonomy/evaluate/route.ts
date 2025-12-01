/**
 * POST /api/autonomy/evaluate
 * Evaluate autonomy score for a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { globalAutonomyEngine, autonomyScoringModel } from '@/lib/autonomy';
import { apiRateLimit } from '@/lib/rate-limit';

interface EvaluateAutonomyBody {
  workspaceId: string;
  objective: string;
  context?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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

    const body: EvaluateAutonomyBody = await req.json();

    if (!body.workspaceId || !body.objective) {
      return NextResponse.json(
        { error: 'workspaceId and objective are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify workspace access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', body.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: orgAccess } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (!orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Evaluate autonomy
    const evaluation = await globalAutonomyEngine.evaluateAutonomy({
      workspaceId: body.workspaceId,
      objective: body.objective,
      context: body.context || {},
    });

    // Get detailed assessment
    const assessment = autonomyScoringModel.assessOverallAutonomy({
      readiness: evaluation.readiness,
      consistency: evaluation.consistency,
      confidence: evaluation.confidence,
      riskScore: evaluation.riskScore,
      uncertaintyScore: evaluation.uncertaintyScore,
    });

    // Log evaluation
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'autonomy_evaluated',
      resource_type: 'autonomy_evaluation',
      resource_id: 'evaluation',
      details: {
        objective: body.objective,
        autonomyScore: evaluation.autonomyScore,
        recommendation: evaluation.recommendation,
        riskScore: evaluation.riskScore,
        uncertaintyScore: evaluation.uncertaintyScore,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        evaluation: {
          autonomyScore: evaluation.autonomyScore,
          readiness: evaluation.readiness,
          consistency: evaluation.consistency,
          confidence: evaluation.confidence,
          riskScore: evaluation.riskScore,
          uncertaintyScore: evaluation.uncertaintyScore,
          recommendation: evaluation.recommendation,
        },
        assessment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error evaluating autonomy:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to evaluate autonomy', details: message },
      { status: 500 }
    );
  }
}
