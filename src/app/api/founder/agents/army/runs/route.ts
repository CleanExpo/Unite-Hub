/**
 * POST /api/founder/agents/army/runs  — trigger an agent run
 * GET  /api/founder/agents/army/runs  — list recent runs
 *
 * UNI-1444: Task runner framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, commander, task, workspaceId } = body;

    if (!agentId || !task) {
      return NextResponse.json(
        { error: 'agentId and task are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('agent_runs')
      .insert({
        workspace_id: workspaceId || null,
        agent_id: agentId,
        commander: commander || null,
        task,
        status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select('id, agent_id, commander, task, status, started_at')
      .single();

    if (error) {
      console.error('[army/runs POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ run: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/runs POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const commander   = searchParams.get('commander');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('agent_runs')
      .select('id, agent_id, commander, task, status, cost_tokens, cost_usd, started_at, completed_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (commander) {
      query = query.eq('commander', commander);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[army/runs GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute today's cost totals for the cost tracker widget
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: costData } = await supabaseAdmin
      .from('agent_runs')
      .select('cost_usd, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed');

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayCost = 0;
    let weekCost  = 0;
    let monthCost = 0;

    for (const row of costData || []) {
      const d = new Date(row.created_at);
      const usd = Number(row.cost_usd) || 0;
      if (d >= todayStart) todayCost += usd;
      if (d >= weekStart)  weekCost  += usd;
      if (d >= monthStart) monthCost += usd;
    }

    return NextResponse.json({
      runs: data,
      costs: {
        todayUsd:  todayCost,
        weekUsd:   weekCost,
        monthUsd:  monthCost,
        // AUD conversion — approximate 1.55 rate; replace with live FX if needed
        todayAud:  todayCost  * 1.55,
        weekAud:   weekCost   * 1.55,
        monthAud:  monthCost  * 1.55,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/runs GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
