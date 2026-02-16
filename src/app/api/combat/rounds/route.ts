/**
 * Combat Rounds API Route
 * Phase 88: Create and manage combat rounds
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  createRound,
  startRound,
  listRounds,
  getRoundById,
  getCombatStats,
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
    const roundId = req.nextUrl.searchParams.get('id');
    const type = req.nextUrl.searchParams.get('type');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const status = req.nextUrl.searchParams.get('status');
    const channel = req.nextUrl.searchParams.get('channel');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    // Get single round
    if (roundId) {
      const round = await getRoundById(roundId);
      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 });
      }
      return NextResponse.json({ data: round });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get stats
    if (type === 'stats') {
      const stats = await getCombatStats(workspaceId);
      return NextResponse.json({ data: stats });
    }

    // List rounds
    const rounds = await listRounds(workspaceId, {
      clientId: clientId || undefined,
      status: status as any || undefined,
      channel: channel || undefined,
      limit,
    });

    return NextResponse.json({ data: rounds });
  } catch (error: unknown) {
    console.error('Combat rounds GET error:', error);
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
    const { action, roundId, clientId, workspaceId, channel, strategy, minConfidence, minSampleSize } = body;

    // Start round action
    if (action === 'start') {
      if (!roundId) {
        return NextResponse.json({ error: 'roundId required' }, { status: 400 });
      }
      const round = await startRound(roundId);
      return NextResponse.json({ data: round });
    }

    // Create round
    if (!clientId || !workspaceId || !channel) {
      return NextResponse.json(
        { error: 'clientId, workspaceId, and channel required' },
        { status: 400 }
      );
    }

    const round = await createRound({
      clientId,
      workspaceId,
      channel,
      strategy,
      minConfidence,
      minSampleSize,
    });

    return NextResponse.json({ data: round });
  } catch (error: unknown) {
    console.error('Combat rounds POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
