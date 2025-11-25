/**
 * GET /api/reasoning/trace
 * Retrieve complete reasoning trace
 *
 * Returns full reasoning trace including passes, memory, uncertainty,
 * risk, and outcome for analysis and debugging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(
      `reasoning-trace:${clientId}`,
      30, // 30 requests
      3600 // per hour
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

    // Parse query parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const runId = req.nextUrl.searchParams.get('runId');

    // Validate required parameters
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      );
    }

    if (!runId) {
      return NextResponse.json(
        { error: 'runId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
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

    // Get reasoning run
    const { data: run, error: runError } = await supabase
      .from('reasoning_runs')
      .select('*')
      .eq('id', runId)
      .eq('workspace_id', workspaceId)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Reasoning run not found' },
        { status: 404 }
      );
    }

    // Get all passes for this run
    const { data: passes, error: passError } = await supabase
      .from('reasoning_passes')
      .select('*')
      .eq('run_id', runId)
      .order('pass_number', { ascending: true });

    if (passError) {
      return NextResponse.json(
        { error: 'Failed to fetch passes' },
        { status: 500 }
      );
    }

    // Get artifacts for each pass
    const passesWithArtifacts = await Promise.all(
      (passes || []).map(async (pass) => {
        const { data: artifacts } = await supabase
          .from('reasoning_artifacts')
          .select('*')
          .eq('pass_id', pass.id);

        return {
          ...pass,
          artifacts: artifacts || [],
        };
      })
    );

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'reasoning_trace_viewed',
      resource_type: 'reasoning_run',
      resource_id: runId,
      details: {
        passCount: passesWithArtifacts.length,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        run: {
          id: run.id,
          objective: run.objective,
          agent: run.agent,
          status: run.status,
          riskScore: run.risk_score,
          uncertaintyScore: run.uncertainty_score,
          createdAt: run.created_at,
          completedAt: run.completed_at,
        },
        passes: passesWithArtifacts,
        summary: {
          totalPasses: passesWithArtifacts.length,
          finalRisk: run.risk_score,
          finalUncertainty: run.uncertainty_score,
          duration: run.completed_at
            ? new Date(run.completed_at).getTime() - new Date(run.created_at).getTime()
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving reasoning trace:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Failed to retrieve reasoning trace',
        details: message,
      },
      { status: 500 }
    );
  }
}
