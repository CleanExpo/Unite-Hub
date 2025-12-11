/**
 * Guardian I02: Simulation Pipeline Timeline API
 * GET /api/guardian/admin/simulation/runs/[id]/timeline
 *
 * Retrieve aggregated timeline view of pipeline stages for a simulation run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';

interface TimelineStage {
  phase: string;
  count: number;
  severity_breakdown: Record<string, number>;
  first_occurred: string;
  last_occurred: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const supabase = getSupabaseServer();

    // Verify run belongs to tenant
    const { data: runData, error: runError } = await supabase
      .from('guardian_simulation_runs')
      .select('id, scenario_id, effective_window_start, effective_window_end')
      .eq('id', runId)
      .eq('tenant_id', workspaceId)
      .single();

    if (runError || !runData) {
      return NextResponse.json(
        { error: 'Simulation run not found' },
        { status: 404 }
      );
    }

    // Fetch traces grouped by phase
    const { data: traces, error: tracesError } = await supabase
      .from('guardian_simulation_pipeline_traces')
      .select('phase, severity, occurred_at')
      .eq('tenant_id', workspaceId)
      .eq('run_id', runId)
      .order('phase', { ascending: true });

    if (tracesError) {
      return NextResponse.json(
        { error: `Failed to fetch traces: ${tracesError.message}` },
        { status: 500 }
      );
    }

    // Aggregate by phase
    const phaseMap = new Map<string, TimelineStage>();

    for (const trace of traces || []) {
      const phase = trace.phase || 'unknown';
      const severity = trace.severity || 'unknown';

      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, {
          phase,
          count: 0,
          severity_breakdown: {},
          first_occurred: trace.occurred_at,
          last_occurred: trace.occurred_at,
        });
      }

      const stage = phaseMap.get(phase)!;
      stage.count++;
      stage.severity_breakdown[severity] = (stage.severity_breakdown[severity] || 0) + 1;
      stage.last_occurred = trace.occurred_at;
    }

    // Convert to ordered array
    const phases = ['ingest', 'rule_eval', 'alert_aggregate', 'correlation', 'incident', 'risk', 'notification'];
    const timeline: TimelineStage[] = [];

    for (const phase of phases) {
      if (phaseMap.has(phase)) {
        timeline.push(phaseMap.get(phase)!);
      }
    }

    return NextResponse.json({
      runId,
      scenarioId: runData.scenario_id,
      window: {
        start: runData.effective_window_start,
        end: runData.effective_window_end,
      },
      timeline,
      summary: {
        total_phases: timeline.length,
        total_trace_entries: (traces || []).length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching simulation timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
