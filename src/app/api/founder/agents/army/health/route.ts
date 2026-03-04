/**
 * GET  /api/founder/agents/army/health  — agent army health status
 * POST /api/founder/agents/army/health  — trigger self-heal (reset dead runs)
 *
 * Reports run counts by status over the last 24 hours, calculates error rate,
 * lists stuck runs, and optionally triggers self-healing via POST.
 *
 * UNI-1451: Self-healing + error recovery system
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { detectDeadRuns, healDeadRuns } from '@/lib/agents/army/recovery';

export async function GET(_req: NextRequest) {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();

    // Fetch all runs in last 24 hours
    const { data: runs, error } = await supabaseAdmin
      .from('army_runs')
      .select('id, agent_id, commander, status, started_at, completed_at, created_at')
      .gte('created_at', since24h)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[army/health GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allRuns = runs ?? [];

    // Count by status
    const counts: Record<string, number> = {};
    for (const run of allRuns) {
      const s = run.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const total     = allRuns.length;
    const completed = counts['completed'] ?? 0;
    const failed    = counts['failed']    ?? 0;
    const running   = counts['running']   ?? 0;
    const pending   = counts['pending']   ?? 0;
    const errorRate = total > 0 ? Math.round((failed / total) * 100) : 0;

    // Detect currently stuck runs
    const stuckRunIds = await detectDeadRuns(supabaseAdmin);

    const stuckRuns = allRuns
      .filter((r) => stuckRunIds.includes(r.id as string))
      .map((r) => ({
        id:         r.id,
        agentId:    r.agent_id,
        commander:  r.commander,
        startedAt:  r.started_at,
        ageMinutes: Math.round(
          (Date.now() - new Date(r.started_at as string).getTime()) / 60_000,
        ),
      }));

    return NextResponse.json({
      last24h: {
        total,
        completed,
        failed,
        running,
        pending,
        errorRate,
      },
      stuckRuns,
      stuckCount:  stuckRuns.length,
      healthy:     stuckRuns.length === 0 && errorRate < 20,
      checkedAt:   new Date().toISOString(),
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/health GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const healed = await healDeadRuns(supabaseAdmin);

    return NextResponse.json({
      healed,
      message: healed > 0
        ? `Self-healed ${healed} stuck run(s). They are now marked as failed and eligible for retry.`
        : 'No stuck runs found — army is healthy.',
      healedAt: new Date().toISOString(),
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/health POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
