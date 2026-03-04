/**
 * GET  /api/founder/social-channels?business_key=dr
 * POST /api/founder/social-channels — create/upsert a channel
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const businessKey = req.nextUrl.searchParams.get('business_key');
    if (!businessKey) {
      return NextResponse.json({ error: 'business_key is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_channels')
      .select('*')
      .eq('owner_id', user.id)
      .eq('business_key', businessKey)
      .order('platform', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ channels: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/social-channels]', message);
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
    const { business_key, platform, handle, profile_url, connected } = body;

    if (!business_key || !platform) {
      return NextResponse.json({ error: 'business_key and platform are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('social_channels')
      .insert({
        business_key,
        platform,
        handle: handle || null,
        profile_url: profile_url || null,
        connected: connected ?? false,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ channel: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/social-channels]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
