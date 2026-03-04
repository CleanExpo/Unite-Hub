/**
 * GET  /api/nexus/databases — list databases
 * POST /api/nexus/databases — create a database
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('nexus_databases')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ databases: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/nexus/databases]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { name, icon, description, columns, default_view, business_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nexus_databases')
      .insert({
        name,
        icon: icon || null,
        description: description || null,
        columns: columns || [],
        default_view: default_view || 'table',
        business_id: business_id || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ database: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/nexus/databases]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
