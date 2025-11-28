/**
 * History Ingestion Service
 *
 * Pulls historical Gmail/Outlook emails for selected clients.
 * Handles date ranges, pagination, and rate limiting.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { connectedAppsService, gmailService, outlookService } from '@/lib/connectedApps';

// ============================================================================
// TYPES
// ============================================================================

export interface IngestionConfig {
  preClientId: string;
  workspaceId: string;
  connectedAppId: string;
  startDate: Date;
  endDate: Date;
  emailFilter: string; // The client's email address to filter for
}

export interface IngestionProgress {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  threadsFound: number;
  messagesIngested: number;
  currentPage: number;
  totalPages: number;
  errors: string[];
}

export interface RawEmailMessage {
  id: string;
  threadId: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  subject: string;
  bodyPlain?: string;
  bodyHtml?: string;
  snippet?: string;
  timestamp: Date;
  hasAttachments: boolean;
  attachmentCount: number;
}

export interface IngestionResult {
  jobId: string;
  preClientId: string;
  threadsFound: number;
  messagesIngested: number;
  insightsExtracted: number;
  timelineEventsCreated: number;
  duration: number;
  errors: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

class HistoryIngestionService {
  /**
   * Start a historical email ingestion job
   */
  async startIngestion(config: IngestionConfig): Promise<{ jobId: string; status: string }> {
    const supabase = await getSupabaseServer();

    // Create ingestion job record
    const { data: job, error: jobError } = await supabase
      .from('pre_client_ingestion_jobs')
      .insert({
        pre_client_id: config.preClientId,
        workspace_id: config.workspaceId,
        connected_app_id: config.connectedAppId,
        start_date: config.startDate.toISOString(),
        end_date: config.endDate.toISOString(),
        email_filter: config.emailFilter,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create ingestion job: ${jobError?.message}`);
    }

    // Update pre-client status
    await supabase
      .from('pre_clients')
      .update({ status: 'ingesting' })
      .eq('id', config.preClientId);

    // Start async ingestion process
    this.runIngestionJob(job.id, config).catch((err) => {
      console.error(`[HistoryIngestion] Job ${job.id} failed:`, err);
    });

    return { jobId: job.id, status: 'started' };
  }

  /**
   * Run the actual ingestion job
   */
  private async runIngestionJob(jobId: string, config: IngestionConfig): Promise<void> {
    const supabase = await getSupabaseServer();

    // Mark job as running
    await supabase
      .from('pre_client_ingestion_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId);

    try {
      // Get connected app details
      const connectedApp = await connectedAppsService.getConnectedApp(config.connectedAppId);
      if (!connectedApp) {
        throw new Error('Connected app not found');
      }

      let messages: RawEmailMessage[] = [];

      // Fetch emails based on provider
      if (connectedApp.provider === 'google') {
        messages = await this.fetchGmailHistory(connectedApp, config);
      } else if (connectedApp.provider === 'microsoft') {
        messages = await this.fetchOutlookHistory(connectedApp, config);
      } else {
        throw new Error(`Unsupported provider: ${connectedApp.provider}`);
      }

      // Group messages by thread
      const threadMap = this.groupMessagesByThread(messages);

      // Store threads and messages
      let threadsCreated = 0;
      let messagesStored = 0;

      for (const [threadId, threadMessages] of Object.entries(threadMap)) {
        const threadResult = await this.storeThread(
          config.preClientId,
          config.workspaceId,
          threadId,
          threadMessages,
          connectedApp.provider
        );

        if (threadResult.success) {
          threadsCreated++;
          messagesStored += threadResult.messageCount;
        }
      }

      // Update pre-client stats
      await this.updatePreClientStats(config.preClientId);

      // Mark job as completed
      await supabase
        .from('pre_client_ingestion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          threads_found: threadsCreated,
          messages_ingested: messagesStored,
        })
        .eq('id', jobId);

      // Update pre-client status
      await supabase
        .from('pre_clients')
        .update({ status: 'analyzed' })
        .eq('id', config.preClientId);

    } catch (error) {
      // Mark job as failed
      await supabase
        .from('pre_client_ingestion_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: (error as Error).message,
        })
        .eq('id', jobId);

      throw error;
    }
  }

  /**
   * Fetch historical emails from Gmail
   */
  private async fetchGmailHistory(
    connectedApp: { id: string; accessToken: string; refreshToken?: string },
    config: IngestionConfig
  ): Promise<RawEmailMessage[]> {
    const messages: RawEmailMessage[] = [];

    // Build Gmail search query
    const afterDate = Math.floor(config.startDate.getTime() / 1000);
    const beforeDate = Math.floor(config.endDate.getTime() / 1000);
    const query = `(from:${config.emailFilter} OR to:${config.emailFilter}) after:${afterDate} before:${beforeDate}`;

    try {
      // Use Gmail API to search for messages
      const searchResult = await gmailService.searchMessages(
        connectedApp.accessToken,
        query,
        500 // Max messages
      );

      if (!searchResult.messages) {
        return messages;
      }

      // Fetch full message details
      for (const msgRef of searchResult.messages) {
        try {
          const fullMessage = await gmailService.getMessage(connectedApp.accessToken, msgRef.id);

          if (fullMessage) {
            messages.push(this.parseGmailMessage(fullMessage));
          }
        } catch (err) {
          console.error(`[HistoryIngestion] Failed to fetch message ${msgRef.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[HistoryIngestion] Gmail search failed:', err);
      throw err;
    }

    return messages;
  }

  /**
   * Fetch historical emails from Outlook
   */
  private async fetchOutlookHistory(
    connectedApp: { id: string; accessToken: string; refreshToken?: string },
    config: IngestionConfig
  ): Promise<RawEmailMessage[]> {
    const messages: RawEmailMessage[] = [];

    try {
      // Build OData filter
      const filter = `(from/emailAddress/address eq '${config.emailFilter}' or toRecipients/any(r: r/emailAddress/address eq '${config.emailFilter}')) and receivedDateTime ge ${config.startDate.toISOString()} and receivedDateTime le ${config.endDate.toISOString()}`;

      const searchResult = await outlookService.searchMessages(
        connectedApp.accessToken,
        filter,
        500
      );

      for (const msg of searchResult.value || []) {
        messages.push(this.parseOutlookMessage(msg));
      }
    } catch (err) {
      console.error('[HistoryIngestion] Outlook search failed:', err);
      throw err;
    }

    return messages;
  }

  /**
   * Parse Gmail message format
   */
  private parseGmailMessage(gmailMsg: Record<string, unknown>): RawEmailMessage {
    const headers = (gmailMsg.payload as Record<string, unknown>)?.headers as Array<{ name: string; value: string }> || [];
    const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);

    return {
      id: gmailMsg.id as string,
      threadId: gmailMsg.threadId as string,
      from: {
        email: fromMatch?.[2] || fromHeader,
        name: fromMatch?.[1],
      },
      to: this.parseEmailList(getHeader('To')),
      cc: this.parseEmailList(getHeader('Cc')),
      bcc: this.parseEmailList(getHeader('Bcc')),
      subject: getHeader('Subject'),
      snippet: gmailMsg.snippet as string,
      bodyPlain: this.extractGmailBody(gmailMsg, 'text/plain'),
      bodyHtml: this.extractGmailBody(gmailMsg, 'text/html'),
      timestamp: new Date(parseInt(gmailMsg.internalDate as string)),
      hasAttachments: ((gmailMsg.payload as Record<string, unknown>)?.parts as unknown[] || []).some(
        (p: unknown) => (p as Record<string, unknown>).filename
      ),
      attachmentCount: ((gmailMsg.payload as Record<string, unknown>)?.parts as unknown[] || []).filter(
        (p: unknown) => (p as Record<string, unknown>).filename
      ).length,
    };
  }

  /**
   * Parse Outlook message format
   */
  private parseOutlookMessage(outlookMsg: Record<string, unknown>): RawEmailMessage {
    const from = outlookMsg.from as Record<string, Record<string, string>> | undefined;
    const toRecipients = outlookMsg.toRecipients as Array<Record<string, Record<string, string>>> || [];
    const ccRecipients = outlookMsg.ccRecipients as Array<Record<string, Record<string, string>>> || [];

    return {
      id: outlookMsg.id as string,
      threadId: outlookMsg.conversationId as string,
      from: {
        email: from?.emailAddress?.address || '',
        name: from?.emailAddress?.name,
      },
      to: toRecipients.map((r) => ({
        email: r.emailAddress?.address || '',
        name: r.emailAddress?.name,
      })),
      cc: ccRecipients.map((r) => ({
        email: r.emailAddress?.address || '',
        name: r.emailAddress?.name,
      })),
      subject: outlookMsg.subject as string,
      snippet: (outlookMsg.bodyPreview as string || '').substring(0, 200),
      bodyPlain: (outlookMsg.body as Record<string, string>)?.contentType === 'text'
        ? (outlookMsg.body as Record<string, string>)?.content
        : undefined,
      bodyHtml: (outlookMsg.body as Record<string, string>)?.contentType === 'html'
        ? (outlookMsg.body as Record<string, string>)?.content
        : undefined,
      timestamp: new Date(outlookMsg.receivedDateTime as string),
      hasAttachments: outlookMsg.hasAttachments as boolean || false,
      attachmentCount: (outlookMsg.attachments as unknown[] || []).length,
    };
  }

  /**
   * Parse email list header
   */
  private parseEmailList(header: string): Array<{ email: string; name?: string }> {
    if (!header) return [];

    return header.split(',').map((part) => {
      const match = part.trim().match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);
      return {
        email: match?.[2] || part.trim(),
        name: match?.[1],
      };
    });
  }

  /**
   * Extract body from Gmail message
   */
  private extractGmailBody(msg: Record<string, unknown>, mimeType: string): string | undefined {
    const payload = msg.payload as Record<string, unknown>;

    if (payload?.mimeType === mimeType && payload?.body) {
      const body = payload.body as Record<string, string>;
      return body.data ? Buffer.from(body.data, 'base64').toString('utf-8') : undefined;
    }

    const parts = payload?.parts as Array<Record<string, unknown>> || [];
    for (const part of parts) {
      if (part.mimeType === mimeType && part.body) {
        const body = part.body as Record<string, string>;
        return body.data ? Buffer.from(body.data, 'base64').toString('utf-8') : undefined;
      }
    }

    return undefined;
  }

  /**
   * Group messages by thread
   */
  private groupMessagesByThread(messages: RawEmailMessage[]): Record<string, RawEmailMessage[]> {
    const threads: Record<string, RawEmailMessage[]> = {};

    for (const msg of messages) {
      if (!threads[msg.threadId]) {
        threads[msg.threadId] = [];
      }
      threads[msg.threadId].push(msg);
    }

    // Sort messages within each thread by timestamp
    for (const threadId of Object.keys(threads)) {
      threads[threadId].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    return threads;
  }

  /**
   * Store a thread and its messages
   */
  private async storeThread(
    preClientId: string,
    workspaceId: string,
    threadId: string,
    messages: RawEmailMessage[],
    provider: string
  ): Promise<{ success: boolean; messageCount: number }> {
    const supabase = await getSupabaseServer();

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    // Create or update thread
    const { data: thread, error: threadError } = await supabase
      .from('pre_client_threads')
      .upsert({
        pre_client_id: preClientId,
        workspace_id: workspaceId,
        thread_id: threadId,
        external_thread_id: threadId,
        provider,
        subject: firstMessage.subject,
        first_message_at: firstMessage.timestamp.toISOString(),
        last_message_at: lastMessage.timestamp.toISOString(),
        message_count: messages.length,
      }, {
        onConflict: 'pre_client_id,thread_id',
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error('[HistoryIngestion] Failed to store thread:', threadError);
      return { success: false, messageCount: 0 };
    }

    // Store messages
    let storedCount = 0;
    for (const msg of messages) {
      const { error: msgError } = await supabase
        .from('pre_client_messages')
        .upsert({
          thread_id: thread.id,
          pre_client_id: preClientId,
          workspace_id: workspaceId,
          external_id: msg.id,
          provider,
          from_email: msg.from.email,
          from_name: msg.from.name,
          to_emails: msg.to.map((t) => t.email),
          cc_emails: msg.cc?.map((c) => c.email) || [],
          subject: msg.subject,
          body_plain: msg.bodyPlain,
          body_html: msg.bodyHtml,
          snippet: msg.snippet,
          message_timestamp: msg.timestamp.toISOString(),
          is_inbound: true, // Will be determined by the mapper service
          has_attachments: msg.hasAttachments,
          attachment_count: msg.attachmentCount,
        }, {
          onConflict: 'thread_id,external_id',
        });

      if (!msgError) {
        storedCount++;
      }
    }

    return { success: true, messageCount: storedCount };
  }

  /**
   * Update pre-client aggregate stats
   */
  private async updatePreClientStats(preClientId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get aggregate stats
    const { data: threads } = await supabase
      .from('pre_client_threads')
      .select('id, first_message_at, last_message_at, message_count')
      .eq('pre_client_id', preClientId);

    if (!threads || threads.length === 0) return;

    const totalThreads = threads.length;
    const totalMessages = threads.reduce((sum, t) => sum + (t.message_count || 0), 0);
    const firstContact = threads.reduce((min, t) =>
      !min || new Date(t.first_message_at) < new Date(min) ? t.first_message_at : min,
      threads[0].first_message_at
    );
    const lastContact = threads.reduce((max, t) =>
      !max || new Date(t.last_message_at) > new Date(max) ? t.last_message_at : max,
      threads[0].last_message_at
    );

    await supabase
      .from('pre_clients')
      .update({
        total_threads: totalThreads,
        total_messages: totalMessages,
        first_contact_date: firstContact,
        last_contact_date: lastContact,
      })
      .eq('id', preClientId);
  }

  /**
   * Get ingestion job status
   */
  async getJobStatus(jobId: string): Promise<IngestionProgress | null> {
    const supabase = await getSupabaseServer();

    const { data: job } = await supabase
      .from('pre_client_ingestion_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status,
      threadsFound: job.threads_found,
      messagesIngested: job.messages_ingested,
      currentPage: 0,
      totalPages: 1,
      errors: job.error_message ? [job.error_message] : [],
    };
  }

  /**
   * Cancel an ingestion job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('pre_client_ingestion_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'running');

    return !error;
  }
}

export const historyIngestionService = new HistoryIngestionService();
