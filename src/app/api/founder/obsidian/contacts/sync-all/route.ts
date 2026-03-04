/**
 * POST /api/founder/obsidian/contacts/sync-all
 *
 * Syncs up to 100 workspace contacts to the Obsidian vault in Google Drive.
 * RLS on the contacts query scopes results to the authenticated user's
 * workspaces automatically.  supabaseAdmin is used only for the metadata
 * stamp updates, which bypass RLS (auth is already verified above).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { writeContactNote } from '@/lib/obsidian/vault-service';
import { generateContactNote } from '@/lib/obsidian/templates';
import { toSafeFileName } from '@/lib/obsidian/markdown';

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://unite-group.in';
const MAX_CONTACTS = 100;

export async function POST(_req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // ── Fetch contacts (RLS scopes to user's workspaces automatically) ────────
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_CONTACTS);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ success: true, synced: 0, failed: 0 });
    }

    // ── Sync each contact sequentially to avoid hammering the Drive API ───────
    let synced = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const content = generateContactNote(
          {
            id: contact.id,
            name: contact.name,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            company: contact.company ?? null,
            status: contact.status ?? null,
            tags: contact.tags ?? [],
            lastInteraction: contact.last_interaction ?? null,
          },
          BASE_URL,
        );

        await writeContactNote(user.id, content, contact.name);

        const safeName = toSafeFileName(contact.name);
        const notePath = `Contacts/${safeName}.md`;

        // Stamp metadata — non-fatal on failure
        const { error: updateError } = await supabaseAdmin
          .from('contacts')
          .update({
            obsidian_note_path: notePath,
            obsidian_synced_at: new Date().toISOString(),
          })
          .eq('id', contact.id);

        if (updateError) {
          console.warn(
            `[obsidian/sync-all] stamp failed for ${contact.id}:`,
            updateError.message,
          );
        }

        synced++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[obsidian/sync-all] failed for contact ${contact.id}:`, message);
        failed++;
      }
    }

    return NextResponse.json({ success: true, synced, failed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/sync-all]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
