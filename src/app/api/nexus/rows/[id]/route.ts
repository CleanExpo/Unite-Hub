/**
 * PATCH  /api/nexus/rows/:id — update row cells
 * DELETE /api/nexus/rows/:id — archive row
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const allowed = ['cells', 'starred', 'sort_order'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nexus_rows')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ row: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PATCH /api/nexus/rows/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { error } = await supabase
      .from('nexus_rows')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[DELETE /api/nexus/rows/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
