/**
 * POST /api/founder/obsidian/ai-extract-tasks
 *
 * Extracts unchecked task items from a provided Obsidian note's content.
 * Tasks are identified by lines beginning with `- [ ]` (GitHub Flavoured
 * Markdown checkbox syntax that Obsidian uses for task lists).
 *
 * No AI call is required — tasks are already explicitly marked in the note.
 *
 * Body: { noteContent: string }
 *
 * Response: { tasks: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

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
    const body = await req.json().catch(() => ({})) as { noteContent?: string };
    const { noteContent } = body;

    if (typeof noteContent !== 'string') {
      return NextResponse.json({ error: 'noteContent is required' }, { status: 400 });
    }

    // ── Extract unchecked task lines (`- [ ] ...`) ────────────────────────────
    const tasks = noteContent
      .split('\n')
      .filter(line => /^- \[ \]/.test(line.trimStart()))
      .map(line => line.trimStart().replace(/^- \[ \]\s*/, '').trim())
      .filter(task => task.length > 0);

    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[obsidian/ai-extract-tasks]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
