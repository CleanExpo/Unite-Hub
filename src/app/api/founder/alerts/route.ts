/**
 * GET  /api/founder/alerts  — list alert rules for the authenticated user
 * POST /api/founder/alerts  — create a new alert rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('alert_rules')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Table not yet migrated
      if ((error as any).code === '42P01') {
        return NextResponse.json({ rules: [] });
      }
      console.error('[GET /api/founder/alerts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/alerts] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { business_id, metric, operator, threshold, label, enabled } = body;

    // Validation
    const validMetrics   = ['mrr', 'invoice_count', 'xero_connected'];
    const validOperators = ['lt', 'gt', 'lte', 'gte', 'eq'];
    const validBizIds    = ['disaster-recovery', 'restore-assist', 'ato', 'nrpg', 'unite-group'];

    if (!business_id || !validBizIds.includes(business_id)) {
      return NextResponse.json({ error: 'Invalid business_id' }, { status: 400 });
    }
    if (!metric || !validMetrics.includes(metric)) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }
    if (!operator || !validOperators.includes(operator)) {
      return NextResponse.json({ error: 'Invalid operator' }, { status: 400 });
    }
    if (threshold === undefined || threshold === null || isNaN(Number(threshold))) {
      return NextResponse.json({ error: 'Invalid threshold' }, { status: 400 });
    }
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('alert_rules')
      .insert({
        owner_id:    user.id,
        business_id,
        metric,
        operator,
        threshold:   Number(threshold),
        label:       label.trim(),
        enabled:     enabled !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/founder/alerts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rule: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/alerts] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
