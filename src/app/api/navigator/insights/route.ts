/**
 * Navigator Insights API
 * Phase 96: Get insights for a snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getInsightsForSnapshot } from '@/lib/navigator';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshotId = req.nextUrl.searchParams.get('snapshotId');
    if (!snapshotId) {
      return NextResponse.json({ error: 'snapshotId required' }, { status: 400 });
    }

    const insights = await getInsightsForSnapshot(snapshotId);

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (error) {
    console.error('Failed to get insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
