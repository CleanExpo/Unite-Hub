/**
 * Founder Intel Snapshots API
 * Phase 80: List and create intelligence snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getRecentSnapshots } from '@/lib/founderIntel/founderIntelSnapshotService';
import { buildGlobalSnapshot, buildClientSnapshot } from '@/lib/founderIntel/founderIntelAggregationService';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') as any;
    const client_id = searchParams.get('client_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const snapshots = await getRecentSnapshots({
      scope,
      client_id,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('Snapshots list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { scope, client_id, timeframe_start, timeframe_end } = body;

    // Default timeframe to last 7 days if not provided
    const now = new Date();
    const start = timeframe_start || new Date(now.setDate(now.getDate() - 7)).toISOString();
    const end = timeframe_end || new Date().toISOString();

    let snapshot;

    if (scope === 'client' && client_id) {
      snapshot = await buildClientSnapshot(
        client_id,
        { start, end },
        { userId: user.id }
      );
    } else {
      snapshot = await buildGlobalSnapshot(
        { start, end },
        { userId: user.id }
      );
    }

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Failed to create snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Snapshot creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
