/**
 * GET /api/founder/health
 *
 * Returns the business health scores for all 5 Unite-Group businesses.
 * No authentication required (scores are derived from server-side env vars and
 * internal Supabase tables — no sensitive user data is exposed).
 *
 * If the caller is authenticated, the owner_id is passed to include their
 * personal alert_events in the recentAlertCount.
 */

import { NextResponse } from 'next/server';
import { getHealthScores } from '@/lib/monitoring/businessHealthScore';

export async function GET() {
  try {
    const scores = await getHealthScores();
    return NextResponse.json({ scores });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/health] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
