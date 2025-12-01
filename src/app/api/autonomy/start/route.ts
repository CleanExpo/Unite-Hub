/**
 * POST /api/autonomy/start
 * Start a global autonomy run with full cross-agent coordination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { globalAutonomyEngine } from '@/lib/autonomy';
import { apiRateLimit } from '@/lib/rate-limit';

interface StartAutonomyBody {
  workspaceId: string;
  objective: string;
  description?: string;
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

    const body: StartAutonomyBody = await req.json();

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

    // Start autonomy run
    const autonomyRun = await globalAutonomyEngine.startGlobalAutonomyRun({
      workspaceId: body.workspaceId,
      objective: body.objective,
      description: body.description,
      userId,
    });

    // Log execution
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'autonomy_started',
      resource_type: 'autonomy_run',
      resource_id: autonomyRun.runId,
      details: {
        objective: body.objective,
        autonomyScore: autonomyRun.autonomyScore,
        riskScore: autonomyRun.riskScore,
        uncertaintyScore: autonomyRun.uncertaintyScore,
        activeAgents: autonomyRun.activeAgents,
        totalSteps: autonomyRun.totalSteps,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        runId: autonomyRun.runId,
        objective: autonomyRun.objective,
        status: autonomyRun.status,
        autonomyScore: autonomyRun.autonomyScore,
        riskScore: autonomyRun.riskScore,
        uncertaintyScore: autonomyRun.uncertaintyScore,
        activeAgents: autonomyRun.activeAgents,
        totalSteps: autonomyRun.totalSteps,
        completedSteps: autonomyRun.completedSteps,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting autonomy run:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to start autonomy run', details: message },
      { status: 500 }
    );
  }
}
