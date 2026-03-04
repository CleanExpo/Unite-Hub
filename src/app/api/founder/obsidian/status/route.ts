/**
 * GET /api/founder/obsidian/status
 *
 * Returns vault connection status: whether it's set up, file count, last sync.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getVaultStatus } from '@/lib/obsidian/vault-service';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const status = await getVaultStatus(user.id);
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
