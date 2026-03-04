/**
 * GET  /api/founder/approvals  — list approval items (filterable by status, type, priority)
 * POST /api/founder/approvals  — create a new approval item (Bron submits work)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status   = url.searchParams.get('status');
    const type     = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');

    let query = supabaseAdmin
      .from('approval_queue')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (priority) {
      query = query.eq('priority', Number(priority));
    }

    const { data, error } = await query;

    if (error) {
      if ((error as any).code === '42P01') {
        return NextResponse.json({ items: [], counts: {} });
      }
      console.error('[GET /api/founder/approvals]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute counts for filter badges
    const allItems = data ?? [];
    const counts = {
      all:      allItems.length,
      pending:  allItems.filter((i: any) => i.status === 'pending').length,
      approved: allItems.filter((i: any) => i.status === 'approved').length,
      rejected: allItems.filter((i: any) => i.status === 'rejected').length,
      deferred: allItems.filter((i: any) => i.status === 'deferred').length,
      executed: allItems.filter((i: any) => i.status === 'executed').length,
    };

    // If filtering by status, re-fetch the filtered subset
    // (the counts above are from the unfiltered owner set)
    if (status && status !== 'all') {
      const filtered = allItems.filter((i: any) => i.status === status);
      return NextResponse.json({ items: filtered, counts });
    }

    return NextResponse.json({ items: allItems, counts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/approvals] Unexpected:', message);
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
    const { type, title, summary, content_json, priority, agent_source, execution_config } = body;

    const validTypes = ['email', 'linear', 'pr', 'content', 'contract', 'agent_output'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const callbackUrl = `/api/founder/approvals/webhook?id=PLACEHOLDER`;

    const { data, error } = await supabaseAdmin
      .from('approval_queue')
      .insert({
        type,
        title:            title.trim(),
        summary:          summary ?? null,
        content_json:     content_json ?? {},
        priority:         priority ?? 2,
        agent_source:     agent_source ?? null,
        execution_config: execution_config ?? null,
        callback_url:     callbackUrl,
        owner_id:         user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/founder/approvals]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update callback_url with real ID
    if (data) {
      await supabaseAdmin
        .from('approval_queue')
        .update({ callback_url: `/api/founder/approvals/webhook?id=${data.id}` })
        .eq('id', data.id);
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/approvals] Unexpected:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
