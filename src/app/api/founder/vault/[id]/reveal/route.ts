/**
 * POST /api/founder/vault/[id]/reveal
 *
 * Returns the decrypted secret for an item.
 * Ownership is verified, access is audited.
 * Response includes a 30-second expiry timestamp so the UI can auto-mask.
 *
 * Only the item owner can call this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getVaultItemDecrypted } from '@/lib/security/founder-vault';

type RouteParams = { params: Promise<{ id: string }> };

const REVEAL_TTL_SECONDS = 30;

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    // Extract IP for audit log (CF-Connecting-IP → X-Forwarded-For fallback)
    const ip =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    const { secret } = await getVaultItemDecrypted(id, user.id, ip);

    const expiresAt = Math.floor(Date.now() / 1000) + REVEAL_TTL_SECONDS;

    return NextResponse.json({ success: true, secret, expiresAt });
  } catch (error) {
    console.error('[vault/[id]/reveal] POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reveal secret';
    const status = message.includes('access denied') || message.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
