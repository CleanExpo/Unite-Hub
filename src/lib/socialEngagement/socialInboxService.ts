/**
 * Social Inbox Service
 *
 * Service for fetching, normalising, and storing social messages and threads
 * from multiple providers.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  SocialProvider,
  SocialAccount,
  SocialThread,
  SocialMessage,
  NormalizedMessage,
  SocialSyncLog,
  ThreadStatus,
  MessageStatus,
  ChannelType,
} from './providerTypes';
import { createPlatformClient, FetchMessagesOptions } from './platformClients';
import { socialEngagementConfig } from '../../../config/socialEngagement.config';
import { tokenVault } from '@/lib/connectedApps/tokenVault';

export interface SyncOptions {
  fullSync?: boolean;
  since?: Date;
  channelTypes?: ChannelType[];
  maxMessages?: number;
}

export interface InboxFilters {
  providers?: SocialProvider[];
  channelTypes?: ChannelType[];
  status?: MessageStatus[];
  triageStatus?: string[];
  sentimentLabel?: string[];
  importanceMin?: number;
  isFlagged?: boolean;
  assignedTo?: string;
  search?: string;
  since?: Date;
  until?: Date;
}

export interface InboxResult {
  messages: SocialMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ThreadsResult {
  threads: SocialThread[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class SocialInboxService {
  /**
   * Get all connected social accounts for a workspace
   */
  async getConnectedAccounts(workspaceId: string): Promise<SocialAccount[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SocialInbox] Error fetching accounts:', error);
      throw error;
    }

    return (data || []).map(this.mapAccountFromDb);
  }

  /**
   * Connect a new social account
   */
  async connectAccount(
    workspaceId: string,
    provider: SocialProvider,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
      scopes?: string[];
    },
    accountInfo: {
      externalAccountId: string;
      handle?: string;
      displayName?: string;
      profileImageUrl?: string;
    }
  ): Promise<SocialAccount> {
    const supabase = await getSupabaseServer();

    // Encrypt tokens
    const encryptedTokens = await tokenVault.encryptTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    const { data, error } = await supabase
      .from('social_accounts')
      .upsert({
        workspace_id: workspaceId,
        provider,
        external_account_id: accountInfo.externalAccountId,
        handle: accountInfo.handle,
        display_name: accountInfo.displayName,
        profile_image_url: accountInfo.profileImageUrl,
        access_token_encrypted: encryptedTokens.encryptedAccessToken,
        refresh_token_encrypted: encryptedTokens.encryptedRefreshToken,
        token_iv: encryptedTokens.iv,
        token_auth_tag: encryptedTokens.authTag,
        token_expires_at: tokens.expiresAt?.toISOString(),
        scopes: tokens.scopes,
        status: 'active',
      }, {
        onConflict: 'workspace_id,provider,external_account_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[SocialInbox] Error connecting account:', error);
      throw error;
    }

    return this.mapAccountFromDb(data);
  }

  /**
   * Disconnect a social account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_accounts')
      .update({
        status: 'disconnected',
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_iv: null,
        token_auth_tag: null,
      })
      .eq('id', accountId);

    if (error) {
      console.error('[SocialInbox] Error disconnecting account:', error);
      throw error;
    }
  }

  /**
   * Sync messages from a social account
   */
  async syncAccount(
    accountId: string,
    options: SyncOptions = {}
  ): Promise<SocialSyncLog> {
    const supabase = await getSupabaseServer();

    // Get account with decrypted tokens
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    // Decrypt tokens
    const tokens = await tokenVault.decryptTokens({
      encryptedAccessToken: account.access_token_encrypted,
      encryptedRefreshToken: account.refresh_token_encrypted,
      iv: account.token_iv,
      authTag: account.token_auth_tag,
    });

    // Create sync log
    const syncType = options.fullSync ? 'full' : 'incremental';
    const { data: syncLog, error: syncLogError } = await supabase
      .from('social_sync_logs')
      .insert({
        social_account_id: accountId,
        workspace_id: account.workspace_id,
        sync_type: syncType,
        status: 'in_progress',
      })
      .select()
      .single();

    if (syncLogError) {
      throw syncLogError;
    }

    try {
      // Create platform client
      const client = createPlatformClient({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountId: account.external_account_id,
        provider: account.provider as SocialProvider,
      });

      // Determine sync start date
      const since = options.fullSync
        ? new Date(Date.now() - socialEngagementConfig.syncSettings.lookbackDays * 24 * 60 * 60 * 1000)
        : options.since || (account.last_sync_at ? new Date(account.last_sync_at) : undefined);

      // Fetch messages
      let totalMessages = 0;
      let totalThreads = 0;
      let cursor = options.fullSync ? undefined : account.sync_cursor;
      let hasMore = true;

      while (hasMore && totalMessages < (options.maxMessages || socialEngagementConfig.syncSettings.maxMessagesPerSync)) {
        const result = await client.fetchMessages({
          since,
          limit: 50,
          cursor,
          channelTypes: options.channelTypes,
        });

        // Process and store messages
        for (const normalizedMsg of result.messages) {
          const { thread, message } = await this.storeMessage(
            account.workspace_id,
            accountId,
            normalizedMsg
          );

          if (thread) totalThreads++;
          if (message) totalMessages++;
        }

        cursor = result.nextCursor;
        hasMore = result.hasMore;
      }

      // Update account sync state
      await supabase
        .from('social_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_cursor: cursor,
        })
        .eq('id', accountId);

      // Update sync log
      const { data: updatedLog, error: updateError } = await supabase
        .from('social_sync_logs')
        .update({
          status: 'completed',
          messages_synced: totalMessages,
          threads_synced: totalThreads,
          completed_at: new Date().toISOString(),
          sync_cursor: cursor,
        })
        .eq('id', syncLog.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return this.mapSyncLogFromDb(updatedLog);
    } catch (error) {
      // Update sync log with error
      await supabase
        .from('social_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [{ code: 'SYNC_ERROR', message: String(error), timestamp: new Date().toISOString() }],
        })
        .eq('id', syncLog.id);

      throw error;
    }
  }

  /**
   * Store a normalized message in the database
   */
  private async storeMessage(
    workspaceId: string,
    accountId: string,
    message: NormalizedMessage
  ): Promise<{ thread: SocialThread | null; message: SocialMessage | null }> {
    const supabase = await getSupabaseServer();

    // Find or create thread
    let threadId: string | undefined;

    if (message.threadId) {
      // Check if thread exists
      const { data: existingThread } = await supabase
        .from('social_threads')
        .select('id')
        .eq('social_account_id', accountId)
        .eq('external_thread_id', message.threadId)
        .single();

      if (existingThread) {
        threadId = existingThread.id;
      } else {
        // Create new thread
        const { data: newThread, error: threadError } = await supabase
          .from('social_threads')
          .insert({
            social_account_id: accountId,
            workspace_id: workspaceId,
            external_thread_id: message.threadId,
            provider: message.provider,
            channel_type: message.channelType,
            participant_handles: message.author.handle ? [message.author.handle] : [],
            participant_ids: [message.author.id],
            last_message_at: message.sentAt.toISOString(),
          })
          .select()
          .single();

        if (threadError) {
          console.error('[SocialInbox] Error creating thread:', threadError);
        } else {
          threadId = newThread?.id;
        }
      }
    }

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('social_messages')
      .select('id')
      .eq('social_account_id', accountId)
      .eq('external_message_id', message.externalId)
      .single();

    if (existingMessage) {
      return { thread: null, message: null };
    }

    // Store message
    const { data: newMessage, error: messageError } = await supabase
      .from('social_messages')
      .insert({
        social_account_id: accountId,
        thread_id: threadId,
        workspace_id: workspaceId,
        external_message_id: message.externalId,
        provider: message.provider,
        channel_type: message.channelType,
        direction: message.direction,
        author_handle: message.author.handle,
        author_id: message.author.id,
        author_name: message.author.name,
        author_profile_image: message.author.profileImage,
        content: message.content,
        content_type: message.contentType,
        attachments: message.attachments,
        parent_message_id: message.parentId,
        sent_at: message.sentAt.toISOString(),
        status: 'unread',
        triage_status: 'pending',
      })
      .select()
      .single();

    if (messageError) {
      console.error('[SocialInbox] Error storing message:', messageError);
      return { thread: null, message: null };
    }

    return {
      thread: threadId ? { id: threadId } as SocialThread : null,
      message: newMessage ? this.mapMessageFromDb(newMessage) : null,
    };
  }

  /**
   * Get messages from inbox with filters
   */
  async getMessages(
    workspaceId: string,
    filters: InboxFilters = {},
    page = 1,
    limit = 25
  ): Promise<InboxResult> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('social_messages')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('sent_at', { ascending: false });

    // Apply filters
    if (filters.providers?.length) {
      query = query.in('provider', filters.providers);
    }

    if (filters.channelTypes?.length) {
      query = query.in('channel_type', filters.channelTypes);
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters.triageStatus?.length) {
      query = query.in('triage_status', filters.triageStatus);
    }

    if (filters.sentimentLabel?.length) {
      query = query.in('sentiment_label', filters.sentimentLabel);
    }

    if (filters.importanceMin !== undefined) {
      query = query.gte('importance_score', filters.importanceMin);
    }

    if (filters.isFlagged !== undefined) {
      query = query.eq('is_flagged', filters.isFlagged);
    }

    if (filters.since) {
      query = query.gte('sent_at', filters.since.toISOString());
    }

    if (filters.until) {
      query = query.lte('sent_at', filters.until.toISOString());
    }

    if (filters.search) {
      query = query.ilike('content', `%${filters.search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[SocialInbox] Error fetching messages:', error);
      throw error;
    }

    const messages = (data || []).map(this.mapMessageFromDb);
    const total = count || 0;

    return {
      messages,
      total,
      page,
      limit,
      hasMore: offset + messages.length < total,
    };
  }

  /**
   * Get threads grouped by conversation
   */
  async getThreads(
    workspaceId: string,
    filters: InboxFilters = {},
    page = 1,
    limit = 25
  ): Promise<ThreadsResult> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('social_threads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    // Apply filters
    if (filters.providers?.length) {
      query = query.in('provider', filters.providers);
    }

    if (filters.channelTypes?.length) {
      query = query.in('channel_type', filters.channelTypes);
    }

    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[SocialInbox] Error fetching threads:', error);
      throw error;
    }

    const threads = (data || []).map(this.mapThreadFromDb);
    const total = count || 0;

    return {
      threads,
      total,
      page,
      limit,
      hasMore: offset + threads.length < total,
    };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const updates: Record<string, unknown> = { status };

    if (status === 'read') {
      updates.read_at = new Date().toISOString();
    } else if (status === 'replied') {
      updates.replied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('social_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) {
      console.error('[SocialInbox] Error updating message status:', error);
      throw error;
    }
  }

  /**
   * Flag/unflag a message
   */
  async flagMessage(
    messageId: string,
    flagged: boolean,
    reason?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_messages')
      .update({
        is_flagged: flagged,
        flagged_reason: flagged ? reason : null,
      })
      .eq('id', messageId);

    if (error) {
      console.error('[SocialInbox] Error flagging message:', error);
      throw error;
    }
  }

  /**
   * Assign thread to user
   */
  async assignThread(threadId: string, userId: string | null): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_threads')
      .update({ assigned_to: userId })
      .eq('id', threadId);

    if (error) {
      console.error('[SocialInbox] Error assigning thread:', error);
      throw error;
    }
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(threadId: string, status: ThreadStatus): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_threads')
      .update({ status })
      .eq('id', threadId);

    if (error) {
      console.error('[SocialInbox] Error updating thread status:', error);
      throw error;
    }
  }

  /**
   * Get inbox statistics
   */
  async getInboxStats(workspaceId: string): Promise<{
    totalMessages: number;
    unreadCount: number;
    flaggedCount: number;
    pendingTriageCount: number;
    requiresAttentionCount: number;
    byProvider: Record<SocialProvider, number>;
    byChannelType: Record<ChannelType, number>;
  }> {
    const supabase = await getSupabaseServer();

    // Get total and status counts
    const { data: messages } = await supabase
      .from('social_messages')
      .select('status, triage_status, is_flagged, provider, channel_type')
      .eq('workspace_id', workspaceId);

    const stats = {
      totalMessages: messages?.length || 0,
      unreadCount: messages?.filter((m) => m.status === 'unread').length || 0,
      flaggedCount: messages?.filter((m) => m.is_flagged).length || 0,
      pendingTriageCount: messages?.filter((m) => m.triage_status === 'pending').length || 0,
      requiresAttentionCount: messages?.filter((m) => m.triage_status === 'requires_attention').length || 0,
      byProvider: {} as Record<SocialProvider, number>,
      byChannelType: {} as Record<ChannelType, number>,
    };

    // Count by provider
    for (const msg of messages || []) {
      stats.byProvider[msg.provider as SocialProvider] =
        (stats.byProvider[msg.provider as SocialProvider] || 0) + 1;
      stats.byChannelType[msg.channel_type as ChannelType] =
        (stats.byChannelType[msg.channel_type as ChannelType] || 0) + 1;
    }

    return stats;
  }

  // Helper methods to map database records to types
  private mapAccountFromDb(data: Record<string, unknown>): SocialAccount {
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      provider: data.provider as SocialProvider,
      externalAccountId: data.external_account_id as string,
      handle: data.handle as string | undefined,
      displayName: data.display_name as string | undefined,
      profileImageUrl: data.profile_image_url as string | undefined,
      scopes: data.scopes as string[] | undefined,
      status: data.status as SocialAccount['status'],
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at as string) : undefined,
      syncCursor: data.sync_cursor as string | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapThreadFromDb(data: Record<string, unknown>): SocialThread {
    return {
      id: data.id as string,
      socialAccountId: data.social_account_id as string,
      workspaceId: data.workspace_id as string,
      externalThreadId: data.external_thread_id as string,
      provider: data.provider as SocialProvider,
      channelType: data.channel_type as ChannelType,
      subject: data.subject as string | undefined,
      snippet: data.snippet as string | undefined,
      participantHandles: data.participant_handles as string[] | undefined,
      participantIds: data.participant_ids as string[] | undefined,
      messageCount: data.message_count as number,
      unreadCount: data.unread_count as number,
      lastMessageAt: data.last_message_at ? new Date(data.last_message_at as string) : undefined,
      status: data.status as ThreadStatus,
      assignedTo: data.assigned_to as string | undefined,
      labels: data.labels as string[] | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapMessageFromDb(data: Record<string, unknown>): SocialMessage {
    return {
      id: data.id as string,
      socialAccountId: data.social_account_id as string,
      threadId: data.thread_id as string | undefined,
      workspaceId: data.workspace_id as string,
      externalMessageId: data.external_message_id as string,
      provider: data.provider as SocialProvider,
      channelType: data.channel_type as ChannelType,
      direction: data.direction as 'inbound' | 'outbound',
      authorHandle: data.author_handle as string | undefined,
      authorId: data.author_id as string | undefined,
      authorName: data.author_name as string | undefined,
      authorProfileImage: data.author_profile_image as string | undefined,
      content: data.content as string,
      contentType: data.content_type as 'text' | 'image' | 'video' | 'audio' | 'mixed',
      attachments: data.attachments as SocialMessage['attachments'],
      parentMessageId: data.parent_message_id as string | undefined,
      sentiment: data.sentiment as number | undefined,
      sentimentLabel: data.sentiment_label as SocialMessage['sentimentLabel'],
      spamScore: data.spam_score as number | undefined,
      importanceScore: data.importance_score as number | undefined,
      intentLabels: data.intent_labels as string[] | undefined,
      triageStatus: data.triage_status as SocialMessage['triageStatus'],
      triageNotes: data.triage_notes as string | undefined,
      triagedAt: data.triaged_at ? new Date(data.triaged_at as string) : undefined,
      status: data.status as MessageStatus,
      isFlagged: data.is_flagged as boolean,
      flaggedReason: data.flagged_reason as string | undefined,
      sentAt: new Date(data.sent_at as string),
      readAt: data.read_at ? new Date(data.read_at as string) : undefined,
      repliedAt: data.replied_at ? new Date(data.replied_at as string) : undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapSyncLogFromDb(data: Record<string, unknown>): SocialSyncLog {
    return {
      id: data.id as string,
      socialAccountId: data.social_account_id as string,
      workspaceId: data.workspace_id as string,
      syncType: data.sync_type as 'full' | 'incremental' | 'manual',
      status: data.status as SocialSyncLog['status'],
      messagesSynced: data.messages_synced as number,
      threadsSynced: data.threads_synced as number,
      messagesTriaged: data.messages_triaged as number,
      errors: data.errors as SocialSyncLog['errors'],
      startedAt: new Date(data.started_at as string),
      completedAt: data.completed_at ? new Date(data.completed_at as string) : undefined,
      syncCursor: data.sync_cursor as string | undefined,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const socialInboxService = new SocialInboxService();
