/**
 * Microsoft Graph Client
 *
 * Client for interacting with Microsoft Graph API to fetch Outlook emails.
 * Uses OAuth tokens from Connected Apps service.
 */

import { emailIngestionConfig, shouldSyncOutlookFolder } from '@config/emailIngestion.config';

// ============================================================================
// Types
// ============================================================================

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  replyTo: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  isDraft: boolean;
  importance: 'low' | 'normal' | 'high';
  flag: {
    flagStatus: 'notFlagged' | 'flagged' | 'complete';
  };
  hasAttachments: boolean;
  internetMessageId: string;
  conversationIndex: string;
  categories: string[];
  parentFolderId: string;
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
}

export interface OutlookConversation {
  id: string;
  topic: string;
  hasAttachments: boolean;
  lastDeliveredDateTime: string;
  uniqueSenders: string[];
}

export interface OutlookListResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

export interface ParsedOutlookMessage {
  id: string;
  conversationId: string;
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
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
  }>;
  importance: 'low' | 'normal' | 'high';
  categories: string[];
  folderId: string;
}

// ============================================================================
// Microsoft Graph Client Class
// ============================================================================

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

class MicrosoftGraphClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to Graph API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * List messages with optional filters
   */
  async listMessages(options: {
    folderId?: string;
    filter?: string;
    top?: number;
    skip?: number;
    orderBy?: string;
    select?: string[];
    nextLink?: string;
  }): Promise<OutlookListResponse<OutlookMessage>> {
    if (options.nextLink) {
      return this.request<OutlookListResponse<OutlookMessage>>(options.nextLink);
    }

    const params = new URLSearchParams();
    if (options.top) {
params.set('$top', String(options.top));
}
    if (options.skip) {
params.set('$skip', String(options.skip));
}
    if (options.filter) {
params.set('$filter', options.filter);
}
    if (options.orderBy) {
params.set('$orderby', options.orderBy);
}
    if (options.select) {
params.set('$select', options.select.join(','));
}

    const folder = options.folderId || 'inbox';
    const endpoint = `/me/mailFolders/${folder}/messages?${params.toString()}`;

    return this.request<OutlookListResponse<OutlookMessage>>(endpoint);
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<OutlookMessage> {
    return this.request<OutlookMessage>(`/me/messages/${messageId}`);
  }

  /**
   * Get message attachments
   */
  async getMessageAttachments(messageId: string): Promise<OutlookAttachment[]> {
    const response = await this.request<OutlookListResponse<OutlookAttachment>>(
      `/me/messages/${messageId}/attachments`
    );
    return response.value;
  }

  /**
   * List mail folders
   */
  async listMailFolders(): Promise<
    Array<{ id: string; displayName: string; totalItemCount: number }>
  > {
    const response = await this.request<
      OutlookListResponse<{
        id: string;
        displayName: string;
        totalItemCount: number;
      }>
    >('/me/mailFolders');
    return response.value;
  }

  /**
   * Get messages by conversation ID
   */
  async getConversationMessages(conversationId: string): Promise<OutlookMessage[]> {
    const response = await this.request<OutlookListResponse<OutlookMessage>>(
      `/me/messages?$filter=conversationId eq '${conversationId}'&$orderby=receivedDateTime asc`
    );
    return response.value;
  }

  /**
   * Sync messages since a specific date
   */
  async syncSince(
    sinceDate: Date,
    nextLink?: string
  ): Promise<{
    messages: OutlookMessage[];
    nextLink?: string;
    deltaLink?: string;
  }> {
    // Get folders to sync
    const folders = await this.listMailFolders();
    const foldersToSync = folders.filter((f) => shouldSyncOutlookFolder(f.displayName));

    const allMessages: OutlookMessage[] = [];
    let currentNextLink = nextLink;
    let deltaLink: string | undefined;

    // ISO date format for filter
    const dateFilter = `receivedDateTime ge ${sinceDate.toISOString()}`;

    for (const folder of foldersToSync) {
      let hasMore = true;

      while (hasMore) {
        const response = await this.listMessages({
          folderId: folder.id,
          filter: dateFilter,
          top: emailIngestionConfig.batch.messagesPerBatch,
          orderBy: 'receivedDateTime desc',
          nextLink: currentNextLink,
        });

        allMessages.push(...response.value);
        currentNextLink = response['@odata.nextLink'];
        deltaLink = response['@odata.deltaLink'];
        hasMore = !!currentNextLink;

        // Rate limiting
        await this.delay(emailIngestionConfig.batch.delayBetweenBatchesMs / 10);
      }
    }

    return {
      messages: allMessages,
      nextLink: currentNextLink,
      deltaLink,
    };
  }

  /**
   * Delta sync for incremental updates
   */
  async syncDelta(deltaLink: string): Promise<{
    added: OutlookMessage[];
    removed: string[];
    nextLink?: string;
    deltaLink?: string;
  }> {
    const response = await this.request<
      OutlookListResponse<OutlookMessage> & {
        '@odata.deltaLink'?: string;
      }
    >(deltaLink);

    // Filter out removed items (they have @removed property)
    const added: OutlookMessage[] = [];
    const removed: string[] = [];

    for (const item of response.value) {
      if ((item as unknown as { '@removed'?: unknown })['@removed']) {
        removed.push(item.id);
      } else {
        added.push(item);
      }
    }

    return {
      added,
      removed,
      nextLink: response['@odata.nextLink'],
      deltaLink: response['@odata.deltaLink'],
    };
  }

  /**
   * Parse an Outlook message into a standardized format
   */
  async parseMessage(message: OutlookMessage): Promise<ParsedOutlookMessage> {
    // Fetch attachments if message has them
    let attachments: Array<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
    }> = [];

    if (message.hasAttachments) {
      try {
        const rawAttachments = await this.getMessageAttachments(message.id);
        attachments = rawAttachments.map((a) => ({
          id: a.id,
          name: a.name,
          mimeType: a.contentType,
          size: a.size,
        }));
      } catch (error) {
        console.warn(`[MsGraphClient] Failed to fetch attachments: ${error}`);
      }
    }

    // Extract body text and HTML
    let bodyText = '';
    let bodyHtml = '';

    if (message.body.contentType === 'text') {
      bodyText = message.body.content;
    } else {
      bodyHtml = message.body.content;
      // Strip HTML tags for text version
      bodyText = message.body.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      subject: message.subject,
      fromEmail: message.from?.emailAddress?.address || '',
      fromName: message.from?.emailAddress?.name || '',
      toEmails: message.toRecipients.map((r) => r.emailAddress.address),
      toNames: message.toRecipients.map((r) => r.emailAddress.name),
      ccEmails: message.ccRecipients.map((r) => r.emailAddress.address),
      bccEmails: message.bccRecipients.map((r) => r.emailAddress.address),
      replyTo: message.replyTo?.[0]?.emailAddress?.address || null,
      date: new Date(message.receivedDateTime),
      snippet: message.bodyPreview,
      bodyText,
      bodyHtml,
      isRead: message.isRead,
      isStarred: message.flag.flagStatus === 'flagged',
      isDraft: message.isDraft,
      hasAttachments: message.hasAttachments,
      attachmentCount: attachments.length,
      attachments,
      importance: message.importance,
      categories: message.categories || [],
      folderId: message.parentFolderId,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<{
    id: string;
    displayName: string;
    mail: string;
  }> {
    return this.request<{
      id: string;
      displayName: string;
      mail: string;
    }>('/me');
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

export function createMicrosoftGraphClient(accessToken: string): MicrosoftGraphClient {
  return new MicrosoftGraphClient(accessToken);
}

export default MicrosoftGraphClient;
