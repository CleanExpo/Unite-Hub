/**
 * GET   /api/founder/agents/army/content-queue  — list queue items
 * POST  /api/founder/agents/army/content-queue  — add content
 * PATCH /api/founder/agents/army/content-queue  — update status
 *
 * UNI-1444: Task runner framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const status      = searchParams.get('status');
    const platform    = searchParams.get('platform');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('content_queue')
      .select('id, platform, draft_content, status, scheduled_for, published_at, source_agent, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status)   query = query.eq('status', status);
    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;

    if (error) {
      console.error('[army/content-queue GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/content-queue GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, platform, draftContent, sourceAgent, scheduledFor } = body;

    if (!platform || !draftContent) {
      return NextResponse.json(
        { error: 'platform and draftContent are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('content_queue')
      .insert({
        workspace_id:  workspaceId || null,
        platform,
        draft_content: draftContent,
        status:        'draft',
        source_agent:  sourceAgent || null,
        scheduled_for: scheduledFor || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[army/content-queue POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/content-queue POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, scheduledFor } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses = ['draft', 'approved', 'scheduled', 'published', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { status };
    if (scheduledFor) update.scheduled_for = scheduledFor;
    if (status === 'published') update.published_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('content_queue')
      .update(update)
      .eq('id', id)
      .select('id, status, scheduled_for, published_at')
      .single();

    if (error) {
      console.error('[army/content-queue PATCH]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[army/content-queue PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
