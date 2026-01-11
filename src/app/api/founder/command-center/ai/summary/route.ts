/**
 * Founder Command Center - AI Summary API
 *
 * Phase: D52 - Founder Command Center & Cross-Business Insights
 *
 * Routes:
 * - POST /api/founder/command-center/ai/summary - Generate AI insights
 *
 * Query Params:
 * - action=cross_business - Generate cross-business insights
 * - action=snapshot&snapshot_id=<id> - Summarize specific snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  aiGenerateCrossBusinessInsights,
  aiSummarizeSnapshot,
  listKPISnapshots,
} from '@/lib/founder/commandCenterService';

// =============================================================================
// POST - Generate AI insights
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const founderUserId = user.id;
    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Generate cross-business insights
    if (action === 'cross_business' || !action) {
      const insights = await aiGenerateCrossBusinessInsights(founderUserId);
      return NextResponse.json({ insights });
    }

    // Summarize specific snapshot
    if (action === 'snapshot') {
      const snapshotId = request.nextUrl.searchParams.get('snapshot_id') || body.snapshot_id;

      if (!snapshotId) {
        return NextResponse.json(
          { error: 'snapshot_id is required' },
          { status: 400 }
        );
      }

      // Get the snapshot
      const snapshots = await listKPISnapshots(founderUserId, { limit: 1000 });
      const snapshot = snapshots.find((s) => s.id === snapshotId);

      if (!snapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }

      const summary = await aiSummarizeSnapshot(snapshot);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/founder/command-center/ai/summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI summary' },
      { status: 500 }
    );
  }
}
