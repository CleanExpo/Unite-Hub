/**
 * GET /api/founder/openclaw
 *
 * Returns OpenClaw connection status for the Founder panel.
 * Priority order:
 *   1. OPENCLAW_URL + OPENCLAW_API_KEY env vars
 *   2. founder_vault_items where label ILIKE '%openclaw%' or '%open-claw%'
 *
 * Response:
 * {
 *   connected: boolean,
 *   url: string | null,
 *   hasApiKey: boolean,
 *   source: 'env' | 'vault' | 'none'
 * }
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    // ── Priority 1: environment variables ────────────────────────────────────
    const envUrl = process.env.OPENCLAW_URL ?? null;
    const envKey = process.env.OPENCLAW_API_KEY ?? null;

    if (envUrl && envKey) {
      return NextResponse.json({
        connected: true,
        url: envUrl,
        hasApiKey: true,
        source: 'env',
      });
    }

    // ── Priority 2: Founder Vault lookup ─────────────────────────────────────
    // Use supabaseAdmin so we can bypass RLS for the lookup; ownership is still
    // enforced by filtering on owner_id.
    try {
      const { data: vaultItems, error: vaultError } = await supabaseAdmin
        .from('founder_vault_items')
        .select('id, label, url')
        .eq('owner_id', user.id)
        .or('label.ilike.%openclaw%,label.ilike.%open-claw%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (vaultError) {
        console.warn('[openclaw/status] Vault query error:', vaultError.message);
      }

      if (vaultItems && vaultItems.length > 0) {
        const item = vaultItems[0];
        return NextResponse.json({
          connected: true,
          url: item.url ?? null,
          hasApiKey: true, // secret is encrypted in vault — assume present
          source: 'vault',
          vaultItemId: item.id,
        });
      }
    } catch (vaultErr) {
      console.warn('[openclaw/status] Vault lookup failed:', vaultErr);
    }

    // ── Not configured ───────────────────────────────────────────────────────
    return NextResponse.json({
      connected: false,
      url: null,
      hasApiKey: false,
      source: 'none',
    });
  } catch (error) {
    console.error('[openclaw/status] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
