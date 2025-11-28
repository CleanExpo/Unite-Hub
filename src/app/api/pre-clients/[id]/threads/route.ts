/**
 * Pre-Client Threads API
 *
 * Get email threads for a pre-client.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { threadClusterService } from '@/lib/emailIngestion';

// GET /api/pre-clients/[id]/threads - Get threads
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const theme = req.nextUrl.searchParams.get('theme');
    const importance = req.nextUrl.searchParams.get('importance');
    const sentiment = req.nextUrl.searchParams.get('sentiment');
    const hasUnresolved = req.nextUrl.searchParams.get('hasUnresolved');
    const requiresFollowup = req.nextUrl.searchParams.get('requiresFollowup');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('pre_client_threads')
      .select('*', { count: 'exact' })
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    if (theme) {
      query = query.eq('primary_theme', theme);
    }

    if (importance) {
      query = query.eq('importance', importance);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    if (hasUnresolved === 'true') {
      query = query.eq('has_unresolved_items', true);
    }

    if (requiresFollowup === 'true') {
      query = query.eq('requires_followup', true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: threads, error, count } = await query;

    if (error) {
      console.error('[API] Failed to fetch threads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      threads: (threads || []).map((t) => ({
        id: t.id,
        threadId: t.thread_id,
        subject: t.subject,
        messageCount: t.message_count,
        firstMessageAt: t.first_message_at,
        lastMessageAt: t.last_message_at,
        primaryTheme: t.primary_theme,
        themes: t.themes,
        sentiment: t.sentiment,
        importance: t.importance,
        hasUnresolvedItems: t.has_unresolved_items,
        requiresFollowup: t.requires_followup,
      })),
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /api/pre-clients/[id]/threads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pre-clients/[id]/threads - Trigger thread clustering
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'cluster': {
        // Re-cluster threads
        const clusteredThreads = await threadClusterService.processAndSaveThreads({
          preClientId,
          workspaceId,
        });

        return NextResponse.json({
          success: true,
          threadsProcessed: clusteredThreads.length,
          message: 'Threads clustered successfully',
        });
      }

      case 'summary': {
        // Get thread summary
        const summary = await threadClusterService.getThreadSummary(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          summary,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "cluster" or "summary"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] POST /api/pre-clients/[id]/threads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
