import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch events for projects owned by this user
    const { data: projects } = await supabase
      .from('connected_projects')
      .select('id')
      .eq('owner_id', user.id);

    if (!projects?.length) {
      return NextResponse.json({ events: [] });
    }

    const projectIds = projects.map(p => p.id);

    const { data: events, error } = await supabase
      .from('project_events')
      .select('id, project_id, event_type, payload, created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
