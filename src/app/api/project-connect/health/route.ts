import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('connected_projects')
      .select('id, name, slug, health_status, health_data, last_seen_at, updated_at')
      .order('name');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 });
    }

    return NextResponse.json({ projects: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
