/**
 * GET   /api/founder/approvals/[id]  — get single approval item with comments
 * PATCH /api/founder/approvals/[id]  — update status (approve / reject / defer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data: item, error } = await supabaseAdmin
      .from('approval_queue')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch comments for this approval
    const { data: comments } = await supabaseAdmin
      .from('approval_comments')
      .select('*')
      .eq('approval_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ item, comments: comments ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/approvals/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { status, comment } = body;

    const validStatuses = ['approved', 'rejected', 'deferred', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('approval_queue')
      .select('id, owner_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      status,
      resolved_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : null,
    };

    const { data: updated, error } = await supabaseAdmin
      .from('approval_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/founder/approvals/[id]]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If a comment was provided, save it
    if (comment && typeof comment === 'string' && comment.trim().length > 0) {
      await supabaseAdmin
        .from('approval_comments')
        .insert({
          approval_id: id,
          author: 'phill',
          body: comment.trim(),
        });
    }

    return NextResponse.json({ item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PATCH /api/founder/approvals/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
