/**
 * POST /api/orchestrator/execute
 * Execute structured multi-agent plan with risk and uncertainty monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { OrchestratorEngine } from '@/lib/orchestrator';
import { apiRateLimit } from '@/lib/rate-limit';

interface ExecuteBody {
  workspaceId: string;
  taskId: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(`orchestrator-execute:${clientId}`, 5, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetInSeconds },
        { status: 429 }
      );
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

    const body: ExecuteBody = await req.json();

    if (!body.workspaceId || !body.taskId) {
      return NextResponse.json(
        { error: 'workspaceId and taskId are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
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

    const orchestrator = new OrchestratorEngine();
    const trace = await orchestrator.executeWorkflow(body.taskId, body.workspaceId);

    // Log execution
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'orchestrator_executed',
      resource_type: 'orchestrator_task',
      resource_id: body.taskId,
      details: {
        status: trace.status,
        finalRisk: trace.riskScore,
        finalUncertainty: trace.uncertaintyScore,
        stepCount: trace.steps.length,
        totalTimeMs: trace.totalTimeMs,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        taskId: trace.taskId,
        objective: trace.objective,
        status: trace.status,
        steps: trace.steps,
        riskScore: trace.riskScore,
        uncertaintyScore: trace.uncertaintyScore,
        signals: trace.signals,
        finalOutput: trace.finalOutput,
        totalTimeMs: trace.totalTimeMs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error executing workflow:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: message },
      { status: 500 }
    );
  }
}
