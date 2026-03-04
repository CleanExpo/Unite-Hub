/**
 * POST /api/founder/vault/verify-master
 *
 * Verifies or sets the vault master password.
 * Body: { password: string, action?: 'verify' | 'setup' }
 *
 * - 'verify' (default): compare password against stored bcrypt hash
 * - 'setup': create/update the master password hash (only if none exists)
 *
 * Returns: { valid: boolean, hasPassword: boolean }
 *
 * GET /api/founder/vault/verify-master
 * Returns: { hasPassword: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// ─── GET — check if master password is set ──────────────────────────────────

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
      .from('founder_settings')
      .select('vault_master_hash')
      .eq('owner_id', user.id)
      .single();

    return NextResponse.json({
      hasPassword: !!(data?.vault_master_hash),
    });
  } catch (err: unknown) {
    // Table may not exist yet
    return NextResponse.json({ hasPassword: false });
  }
}

// ─── POST — verify or setup master password ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { password, action = 'verify' } = body;

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Get existing settings
    const { data: settings } = await supabaseAdmin
      .from('founder_settings')
      .select('id, vault_master_hash')
      .eq('owner_id', user.id)
      .single();

    if (action === 'setup') {
      // Only allow setup if no hash exists
      if (settings?.vault_master_hash) {
        return NextResponse.json({ error: 'Master password already set' }, { status: 400 });
      }

      const hash = await bcrypt.hash(password, 12);

      if (settings) {
        await supabaseAdmin
          .from('founder_settings')
          .update({ vault_master_hash: hash })
          .eq('id', settings.id);
      } else {
        await supabaseAdmin
          .from('founder_settings')
          .insert({ owner_id: user.id, vault_master_hash: hash });
      }

      return NextResponse.json({ valid: true, hasPassword: true });
    }

    // Verify
    if (!settings?.vault_master_hash) {
      return NextResponse.json({ valid: false, hasPassword: false });
    }

    const valid = await bcrypt.compare(password, settings.vault_master_hash);
    return NextResponse.json({ valid, hasPassword: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/vault/verify-master]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
