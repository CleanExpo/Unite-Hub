/**
 * POST /api/founder/agents/army/cross-detect
 *
 * Fetches recent (last 24 h) opportunities from all commanders, runs
 * cross-commander signal detection, persists results as high-priority
 * opportunities, and returns the detected signals.
 *
 * UNI-1449: Cross-Commander opportunity detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  detectCrossCommanderSignals,
  persistSignals,
} from '@/lib/agents/army/cross-commander';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const workspaceId: string | undefined = body.workspaceId ?? undefined;

    // Detect signals across all commanders
    const signals = await detectCrossCommanderSignals(supabaseAdmin, workspaceId);

    // Persist as new army_opportunities so they surface in the dashboard
    await persistSignals(supabaseAdmin, signals, workspaceId);

    return NextResponse.json(
      {
        detected: signals.length,
        signals,
        runAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/cross-detect POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
