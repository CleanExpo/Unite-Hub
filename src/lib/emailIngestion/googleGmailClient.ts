/**
 * Google Gmail Client
 *
 * Client for interacting with Gmail API to fetch emails.
 * Uses OAuth tokens from Connected Apps service.
 */

import { google, gmail_v1 } from 'googleapis';
import { emailIngestionConfig, shouldSyncGmailLabel } from '@config/emailIngestion.config';

// ============================================================================
// Types
// ============================================================================

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; attachmentId?: string; size?: number };
      filename?: string;
    }>;
    mimeType: string;
  };
  sizeEstimate: number;
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailSyncResult {
  threads: GmailThread[];
  nextPageToken?: string;
  historyId?: string;
}

export interface ParsedEmailMessage {
  id: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  toNames: string[];
  ccEmails: string[];
  bccEmails: string[];
  replyTo: string | null;
  date: Date;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments: Array<{
    name: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  inReplyTo: string | null;
  messageReferences: string[];
  importance: 'low' | 'normal' | 'high';
}

// ============================================================================
// Gmail Client Class
// ============================================================================

class GoogleGmailClient {
  private gmail: gmail_v1.Gmail;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  /**
   * List messages with optional query
   */
  async listMessages(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<GmailListResponse> {
    const { data } = await this.gmail.users.messages.list({
      userId: 'me',
      q: options.query,
      maxResults: options.maxResults || emailIngestionConfig.batch.messagesPerBatch,
      pageToken: options.pageToken,
      labelIds: options.labelIds,
    });

    return {
      messages: data.messages as GmailListResponse['messages'],
      nextPageToken: data.nextPageToken || undefined,
      resultSizeEstimate: data.resultSizeEstimate || undefined,
    };
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const { data } = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    return data as unknown as GmailMessage;
  }

  /**
   * Get a thread with all messages
   */
  async getThread(threadId: string): Promise<GmailThread> {
    const { data } = await this.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    return data as unknown as GmailThread;
  }

  /**
   * List threads
   */
  async listThreads(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{ threads: Array<{ id: string; historyId: string }>; nextPageToken?: string }> {
    const { data } = await this.gmail.users.threads.list({
      userId: 'me',
      q: options.query,
      maxResults: options.maxResults || emailIngestionConfig.batch.threadsPerBatch,
      pageToken: options.pageToken,
      labelIds: options.labelIds,
    });

    return {
      threads: (data.threads || []) as Array<{ id: string; historyId: string }>,
      nextPageToken: data.nextPageToken || undefined,
    };
  }

  /**
   * Get history (for incremental sync)
   */
  async getHistory(options: {
    startHistoryId: string;
    maxResults?: number;
    pageToken?: string;
    historyTypes?: string[];
  }): Promise<{
    history: Array<{
      id: string;
      messagesAdded?: Array<{ message: { id: string; threadId: string } }>;
      messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
    }>;
    nextPageToken?: string;
    historyId?: string;
  }> {
    const { data } = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId: options.startHistoryId,
      maxResults: options.maxResults || 100,
      pageToken: options.pageToken,
      historyTypes: options.historyTypes || ['messageAdded'],
    });

    return {
      history: (data.history || []) as Array<{
        id: string;
        messagesAdded?: Array<{ message: { id: string; threadId: string } }>;
        messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
      }>,
      nextPageToken: data.nextPageToken || undefined,
      historyId: data.historyId || undefined,
    };
  }

  /**
   * Get user profile (for historyId)
   */
  async getProfile(): Promise<{ historyId: string; emailAddress: string }> {
    const { data } = await this.gmail.users.getProfile({
      userId: 'me',
    });

    return {
      historyId: data.historyId || '',
      emailAddress: data.emailAddress || '',
    };
  }

  /**
   * Sync emails since a specific date
   */
  async syncSince(sinceDate: Date, pageToken?: string): Promise<GmailSyncResult> {
    // Build query for date range
    const dateQuery = `after:${Math.floor(sinceDate.getTime() / 1000)}`;

    // List threads
    const { threads: threadList, nextPageToken } = await this.listThreads({
      query: dateQuery,
      maxResults: emailIngestionConfig.batch.threadsPerBatch,
      pageToken,
    });

    // Fetch full thread data
    const threads: GmailThread[] = [];
    for (const threadRef of threadList) {
      try {
        const thread = await this.getThread(threadRef.id);

        // Filter messages by label
        const filteredMessages = thread.messages.filter((msg) =>
          msg.labelIds?.some((label) => shouldSyncGmailLabel(label))
        );

        if (filteredMessages.length > 0) {
          threads.push({
            ...thread,
            messages: filteredMessages,
          });
        }

        // Rate limiting
        await this.delay(emailIngestionConfig.batch.delayBetweenBatchesMs / 10);
      } catch (error) {
        console.error(`[GmailClient] Failed to fetch thread ${threadRef.id}:`, error);
      }
    }

    // Get current history ID
    const profile = await this.getProfile();

    return {
      threads,
      nextPageToken,
      historyId: profile.historyId,
    };
  }

  /**
   * Incremental sync using history API
   */
  async syncIncremental(
    startHistoryId: string,
    pageToken?: string
  ): Promise<{
    newMessageIds: string[];
    deletedMessageIds: string[];
    nextPageToken?: string;
    historyId?: string;
  }> {
    const { history, nextPageToken, historyId } = await this.getHistory({
      startHistoryId,
      pageToken,
    });

    const newMessageIds: string[] = [];
    const deletedMessageIds: string[] = [];

    for (const item of history) {
      if (item.messagesAdded) {
        for (const added of item.messagesAdded) {
          newMessageIds.push(added.message.id);
        }
      }
      if (item.messagesDeleted) {
        for (const deleted of item.messagesDeleted) {
          deletedMessageIds.push(deleted.message.id);
        }
      }
    }

    return {
      newMessageIds: [...new Set(newMessageIds)],
      deletedMessageIds: [...new Set(deletedMessageIds)],
      nextPageToken,
      historyId,
    };
  }

  /**
   * Parse a Gmail message into a standardized format
   */
  parseMessage(message: GmailMessage): ParsedEmailMessage {
    const headers = message.payload.headers || [];
    const getHeader = (name: string): string =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    // Parse from header
    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
    const fromName = fromMatch?.[1]?.trim() || '';
    const fromEmail = fromMatch?.[2]?.trim() || fromHeader;

    // Parse to headers
    const toHeader = getHeader('To');
    const { emails: toEmails, names: toNames } = this.parseEmailList(toHeader);

    // Parse CC headers
    const ccHeader = getHeader('Cc');
    const { emails: ccEmails } = this.parseEmailList(ccHeader);

    // Extract body
    const { text: bodyText, html: bodyHtml } = this.extractBody(message.payload);

    // Extract attachments
    const attachments = this.extractAttachments(message.payload);

    // Determine importance from headers
    let importance: 'low' | 'normal' | 'high' = 'normal';
    const importanceHeader = getHeader('Importance')?.toLowerCase();
    const priorityHeader = getHeader('X-Priority');
    if (importanceHeader === 'high' || priorityHeader === '1') {
      importance = 'high';
    } else if (importanceHeader === 'low' || priorityHeader === '5') {
      importance = 'low';
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject'),
      fromEmail,
      fromName,
      toEmails,
      toNames,
      ccEmails,
      bccEmails: [],
      replyTo: getHeader('Reply-To') || null,
      date: new Date(parseInt(message.internalDate, 10)),
      snippet: message.snippet,
      bodyText,
      bodyHtml,
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED') || false,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      attachments,
      inReplyTo: getHeader('In-Reply-To') || null,
      messageReferences: getHeader('References')?.split(/\s+/).filter(Boolean) || [],
      importance,
    };
  }

  /**
   * Parse email list header (To, Cc, etc.)
   */
  private parseEmailList(header: string): { emails: string[]; names: string[] } {
    const emails: string[] = [];
    const names: string[] = [];

    if (!header) {
return { emails, names };
}

    const parts = header.split(',');
    for (const part of parts) {
      const match = part.trim().match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
      if (match) {
        names.push(match[1]?.trim() || '');
        emails.push(match[2]?.trim() || part.trim());
      } else {
        emails.push(part.trim());
        names.push('');
      }
    }

    return { emails, names };
  }

  /**
   * Extract body text and HTML from message payload
   */
  private extractBody(
    payload: GmailMessage['payload']
  ): { text: string; html: string } {
    let text = '';
    let html = '';

    if (payload.body?.data) {
      const content = Buffer.from(payload.body.data, 'base64').toString('utf8');
      if (payload.mimeType === 'text/plain') {
        text = content;
      } else if (payload.mimeType === 'text/html') {
        html = content;
      }
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          text = Buffer.from(part.body.data, 'base64').toString('utf8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          html = Buffer.from(part.body.data, 'base64').toString('utf8');
        } else if (part.mimeType?.startsWith('multipart/')) {
          // Recursively extract from nested parts
          const nested = this.extractBody(part as unknown as GmailMessage['payload']);
          if (nested.text) {
text = nested.text;
}
          if (nested.html) {
html = nested.html;
}
        }
      }
    }

    return { text, html };
  }

  /**
   * Extract attachment info from message payload
   */
  private extractAttachments(
    payload: GmailMessage['payload']
  ): ParsedEmailMessage['attachments'] {
    const attachments: ParsedEmailMessage['attachments'] = [];

    const processPartsForAttachments = (parts: GmailMessage['payload']['parts']): void => {
      if (!parts) {
return;
}

      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            name: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId,
          });
        }

        if (part.mimeType?.startsWith('multipart/')) {
          processPartsForAttachments(
            (part as unknown as { parts?: GmailMessage['payload']['parts'] }).parts
          );
        }
      }
    };

    processPartsForAttachments(payload.parts);
    return attachments;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGoogleGmailClient(accessToken: string): GoogleGmailClient {
  return new GoogleGmailClient(accessToken);
}

export default GoogleGmailClient;
