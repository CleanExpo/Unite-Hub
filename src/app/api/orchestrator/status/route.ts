/**
 * GET /api/orchestrator/status
 * Retrieve orchestrator task states, step history, signals, and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { OrchestratorEngine } from '@/lib/orchestrator';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const taskId = req.nextUrl.searchParams.get('taskId');

    if (!workspaceId || !taskId) {
      return NextResponse.json(
        { error: 'workspaceId and taskId query parameters are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
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
    const trace = await orchestrator.getTaskStatus(taskId, workspaceId);

    // Log status retrieval
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'orchestrator_status_viewed',
      resource_type: 'orchestrator_task',
      resource_id: taskId,
      details: {
        status: trace.status,
        stepCount: trace.steps.length,
        riskScore: trace.riskScore,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        taskId: trace.taskId,
        objective: trace.objective,
        status: trace.status,
        agentChain: trace.agentChain,
        steps: trace.steps,
        riskScore: trace.riskScore,
        uncertaintyScore: trace.uncertaintyScore,
        confidenceScore: trace.confidenceScore,
        signals: trace.signals,
        finalOutput: trace.finalOutput,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving task status:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to retrieve task status', details: message },
      { status: 500 }
    );
  }
}
