/**
 * PUT    /api/founder/alerts/[id]  — update an alert rule (label, threshold, enabled, etc.)
 * DELETE /api/founder/alerts/[id]  — remove an alert rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Whitelist updatable fields
    const updates: Record<string, unknown> = {};
    if (body.label     !== undefined) updates.label     = String(body.label).trim();
    if (body.threshold !== undefined) updates.threshold = Number(body.threshold);
    if (body.enabled   !== undefined) updates.enabled   = Boolean(body.enabled);
    if (body.operator  !== undefined) {
      const validOperators = ['lt', 'gt', 'lte', 'gte', 'eq'];
      if (!validOperators.includes(body.operator)) {
        return NextResponse.json({ error: 'Invalid operator' }, { status: 400 });
      }
      updates.operator = body.operator;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('alert_rules')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)   // enforce ownership via the service role
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/founder/alerts/[id]]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Rule not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ rule: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PUT /api/founder/alerts/[id]] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('alert_rules')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      console.error('[DELETE /api/founder/alerts/[id]]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[DELETE /api/founder/alerts/[id]] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
