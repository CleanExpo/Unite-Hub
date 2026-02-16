/**
 * Combat Results API Route
 * Phase 88: List results and run combat cycles
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  listResults,
  getResultByRound,
  runCombatCycle,
  getSchedulerStatus,
  getIntegrationStats,
} from '@/lib/creativeCombat';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const roundId = req.nextUrl.searchParams.get('roundId');
    const type = req.nextUrl.searchParams.get('type');
    const resultType = req.nextUrl.searchParams.get('resultType');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    // Get result by round
    if (roundId) {
      const result = await getResultByRound(roundId);
      if (!result) {
        return NextResponse.json({ error: 'Result not found' }, { status: 404 });
      }
      return NextResponse.json({ data: result });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get scheduler status
    if (type === 'scheduler') {
      const status = await getSchedulerStatus(workspaceId);
      return NextResponse.json({ data: status });
    }

    // Get integration stats
    if (type === 'integrations') {
      const stats = await getIntegrationStats(workspaceId);
      return NextResponse.json({ data: stats });
    }

    // List results
    const results = await listResults(workspaceId, {
      resultType: resultType as any || undefined,
      limit,
    });

    return NextResponse.json({ data: results });
  } catch (error: unknown) {
    console.error('Combat results GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (action === 'run_cycle') {
      const result = await runCombatCycle(workspaceId);
      return NextResponse.json({ data: result });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "run_cycle"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Combat results POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
