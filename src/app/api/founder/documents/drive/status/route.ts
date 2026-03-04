/**
 * GET /api/founder/documents/drive/status
 *
 * Returns the current Google Drive connection status for the authenticated user.
 * Response: { connected: boolean, googleEmail?: string, connectedAt?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data: token, error: tokenError } = await supabaseAdmin
      .from('founder_drive_tokens')
      .select('google_email, connected_at')
      .eq('owner_id', user.id)
      .single();

    if (tokenError || !token) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      googleEmail: token.google_email ?? null,
      connectedAt: token.connected_at ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[driveStatus]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
