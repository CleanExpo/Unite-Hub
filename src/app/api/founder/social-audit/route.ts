/**
 * GET  /api/founder/social-audit — fetch all social channels across all businesses
 * POST /api/founder/social-audit — mark all channels with handles as verified (connected=true)
 *
 * Related to: UNI-1372, UNI-1373
 */
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('social_channels')
      .select('*')
      .eq('owner_id', user.id)
      .order('business_key', { ascending: true })
      .order('platform', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ channels: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/social-audit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Mark all channels with handles as connected/verified
    const { data, error } = await supabase
      .from('social_channels')
      .update({
        connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', user.id)
      .not('handle', 'is', null)
      .neq('handle', '')
      .select('id');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      verified: data?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/social-audit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
