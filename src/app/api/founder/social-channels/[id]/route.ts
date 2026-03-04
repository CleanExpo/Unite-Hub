/**
 * PATCH  /api/founder/social-channels/[id] — update a channel
 * DELETE /api/founder/social-channels/[id] — delete a channel
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if ('handle' in body) updates.handle = body.handle;
    if ('profile_url' in body) updates.profile_url = body.profile_url;
    if ('connected' in body) updates.connected = body.connected;
    if ('platform' in body) updates.platform = body.platform;
    if ('last_post_at' in body) updates.last_post_at = body.last_post_at;

    const { data, error } = await supabase
      .from('social_channels')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ channel: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PATCH /api/founder/social-channels/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('social_channels')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[DELETE /api/founder/social-channels/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
