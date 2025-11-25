/**
 * POST /api/reasoning/start
 * Begin multi-pass reasoning run
 *
 * Accepts objective and optional starting memories, executes full
 * 5-pass reasoning engine, returns complete trace.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { PassEngine } from '@/lib/reasoning';
import { apiRateLimit } from '@/lib/rate-limit';

interface StartReasoningBody {
  workspaceId: string;
  agent: string;
  objective: string;
  initialMemoryIds?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(
      `reasoning-start:${clientId}`,
      10, // 10 requests
      60 // per minute (expensive operation)
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.resetInSeconds,
        },
        { status: 429 }
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

    // Parse request body
    const body: StartReasoningBody = await req.json();

    // Validate required fields
    if (!body.workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!body.agent) {
      return NextResponse.json(
        { error: 'agent is required' },
        { status: 400 }
      );
    }

    if (!body.objective) {
      return NextResponse.json(
        { error: 'objective is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', body.workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Verify user is owner of workspace's org
    const { data: orgAccess, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (orgError || !orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Execute multi-pass reasoning
    console.log(`🧠 Starting reasoning for: ${body.objective}`);
    const passEngine = new PassEngine();

    const trace = await passEngine.executeReasoning({
      workspaceId: body.workspaceId,
      agent: body.agent,
      objective: body.objective,
      initialMemoryIds: body.initialMemoryIds,
    });

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'reasoning_started',
      resource_type: 'reasoning_run',
      resource_id: trace.runId,
      details: {
        agent: body.agent,
        objective: body.objective,
        finalRisk: trace.finalRisk,
        finalUncertainty: trace.finalUncertainty,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        runId: trace.runId,
        objective: trace.objective,
        agent: trace.agent,
        finalRisk: trace.finalRisk,
        finalUncertainty: trace.finalUncertainty,
        passCount: trace.passes.length,
        totalTimeMs: trace.totalTimeMs,
        finalDecision: trace.finalDecision,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error starting reasoning:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Failed to start reasoning',
        details: message,
      },
      { status: 500 }
    );
  }
}
