/**
 * Social Inbox Reply API
 *
 * Generate and send replies to social messages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { socialReplyService } from '@/lib/socialEngagement';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;

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
    const { action, messageId, replyText, options } = body;

    if (action === 'generateSuggestions') {
      if (!messageId) {
        return NextResponse.json({ error: 'messageId required' }, { status: 400 });
      }

      // Get message
      const supabase = await getSupabaseServer();
      const { data: message, error } = await supabase
        .from('social_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error || !message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      const suggestions = await socialReplyService.generateReplySuggestions(
        {
          id: message.id,
          socialAccountId: message.social_account_id,
          workspaceId: message.workspace_id,
          threadId: message.thread_id,
          externalMessageId: message.external_message_id,
          provider: message.provider,
          channelType: message.channel_type,
          channelId: message.channel_id,
          authorId: message.author_id,
          authorHandle: message.author_handle,
          authorName: message.author_name,
          authorProfileUrl: message.author_profile_url,
          content: message.content,
          mediaUrls: message.media_urls,
          parentMessageId: message.parent_message_id,
          status: message.status,
          isRead: message.is_read,
          triageStatus: message.triage_status,
          receivedAt: new Date(message.received_at),
          createdAt: new Date(message.created_at),
          updatedAt: new Date(message.updated_at),
        },
        options,
        options?.count || 3
      );

      return NextResponse.json({ suggestions });
    }

    if (action === 'queueReply') {
      if (!messageId || !replyText) {
        return NextResponse.json({ error: 'messageId and replyText required' }, { status: 400 });
      }

      const result = await socialReplyService.queueReply(messageId, replyText, {
        ...options,
        userId,
      });

      return NextResponse.json({ result });
    }

    if (action === 'approve') {
      const { actionId } = body;
      if (!actionId) {
        return NextResponse.json({ error: 'actionId required' }, { status: 400 });
      }

      const result = await socialReplyService.approveReply(actionId, userId!);

      return NextResponse.json({ result });
    }

    if (action === 'reject') {
      const { actionId, reason } = body;
      if (!actionId) {
        return NextResponse.json({ error: 'actionId required' }, { status: 400 });
      }

      await socialReplyService.rejectReply(actionId, userId!, reason);

      return NextResponse.json({ success: true });
    }

    if (action === 'sendDirect') {
      const { actionId } = body;
      if (!actionId) {
        return NextResponse.json({ error: 'actionId required' }, { status: 400 });
      }

      const result = await socialReplyService.sendReply(actionId);

      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SocialInbox] Reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const type = req.nextUrl.searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    if (type === 'pending') {
      const pending = await socialReplyService.getPendingReplies(workspaceId);
      return NextResponse.json({ pending, count: pending.length });
    }

    if (type === 'templates') {
      const providers = req.nextUrl.searchParams.get('providers')?.split(',');
      const search = req.nextUrl.searchParams.get('search') || undefined;

      const templates = await socialReplyService.getTemplates(workspaceId, {
        providers: providers as any,
        search,
      });

      return NextResponse.json({ templates });
    }

    return NextResponse.json({ error: 'type parameter required (pending or templates)' }, { status: 400 });
  } catch (error) {
    console.error('[SocialInbox] Error fetching reply data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
