/**
 * Social Inbox Triage API
 *
 * AI-powered message triage operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { socialTriageService, socialInboxService } from '@/lib/socialEngagement';

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
    const { action, workspaceId, messageId, messageIds, options } = body;

    if (action === 'triageSingle') {
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

      const result = await socialTriageService.triageMessage({
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
      }, options);

      return NextResponse.json({ result });
    }

    if (action === 'triageBatch') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
      }

      const result = await socialTriageService.batchTriage(workspaceId, {
        messageIds,
        ...options,
      });

      return NextResponse.json(result);
    }

    if (action === 'getUntriaged') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
      }

      const limit = options?.limit || 50;
      const messages = await socialTriageService.getUntriagedMessages(workspaceId, limit);

      return NextResponse.json({ messages, count: messages.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SocialInbox] Triage error:', error);
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

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get triage stats
    const supabase = await getSupabaseServer();

    const { data: messages } = await supabase
      .from('social_messages')
      .select('triage_status, sentiment_score, importance_score, spam_score')
      .eq('workspace_id', workspaceId);

    const stats = {
      total: messages?.length || 0,
      untriaged: messages?.filter((m) => !m.triage_status || m.triage_status === 'pending').length || 0,
      needsReview: messages?.filter((m) => m.triage_status === 'needs_review').length || 0,
      autoReplied: messages?.filter((m) => m.triage_status === 'auto_replied').length || 0,
      ignored: messages?.filter((m) => m.triage_status === 'ignored').length || 0,
      escalated: messages?.filter((m) => m.triage_status === 'escalated').length || 0,
      avgSentiment: messages?.length
        ? messages.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / messages.length
        : 0,
      avgImportance: messages?.length
        ? messages.reduce((sum, m) => sum + (m.importance_score || 0), 0) / messages.length
        : 0,
      spamCount: messages?.filter((m) => (m.spam_score || 0) > 0.7).length || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[SocialInbox] Error fetching triage stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
