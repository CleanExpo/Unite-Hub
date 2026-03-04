/**
 * POST /api/nexus/rows — create a row in a database
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { database_id, cells, sort_order } = body;

    if (!database_id) {
      return NextResponse.json({ error: 'database_id is required' }, { status: 400 });
    }

    // Verify database ownership
    const { data: db } = await supabase
      .from('nexus_databases')
      .select('id')
      .eq('id', database_id)
      .eq('owner_id', user.id)
      .single();

    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('nexus_rows')
      .insert({
        database_id,
        cells: cells || {},
        sort_order: sort_order || 0,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ row: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/nexus/rows]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
