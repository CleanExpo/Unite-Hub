/**
 * POST /api/founder/obsidian/daily-note/capture
 *
 * Appends a quick-capture entry to today's Obsidian daily note in Google Drive.
 *
 * Request body:
 *   { text: string, tags?: string[], business?: string }
 *
 * Response:
 *   { success: true, captures: string[] }          — last 3 captures from today
 *   { success: false, error: string }               — vault not connected
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { appendCaptureToDailyNote, getRecentCaptures, getVaultSettings } from '@/lib/obsidian/vault-service';

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse + validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const { text, tags, business } = body as { text?: unknown; tags?: unknown; business?: unknown };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: '`text` is required and must be a non-empty string' }, { status: 400 });
    }

    const normalisedTags: string[] = Array.isArray(tags)
      ? tags.filter((t): t is string => typeof t === 'string')
      : [];

    const normalisedBusiness: string | undefined =
      typeof business === 'string' && business.trim().length > 0
        ? business.trim()
        : undefined;

    // Check vault is connected — return graceful 200 if not
    const vaultSettings = await getVaultSettings(user.id);
    if (!vaultSettings.vault_folder_id) {
      return NextResponse.json({
        success: false,
        error: 'Vault not connected. Visit /founder/integrations to set up Obsidian.',
      });
    }

    // Append capture to today's daily note
    await appendCaptureToDailyNote(user.id, text.trim(), normalisedTags, normalisedBusiness);

    // Return last 3 captures from today
    const captures = await getRecentCaptures(user.id, 3);

    return NextResponse.json({ success: true, captures });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/daily-note/capture]', message);

    // Vault not set up — surface gracefully
    if (message.includes('not connected') || message.includes('not set up') || message.includes('Vault')) {
      return NextResponse.json({
        success: false,
        error: 'Vault not connected. Visit /founder/integrations to set up Obsidian.',
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
