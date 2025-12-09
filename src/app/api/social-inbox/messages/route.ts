/**
 * Social Inbox Messages API
 *
 * Fetch and manage social media messages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { socialInboxService, SocialProvider, MessageStatus, TriageStatus } from '@/lib/socialEngagement';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const providers = req.nextUrl.searchParams.get('providers')?.split(',') as SocialProvider[] | undefined;
    const statuses = req.nextUrl.searchParams.get('statuses')?.split(',') as MessageStatus[] | undefined;
    const triageStatuses = req.nextUrl.searchParams.get('triageStatuses')?.split(',') as TriageStatus[] | undefined;
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const result = await socialInboxService.getInbox(
      workspaceId,
      {
        providers,
        statuses,
        triageStatuses,
        unreadOnly,
        search,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SocialInbox] Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { messageId, status, triageStatus, isRead, assignedTo } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
updates.status = status;
}
    if (triageStatus) {
updates.triage_status = triageStatus;
}
    if (isRead !== undefined) {
updates.is_read = isRead;
}
    if (assignedTo !== undefined) {
updates.assigned_to = assignedTo;
}

    const { error } = await supabase
      .from('social_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SocialInbox] Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { action, workspaceId, accountId } = body;

    if (action === 'sync') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required for sync' }, { status: 400 });
      }

      const result = await socialInboxService.syncMessages(workspaceId, {
        accountId,
        fullSync: body.fullSync,
      });

      return NextResponse.json(result);
    }

    if (action === 'markRead') {
      const { messageIds } = body;
      if (!messageIds || !Array.isArray(messageIds)) {
        return NextResponse.json({ error: 'messageIds array required' }, { status: 400 });
      }

      const supabase = await getSupabaseServer();
      await supabase
        .from('social_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      return NextResponse.json({ success: true, count: messageIds.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SocialInbox] Error processing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
