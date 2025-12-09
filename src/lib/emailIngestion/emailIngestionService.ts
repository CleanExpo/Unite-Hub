/**
 * Email Ingestion Service
 *
 * Orchestrates email synchronization from Gmail and Outlook.
 * Manages sync state, stores emails, and triggers idea extraction.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { emailIngestionConfig, getInitialSyncDateRange } from '@config/emailIngestion.config';
import { getConnectedAppsService, type OAuthProvider } from '@/lib/connectedApps';
import { createGoogleGmailClient, type ParsedEmailMessage as GmailParsedMessage } from './googleGmailClient';
import { createMicrosoftGraphClient, type ParsedOutlookMessage } from './microsoftGraphClient';
import { getEmailIdeaExtractor, type ExtractionResult, type EmailContent } from './emailIdeaExtractor';
import { getClientEmailMapper, type MappingResult } from './clientEmailMapper';

// ============================================================================
// Types
// ============================================================================

export interface SyncOptions {
  syncType: 'initial' | 'incremental' | 'full' | 'manual';
  sinceDate?: Date;
  maxThreads?: number;
}

export interface SyncProgress {
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  threadsSynced: number;
  messagesSynced: number;
  ideasExtracted: number;
  clientsMapped: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

export interface EmailThread {
  id: string;
  externalThreadId: string;
  subject: string;
  snippet: string;
  fromAddresses: string[];
  toAddresses: string[];
  messageCount: number;
  hasAttachments: boolean;
  firstMessageAt: Date;
  lastMessageAt: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  clientId: string | null;
  clientMappingConfidence: number;
  sentimentScore: number | null;
  aiSummary: string | null;
}

// ============================================================================
// Email Ingestion Service Class
// ============================================================================

class EmailIngestionService {
  private connectedAppsService = getConnectedAppsService();
  private ideaExtractor = getEmailIdeaExtractor();
  private clientMapper = getClientEmailMapper();

  /**
   * Sync emails for a connected app
   */
  async syncEmails(
    workspaceId: string,
    connectedAppId: string,
    options: SyncOptions
  ): Promise<SyncProgress> {
    const progress: SyncProgress = {
      status: 'started',
      threadsSynced: 0,
      messagesSynced: 0,
      ideasExtracted: 0,
      clientsMapped: 0,
      errors: [],
      startedAt: new Date(),
    };

    const supabase = await getSupabaseServer();

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('email_sync_logs')
      .insert({
        workspace_id: workspaceId,
        connected_app_id: connectedAppId,
        sync_type: options.syncType,
        sync_status: 'started',
        sync_from: options.sinceDate?.toISOString(),
        sync_to: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('[EmailIngestionService] Failed to create sync log:', logError);
    }

    try {
      // Get connected app
      const app = await this.connectedAppsService.getConnectedApp(
        workspaceId,
        connectedAppId
      );

      if (!app) {
        throw new Error('Connected app not found');
      }

      // Get valid tokens
      const tokens = await this.connectedAppsService.getValidTokens(
        workspaceId,
        app.userId,
        app.provider
      );

      if (!tokens) {
        throw new Error('No valid tokens available');
      }

      // Determine sync date range
      const sinceDate =
        options.sinceDate ||
        (options.syncType === 'initial'
          ? getInitialSyncDateRange().from
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days

      progress.status = 'in_progress';

      // Sync based on provider
      if (app.provider === 'google') {
        await this.syncGmailEmails(
          workspaceId,
          connectedAppId,
          tokens.accessToken,
          sinceDate,
          progress
        );
      } else if (app.provider === 'microsoft') {
        await this.syncOutlookEmails(
          workspaceId,
          connectedAppId,
          tokens.accessToken,
          sinceDate,
          progress
        );
      }

      progress.status = 'completed';
      progress.completedAt = new Date();

      // Update connected app last sync time
      await this.connectedAppsService.updateConnectedApp(workspaceId, connectedAppId, {
        lastSyncAt: new Date(),
        lastError: null,
      });
    } catch (error) {
      progress.status = 'failed';
      progress.errors.push(String(error));
      progress.completedAt = new Date();

      // Update connected app with error
      await this.connectedAppsService.updateConnectedApp(workspaceId, connectedAppId, {
        lastError: String(error),
      });
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('email_sync_logs')
        .update({
          sync_status: progress.status,
          threads_synced: progress.threadsSynced,
          messages_synced: progress.messagesSynced,
          ideas_extracted: progress.ideasExtracted,
          clients_mapped: progress.clientsMapped,
          completed_at: progress.completedAt?.toISOString(),
          duration_ms: progress.completedAt
            ? progress.completedAt.getTime() - progress.startedAt.getTime()
            : null,
          error_message: progress.errors.length > 0 ? progress.errors.join('; ') : null,
        })
        .eq('id', syncLog.id);
    }

    return progress;
  }

  /**
   * Sync Gmail emails
   */
  private async syncGmailEmails(
    workspaceId: string,
    connectedAppId: string,
    accessToken: string,
    sinceDate: Date,
    progress: SyncProgress
  ): Promise<void> {
    const gmail = createGoogleGmailClient(accessToken);
    let pageToken: string | undefined;

    do {
      const result = await gmail.syncSince(sinceDate, pageToken);
      pageToken = result.nextPageToken;

      for (const thread of result.threads) {
        try {
          await this.processGmailThread(workspaceId, connectedAppId, thread, progress);
          progress.threadsSynced++;
        } catch (error) {
          progress.errors.push(`Thread ${thread.id}: ${error}`);
        }
      }
    } while (pageToken);
  }

  /**
   * Process a single Gmail thread
   */
  private async processGmailThread(
    workspaceId: string,
    connectedAppId: string,
    thread: { id: string; historyId: string; messages: Array<unknown> },
    progress: SyncProgress
  ): Promise<void> {
    const supabase = await getSupabaseServer();
    const gmail = createGoogleGmailClient(''); // Just for parsing

    // Parse all messages
    const parsedMessages: GmailParsedMessage[] = thread.messages.map((msg) =>
      gmail.parseMessage(msg as Parameters<typeof gmail.parseMessage>[0])
    );

    if (parsedMessages.length === 0) {
return;
}

    // Get thread metadata from messages
    const firstMessage = parsedMessages[parsedMessages.length - 1];
    const lastMessage = parsedMessages[0];
    const allFromAddresses = [...new Set(parsedMessages.map((m) => m.fromEmail))];
    const allToAddresses = [
      ...new Set(parsedMessages.flatMap((m) => m.toEmails)),
    ];

    // Map emails to clients
    const mappingResult = await this.clientMapper.mapEmailToClient(workspaceId, {
      email: firstMessage.fromEmail,
      name: firstMessage.fromName,
    });

    // Upsert thread
    const { data: threadData, error: threadError } = await supabase
      .from('email_threads')
      .upsert(
        {
          workspace_id: workspaceId,
          connected_app_id: connectedAppId,
          external_thread_id: thread.id,
          subject: firstMessage.subject,
          snippet: lastMessage.snippet,
          from_addresses: allFromAddresses,
          to_addresses: allToAddresses,
          message_count: parsedMessages.length,
          has_attachments: parsedMessages.some((m) => m.hasAttachments),
          first_message_at: firstMessage.date.toISOString(),
          last_message_at: lastMessage.date.toISOString(),
          is_read: lastMessage.isRead,
          is_starred: parsedMessages.some((m) => m.isStarred),
          labels: [...new Set(parsedMessages.flatMap((m) => m.labels))],
          client_id: mappingResult.clientId,
          client_mapping_confidence: mappingResult.confidence,
          client_mapping_method: mappingResult.method,
          sync_status: 'synced',
        },
        { onConflict: 'workspace_id,connected_app_id,external_thread_id' }
      )
      .select()
      .single();

    if (threadError || !threadData) {
      throw new Error(`Failed to upsert thread: ${threadError?.message}`);
    }

    if (mappingResult.clientId) {
      progress.clientsMapped++;
    }

    // Process messages
    for (const parsed of parsedMessages) {
      await this.storeEmailMessage(
        workspaceId,
        threadData.id,
        connectedAppId,
        thread.id,
        parsed,
        progress
      );
    }
  }

  /**
   * Store email message and extract ideas
   */
  private async storeEmailMessage(
    workspaceId: string,
    threadId: string,
    connectedAppId: string,
    externalThreadId: string,
    parsed: GmailParsedMessage | ParsedOutlookMessage,
    progress: SyncProgress
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Determine if incoming (check if from our connected email)
    const isIncoming = true; // Simplified - would need connected email to determine

    // Store message
    const { data: messageData, error: messageError } = await supabase
      .from('email_messages')
      .upsert(
        {
          workspace_id: workspaceId,
          thread_id: threadId,
          connected_app_id: connectedAppId,
          external_message_id: parsed.id,
          external_thread_id: externalThreadId,
          subject: parsed.subject,
          body_text: parsed.bodyText.substring(0, 50000), // Limit size
          body_html: parsed.bodyHtml.substring(0, 100000),
          snippet: parsed.snippet,
          from_email: parsed.fromEmail,
          from_name: parsed.fromName,
          to_emails: parsed.toEmails,
          to_names: parsed.toNames,
          cc_emails: parsed.ccEmails,
          message_date: parsed.date.toISOString(),
          is_incoming: isIncoming,
          is_read: parsed.isRead,
          is_starred: parsed.isStarred,
          has_attachments: parsed.hasAttachments,
          attachment_count: parsed.attachmentCount,
          attachments: parsed.attachments,
          importance: parsed.importance,
        },
        { onConflict: 'workspace_id,connected_app_id,external_message_id' }
      )
      .select()
      .single();

    if (messageError || !messageData) {
      throw new Error(`Failed to store message: ${messageError?.message}`);
    }

    progress.messagesSynced++;

    // Extract ideas from message
    if (emailIngestionConfig.ideaExtraction.enabled) {
      const emailContent: EmailContent = {
        subject: parsed.subject,
        bodyText: parsed.bodyText,
        fromEmail: parsed.fromEmail,
        fromName: parsed.fromName,
        date: parsed.date,
        isIncoming,
      };

      const extraction = await this.ideaExtractor.extractIdeas(emailContent);

      // Store extracted ideas
      for (const idea of extraction.ideas) {
        await this.storeEmailIdea(
          workspaceId,
          threadId,
          messageData.id,
          idea,
          extraction
        );
        progress.ideasExtracted++;
      }

      // Update message with sentiment and intent
      await supabase
        .from('email_messages')
        .update({
          sentiment_score: extraction.sentiment,
          intent_classification: extraction.intentClassification,
          intent_confidence: extraction.intentConfidence,
        })
        .eq('id', messageData.id);
    }
  }

  /**
   * Store extracted email idea
   */
  private async storeEmailIdea(
    workspaceId: string,
    threadId: string,
    messageId: string,
    idea: ExtractionResult['ideas'][0],
    extraction: ExtractionResult
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('email_ideas').insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      message_id: messageId,
      idea_type: idea.type,
      title: idea.title,
      description: idea.description,
      extracted_text: idea.extractedText,
      priority: idea.priority,
      confidence_score: idea.confidence,
      due_date: idea.dueDate?.toISOString(),
      due_date_confidence: idea.dueDateConfidence,
      status: 'new',
      ai_model: extraction.model,
      processing_time_ms: extraction.processingTimeMs,
    });
  }

  /**
   * Sync Outlook emails
   */
  private async syncOutlookEmails(
    workspaceId: string,
    connectedAppId: string,
    accessToken: string,
    sinceDate: Date,
    progress: SyncProgress
  ): Promise<void> {
    const graph = createMicrosoftGraphClient(accessToken);
    const result = await graph.syncSince(sinceDate);

    // Group messages by conversation
    const conversations = new Map<string, Array<typeof result.messages[0]>>();
    for (const msg of result.messages) {
      const existing = conversations.get(msg.conversationId) || [];
      existing.push(msg);
      conversations.set(msg.conversationId, existing);
    }

    // Process each conversation as a thread
    for (const [conversationId, messages] of conversations) {
      try {
        await this.processOutlookConversation(
          workspaceId,
          connectedAppId,
          conversationId,
          messages,
          graph,
          progress
        );
        progress.threadsSynced++;
      } catch (error) {
        progress.errors.push(`Conversation ${conversationId}: ${error}`);
      }
    }
  }

  /**
   * Process Outlook conversation
   */
  private async processOutlookConversation(
    workspaceId: string,
    connectedAppId: string,
    conversationId: string,
    messages: Array<unknown>,
    graph: ReturnType<typeof createMicrosoftGraphClient>,
    progress: SyncProgress
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Parse all messages
    const parsedMessages: ParsedOutlookMessage[] = [];
    for (const msg of messages) {
      const parsed = await graph.parseMessage(
        msg as Parameters<typeof graph.parseMessage>[0]
      );
      parsedMessages.push(parsed);
    }

    if (parsedMessages.length === 0) {
return;
}

    // Sort by date
    parsedMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

    const firstMessage = parsedMessages[0];
    const lastMessage = parsedMessages[parsedMessages.length - 1];
    const allFromAddresses = [...new Set(parsedMessages.map((m) => m.fromEmail))];
    const allToAddresses = [...new Set(parsedMessages.flatMap((m) => m.toEmails))];

    // Map to client
    const mappingResult = await this.clientMapper.mapEmailToClient(workspaceId, {
      email: firstMessage.fromEmail,
      name: firstMessage.fromName,
    });

    // Upsert thread
    const { data: threadData, error: threadError } = await supabase
      .from('email_threads')
      .upsert(
        {
          workspace_id: workspaceId,
          connected_app_id: connectedAppId,
          external_thread_id: conversationId,
          subject: firstMessage.subject,
          snippet: lastMessage.snippet,
          from_addresses: allFromAddresses,
          to_addresses: allToAddresses,
          message_count: parsedMessages.length,
          has_attachments: parsedMessages.some((m) => m.hasAttachments),
          first_message_at: firstMessage.date.toISOString(),
          last_message_at: lastMessage.date.toISOString(),
          is_read: lastMessage.isRead,
          is_starred: parsedMessages.some((m) => m.isStarred),
          labels: [...new Set(parsedMessages.flatMap((m) => m.categories))],
          client_id: mappingResult.clientId,
          client_mapping_confidence: mappingResult.confidence,
          client_mapping_method: mappingResult.method,
          sync_status: 'synced',
        },
        { onConflict: 'workspace_id,connected_app_id,external_thread_id' }
      )
      .select()
      .single();

    if (threadError || !threadData) {
      throw new Error(`Failed to upsert thread: ${threadError?.message}`);
    }

    if (mappingResult.clientId) {
      progress.clientsMapped++;
    }

    // Process messages
    for (const parsed of parsedMessages) {
      await this.storeEmailMessage(
        workspaceId,
        threadData.id,
        connectedAppId,
        conversationId,
        parsed,
        progress
      );
    }
  }

  /**
   * Get email threads for a workspace
   */
  async getEmailThreads(
    workspaceId: string,
    options: {
      clientId?: string;
      connectedAppId?: string;
      limit?: number;
      offset?: number;
      search?: string;
    }
  ): Promise<{ threads: EmailThread[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('email_threads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false });

    if (options.clientId) {
      query = query.eq('client_id', options.clientId);
    }

    if (options.connectedAppId) {
      query = query.eq('connected_app_id', options.connectedAppId);
    }

    if (options.search) {
      query = query.ilike('subject', `%${options.search}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch email threads: ${error.message}`);
    }

    const threads: EmailThread[] = (data || []).map((t) => ({
      id: t.id,
      externalThreadId: t.external_thread_id,
      subject: t.subject,
      snippet: t.snippet,
      fromAddresses: t.from_addresses,
      toAddresses: t.to_addresses,
      messageCount: t.message_count,
      hasAttachments: t.has_attachments,
      firstMessageAt: new Date(t.first_message_at),
      lastMessageAt: new Date(t.last_message_at),
      isRead: t.is_read,
      isStarred: t.is_starred,
      labels: t.labels,
      clientId: t.client_id,
      clientMappingConfidence: t.client_mapping_confidence,
      sentimentScore: t.sentiment_score,
      aiSummary: t.ai_summary,
    }));

    return { threads, total: count || 0 };
  }

  /**
   * Get pending email ideas for a workspace
   */
  async getPendingIdeas(
    workspaceId: string,
    options: {
      clientId?: string;
      ideaType?: string;
      priority?: string;
      limit?: number;
    }
  ): Promise<unknown[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('email_ideas')
      .select('*, email_threads(subject), contacts(name)')
      .eq('workspace_id', workspaceId)
      .in('status', ['new', 'acknowledged'])
      .order('created_at', { ascending: false });

    if (options.clientId) {
      query = query.eq('client_id', options.clientId);
    }

    if (options.ideaType) {
      query = query.eq('idea_type', options.ideaType);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }

    return data || [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: EmailIngestionService | null = null;

export function getEmailIngestionService(): EmailIngestionService {
  if (!serviceInstance) {
    serviceInstance = new EmailIngestionService();
  }
  return serviceInstance;
}

export default EmailIngestionService;
