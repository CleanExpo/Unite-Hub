/**
 * POST /api/founder/obsidian/contacts/[id]/sync
 *
 * Syncs a single contact to the Obsidian vault in Google Drive.
 * Generates a .md note from the contact record, writes it via the vault
 * service, then stamps obsidian_note_path and obsidian_synced_at on the
 * contacts row (using supabaseAdmin to bypass RLS on the update).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { writeContactNote } from '@/lib/obsidian/vault-service';
import { generateContactNote } from '@/lib/obsidian/templates';
import { toSafeFileName } from '@/lib/obsidian/markdown';

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://unite-group.in';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // ── Fetch contact (RLS-scoped — user must own the workspace) ──────────────
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: contactError?.message ?? 'Contact not found' },
        { status: 404 },
      );
    }

    // ── Build note content ────────────────────────────────────────────────────
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

    // ── Write to Google Drive vault ───────────────────────────────────────────
    await writeContactNote(user.id, content, contact.name);

    // ── Stamp the contact row (admin bypass — the sync metadata isn't
    //    user-owned data in an RLS sense; the auth check above is sufficient) ──
    const safeName = toSafeFileName(contact.name);
    const notePath = `Contacts/${safeName}.md`;

    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        obsidian_note_path: notePath,
        obsidian_synced_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      // Non-fatal — note was still written; log and continue
      console.warn('[obsidian/contacts/sync] update stamp failed:', updateError.message);
    }

    return NextResponse.json({ success: true, path: notePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/contacts/sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
