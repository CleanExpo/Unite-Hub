/**
 * POST /api/founder/obsidian/ai-summary
 *
 * Generates a structured AI summary for a CRM contact by reading their
 * Obsidian vault notes from Google Drive and analysing them with Claude Haiku.
 *
 * Body: { contactId: string }
 *
 * Response:
 *   { summary: AISummaryResult } — when notes are found
 *   { summary: null, message: string } — when no notes exist
 *   { error: string } — on failure
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getVaultSettings,
  listVaultFiles,
  readVaultFile,
} from '@/lib/obsidian/vault-service';

interface AISummaryResult {
  summary: string;
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'needs-attention';
  lastDiscussed: string;
  keyTopics: string[];
}

export async function POST(req: NextRequest) {
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

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({})) as { contactId?: string };
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    // ── Fetch contact from Supabase ───────────────────────────────────────────
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, email, company')
      .eq('id', contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactName: string = contact.name ?? '';

    // ── Check vault connection ────────────────────────────────────────────────
    const vaultSettings = await getVaultSettings(user.id);

    if (!vaultSettings.vault_folder_id) {
      return NextResponse.json({ error: 'Vault not connected' }, { status: 400 });
    }

    // ── List files in the Contacts folder ────────────────────────────────────
    const files = await listVaultFiles(user.id, 'Contacts');

    // ── Find files matching the contact name (case-insensitive) ──────────────
    const nameLower = contactName.toLowerCase();
    const matchingFiles = files.filter(f =>
      f.name.replace(/\.md$/i, '').toLowerCase().includes(nameLower) ||
      nameLower.includes(f.name.replace(/\.md$/i, '').toLowerCase()),
    );

    if (matchingFiles.length === 0) {
      return NextResponse.json({
        summary: null,
        message: 'No Obsidian notes found for this contact.',
      });
    }

    // ── Read matching file contents ───────────────────────────────────────────
    const noteContentsArr = await Promise.all(
      matchingFiles.map(f => readVaultFile(user.id, f.id)),
    );
    const noteContents = noteContentsArr.join('\n\n---\n\n');

    // ── Call Claude Haiku ─────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are analysing CRM notes for ${contactName}.
Notes from their Obsidian vault:

${noteContents}

Provide a JSON response with:
{
  "summary": "2-3 sentence overview of the relationship and recent activity",
  "actionItems": ["list", "of", "outstanding actions"],
  "sentiment": "positive | neutral | needs-attention",
  "lastDiscussed": "brief description of last topic",
  "keyTopics": ["topic1", "topic2"]
}

Respond ONLY with the JSON object, no other text.`,
        },
      ],
    });

    // ── Parse the JSON from the response ─────────────────────────────────────
    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    let parsed: AISummaryResult;
    try {
      parsed = JSON.parse(rawText) as AISummaryResult;
    } catch {
      console.error('[obsidian/ai-summary] Failed to parse Haiku response:', rawText);
      return NextResponse.json(
        { error: 'AI returned an unparseable response.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ summary: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/ai-summary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
