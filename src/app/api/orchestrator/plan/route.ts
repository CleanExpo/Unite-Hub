/**
 * POST /api/orchestrator/plan
 * Generate orchestrator task breakdown and multi-agent execution chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { OrchestratorEngine } from '@/lib/orchestrator';
import { apiRateLimit } from '@/lib/rate-limit';

interface PlanBody {
  workspaceId: string;
  objective: string;
  description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(`orchestrator-plan:${clientId}`, 10, 60);

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

    const body: PlanBody = await req.json();

    if (!body.workspaceId || !body.objective) {
      return NextResponse.json(
        { error: 'workspaceId and objective are required' },
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
    const plan = await orchestrator.planWorkflow({
      workspaceId: body.workspaceId,
      objective: body.objective,
      description: body.description,
    });

    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'orchestrator_plan_created',
      resource_type: 'orchestrator_task',
      resource_id: plan.taskId,
      details: {
        objective: body.objective,
        agentChain: plan.agentChain,
        stepCount: plan.steps.length,
        estimatedRisk: plan.estimatedRisk,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        taskId: plan.taskId,
        agentChain: plan.agentChain,
        steps: plan.steps,
        estimatedRisk: plan.estimatedRisk,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error planning workflow:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to plan workflow', details: message },
      { status: 500 }
    );
  }
}
