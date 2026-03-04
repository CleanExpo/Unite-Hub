/**
 * GET  /api/nexus/databases — list databases
 * POST /api/nexus/databases — create a database
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

const SYSTEM_OWNER = '00000000-0000-0000-0000-000000000000';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch user-owned databases
    const { data: userDbs, error } = await supabase
      .from('nexus_databases')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Also fetch system seed databases that user hasn't cloned yet
    const userDbNames = new Set((userDbs ?? []).map(d => d.name));
    const { data: seedDbs } = await supabaseAdmin
      .from('nexus_databases')
      .select('*')
      .eq('owner_id', SYSTEM_OWNER);

    // Include seed databases that aren't yet cloned (by name match)
    const combined = [...(userDbs ?? [])];
    for (const seed of (seedDbs ?? [])) {
      if (!userDbNames.has(seed.name)) {
        combined.push(seed);
      }
    }

    return NextResponse.json({ databases: combined });
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
