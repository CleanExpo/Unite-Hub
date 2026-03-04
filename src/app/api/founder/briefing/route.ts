/**
 * GET /api/founder/briefing
 *
 * Returns the latest weekly briefing and up to 8 historical briefings
 * for the authenticated founder.
 *
 * Response:
 *   { latest: WeeklyBriefing | null, history: WeeklyBriefing[] }
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('founder_weekly_briefings')
      .select('*')
      .eq('owner_id', user.id)
      .order('week_starting', { ascending: false })
      .limit(9);

    if (error) {
      console.error('[GET /api/founder/briefing]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const latest = rows.length > 0 ? rows[0] : null;
    const history = rows.slice(1);

    return NextResponse.json({ latest, history });
  } catch (err) {
    console.error('[GET /api/founder/briefing] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
