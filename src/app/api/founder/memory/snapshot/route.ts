/**
 * Founder Memory Snapshot API
 *
 * POST: Trigger aggregation to create a new founder_memory_snapshot
 * GET: Fetch latest or specific snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { founderMemoryAggregationService } from '@/lib/founderMemory';

// POST /api/founder/memory/snapshot - Create new snapshot
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, timeRangeDays = 30, dataSources, includeAIInsight = true } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const timeRangeStart = new Date();
    timeRangeStart.setDate(timeRangeStart.getDate() - timeRangeDays);

    const snapshot = await founderMemoryAggregationService.createSnapshot({
      founderId: userId,
      workspaceId,
      timeRangeStart,
      timeRangeEnd: new Date(),
      dataSources,
      includeAIInsight,
    });

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        snapshotAt: snapshot.snapshotAt.toISOString(),
        timeRangeStart: snapshot.timeRangeStart.toISOString(),
        timeRangeEnd: snapshot.timeRangeEnd.toISOString(),
        summary: snapshot.summaryJson,
        dataSourcesIncluded: snapshot.dataSourcesIncluded,
        confidenceScore: snapshot.confidenceScore,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/snapshot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/founder/memory/snapshot - Fetch snapshots
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const snapshotId = req.nextUrl.searchParams.get('snapshotId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (snapshotId) {
      const snapshot = await founderMemoryAggregationService.getSnapshotById(snapshotId, workspaceId);
      if (!snapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, snapshot });
    }

    // Get latest snapshot
    const snapshot = await founderMemoryAggregationService.getLatestSnapshot(userId, workspaceId);

    return NextResponse.json({
      success: true,
      snapshot: snapshot
        ? {
            id: snapshot.id,
            snapshotAt: snapshot.snapshotAt.toISOString(),
            timeRangeStart: snapshot.timeRangeStart.toISOString(),
            timeRangeEnd: snapshot.timeRangeEnd.toISOString(),
            summary: snapshot.summaryJson,
            dataSourcesIncluded: snapshot.dataSourcesIncluded,
            confidenceScore: snapshot.confidenceScore,
          }
        : null,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/snapshot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
