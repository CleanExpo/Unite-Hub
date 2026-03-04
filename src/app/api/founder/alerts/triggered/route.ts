/**
 * GET /api/founder/alerts/triggered
 *
 * Returns the most recent alert_events for the authenticated user.
 * Optionally filtered by business_id via ?business=<id> query param.
 * Defaults to the last 50 events ordered by fired_at DESC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateAlerts } from '@/lib/monitoring/founderAlertService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessFilter  = searchParams.get('business');
    const runEvaluation   = searchParams.get('evaluate') === 'true';
    const limit           = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    // Optionally trigger a fresh evaluation cycle before returning events
    if (runEvaluation) {
      await evaluateAlerts(user.id);
    }

    let query = supabaseAdmin
      .from('alert_events')
      .select('*')
      .eq('owner_id', user.id)
      .order('fired_at', { ascending: false })
      .limit(limit);

    if (businessFilter) {
      query = query.eq('business_id', businessFilter);
    }

    const { data, error } = await query;

    if (error) {
      if ((error as any).code === '42P01') {
        return NextResponse.json({ events: [] });
      }
      console.error('[GET /api/founder/alerts/triggered]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/alerts/triggered] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
