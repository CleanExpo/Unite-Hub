/**
 * GET   /api/nexus/databases/:id — get database with its rows
 * PATCH /api/nexus/databases/:id — update database config
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data: database, error } = await supabase
      .from('nexus_databases')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    const { data: rows } = await supabase
      .from('nexus_rows')
      .select('*')
      .eq('database_id', id)
      .eq('owner_id', user.id)
      .is('archived_at', null)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ database, rows: rows ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/nexus/databases/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const allowed = ['name', 'icon', 'description', 'columns', 'default_view', 'group_by', 'sort_by', 'filters', 'business_id'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nexus_databases')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ database: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PATCH /api/nexus/databases/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
