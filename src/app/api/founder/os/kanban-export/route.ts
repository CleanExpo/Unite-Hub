/**
 * POST /api/founder/os/kanban-export
 *
 * Accepts the current Linear kanban data and formats it as a Markdown
 * Kanban board, then upserts KANBAN.md into the `founder-docs` Supabase
 * storage bucket.
 *
 * GET /api/founder/os/kanban-export
 *
 * Returns a signed download URL for the latest KANBAN.md.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

interface KanbanItem {
  id: string;
  title: string;
  column: 'hot' | 'today' | 'pipeline';
  business?: string;
  priority?: number;
}

interface ExportPayload {
  items: KanbanItem[];
}

const BUCKET = 'founder-docs';
const FILE_PATH = 'KANBAN.md';

function formatDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Australia/Sydney',
  });
}

function buildMarkdown(items: KanbanItem[]): string {
  const hot = items.filter(i => i.column === 'hot');
  const today = items.filter(i => i.column === 'today');
  const pipeline = items.filter(i => i.column === 'pipeline');

  const renderItems = (list: KanbanItem[], done: boolean) =>
    list.length === 0
      ? '- (empty)\n'
      : list.map(i => `- [${done ? 'x' : ' '}] ${i.title}`).join('\n') + '\n';

  return [
    `# Kanban Board — ${formatDate()}`,
    '',
    '## Hot / In Progress',
    renderItems(hot, false),
    '## Today',
    renderItems(today, false),
    '## Pipeline',
    renderItems(pipeline, false),
    `---`,
    `_Exported from Phill OS at ${new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })} AEST_`,
    '',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body: ExportPayload = await req.json();
    const items = body.items ?? [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items to export' }, { status: 400 });
    }

    const markdown = buildMarkdown(items);
    const blob = new Blob([markdown], { type: 'text/markdown' });

    // Upsert to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(FILE_PATH, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (uploadError) {
      console.error('[kanban-export] upload error:', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'KANBAN.md exported successfully',
      size: markdown.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[kanban-export]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(FILE_PATH, 300); // 5-minute signed URL

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'KANBAN.md not found — export first' }, { status: 404 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[kanban-export GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
