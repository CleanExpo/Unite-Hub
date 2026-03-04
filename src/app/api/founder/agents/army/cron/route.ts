/**
 * POST /api/founder/agents/army/cron
 *
 * Cron trigger endpoint — called by Vercel Cron or an external scheduler.
 * Verifies x-cron-secret, logs the trigger, returns acknowledgement.
 * Actual agent execution is dispatched asynchronously.
 *
 * UNI-1444: Task runner framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Schedule = 'hourly' | 'daily' | 'overnight';

const VALID_SCHEDULES: Schedule[] = ['hourly', 'daily', 'overnight'];

// Agent assignments per schedule window
const SCHEDULE_AGENTS: Record<Schedule, { agentId: string; commander: string; task: string }[]> = {
  hourly: [
    { agentId: 'rev-lead-hunter',      commander: 'revenue',   task: 'Scan for new inbound leads and score priority queue' },
    { agentId: 'growth-social-watcher', commander: 'growth',    task: 'Monitor social channels for engagement opportunities' },
  ],
  daily: [
    { agentId: 'commander-revenue',    commander: 'revenue',   task: 'Generate daily revenue opportunity brief' },
    { agentId: 'commander-growth',     commander: 'growth',    task: 'Generate daily growth intelligence report' },
    { agentId: 'commander-authority',  commander: 'authority', task: 'Generate daily content calendar and publish queue' },
    { agentId: 'competitive-intel',    commander: 'authority', task: 'Run daily competitor monitoring sweep' },
  ],
  overnight: [
    { agentId: 'deep-analysis',        commander: 'revenue',   task: 'Run overnight deep analysis on pipeline health' },
    { agentId: 'content-batch',        commander: 'authority', task: 'Batch-draft next 7 days of content for review' },
    { agentId: 'lead-enrichment',      commander: 'growth',    task: 'Enrich and re-score all pending leads overnight' },
  ],
};

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    const expected   = process.env.CRON_SECRET;

    if (!expected || cronSecret !== expected) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body     = await req.json().catch(() => ({}));
    const schedule = body.schedule as Schedule | undefined;

    if (!schedule || !VALID_SCHEDULES.includes(schedule)) {
      return NextResponse.json(
        { error: `schedule must be one of: ${VALID_SCHEDULES.join(', ')}` },
        { status: 400 }
      );
    }

    const timestamp  = new Date().toISOString();
    const agents     = SCHEDULE_AGENTS[schedule];

    // Insert pending run records for each agent in this schedule window
    const insertRows = agents.map((a) => ({
      workspace_id: null, // system-level cron — no specific workspace
      agent_id:     a.agentId,
      commander:    a.commander,
      task:         a.task,
      status:       'pending',
      started_at:   timestamp,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('army_runs')
      .insert(insertRows);

    if (insertError) {
      console.error('[army/cron]', insertError.message);
      // Non-fatal — still return triggered so cron doesn't retry infinitely
    }

    console.log(`[army/cron] schedule=${schedule} triggered at ${timestamp}, queued ${agents.length} agents`);

    return NextResponse.json({
      triggered:  true,
      schedule,
      timestamp,
      agentsQueued: agents.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/cron POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
