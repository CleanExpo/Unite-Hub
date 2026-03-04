/**
 * POST /api/founder/briefing/generate
 *
 * Manual trigger: generates (or returns cached) weekly briefing for
 * the authenticated founder. Idempotent — safe to call multiple times
 * within the same week.
 *
 * Response:
 *   { success: true, briefing: WeeklyBriefing }
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { generateWeeklyBriefing } from '@/lib/services/founderWeeklyBriefing';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const briefing = await generateWeeklyBriefing(user.id);

    return NextResponse.json({ success: true, briefing });
  } catch (err) {
    console.error('[POST /api/founder/briefing/generate]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
