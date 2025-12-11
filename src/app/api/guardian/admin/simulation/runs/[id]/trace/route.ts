/**
 * Guardian I02: Simulation Pipeline Trace API
 * GET /api/guardian/admin/simulation/runs/[id]/trace
 *
 * Retrieve detailed pipeline traces for a simulation run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(req.nextUrl.searchParams.get('pageSize') || '50'), 500);

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const supabase = getSupabaseServer();

    // Verify run belongs to tenant
    const { data: runData, error: runError } = await supabase
      .from('guardian_simulation_runs')
      .select('id, tenant_id')
      .eq('id', runId)
      .eq('tenant_id', workspaceId)
      .single();

    if (runError || !runData) {
      return NextResponse.json(
        { error: 'Simulation run not found' },
        { status: 404 }
      );
    }

    // Fetch traces with pagination
    const offset = (page - 1) * pageSize;

    const { data: traces, error: tracesError } = await supabase
      .from('guardian_simulation_pipeline_traces')
      .select('*')
      .eq('tenant_id', workspaceId)
      .eq('run_id', runId)
      .order('step_index', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (tracesError) {
      return NextResponse.json(
        { error: `Failed to fetch traces: ${tracesError.message}` },
        { status: 500 }
      );
    }

    // Count total traces
    const { count: totalCount, error: countError } = await supabase
      .from('guardian_simulation_pipeline_traces')
      .select('*', { count: 'exact' })
      .eq('tenant_id', workspaceId)
      .eq('run_id', runId);

    if (countError) {
      console.error('Error counting traces:', countError);
    }

    return NextResponse.json({
      runId,
      traces: traces || [],
      meta: {
        total: totalCount || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Error fetching simulation traces:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
