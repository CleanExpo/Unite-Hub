/**
 * Guardian I02: Simulation Trace Summary API
 * GET /api/guardian/admin/simulation/runs/[id]/summary
 *
 * Generate AI-powered summary of simulation traces.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { generateSimulationTraceSummary } from '@/lib/guardian/ai/simulationTraceSummarizer';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const maxSteps = parseInt(req.nextUrl.searchParams.get('maxSteps') || '500');

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

    // Generate summary
    const summary = await generateSimulationTraceSummary({
      tenantId: workspaceId,
      runId,
      maxSteps,
    });

    return NextResponse.json({
      runId,
      summary,
    });
  } catch (error: any) {
    console.error('Error generating simulation summary:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
