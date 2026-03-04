/**
 * POST /api/founder/obsidian/setup
 *
 * Creates the Obsidian vault structure in the connected Google Drive account.
 * Idempotent — safe to call multiple times.
 *
 * Body (optional): { vaultName?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createVault } from '@/lib/obsidian/vault-service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const vaultName = body.vaultName?.trim() || undefined;

    const result = await createVault(user.id, vaultName);

    return NextResponse.json({
      success: true,
      vaultFolderId: result.vaultFolderId,
      vaultName: result.vaultName,
      message: `Vault "${result.vaultName}" created in Google Drive.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/setup]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
