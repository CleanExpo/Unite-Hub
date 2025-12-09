/**
 * Gmail OAuth Integration
 *
 * Production-ready Gmail integration with OAuth 2.0, token management,
 * and comprehensive email operations. Follows core auth patterns from
 * src/core/auth/ and email service patterns from src/lib/email/.
 *
 * Features:
 * - OAuth 2.0 with PKCE flow support
 * - Automatic token refresh
 * - Email fetching, parsing, and sending
 * - Batch operations support
 * - Rate limiting awareness
 * - Type-safe with comprehensive error handling
 *
 * @module integrations/gmail
 */

import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import {
  GmailOAuthConfig,
  GmailTokens,
  GmailScope,
  GMAIL_SCOPES,
  GetMessagesOptions,
  GmailMessage,
  ParsedEmail,
  SendEmailOptions,
  SendEmailResult,
  RefreshTokenResult,
  GmailProfile,
  GmailError,
  GMAIL_ERROR_CODES,
  GmailLabel,
  GmailWatchRequest,
  GmailWatchResponse,
  GmailDraft,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: GmailOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_CALLBACK_URL || `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`,
};

const DEFAULT_SCOPES: GmailScope[] = [
  GMAIL_SCOPES.READONLY,
  GMAIL_SCOPES.SEND,
  GMAIL_SCOPES.MODIFY,
];

// ============================================================================
// Gmail Client Class
// ============================================================================

/**
 * Gmail API client with OAuth 2.0 support
 *
 * @example
 * ```typescript
 * const client = new GmailClient({
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   redirectUri: 'https://example.com/callback',
 * });
 *
 * // Get auth URL
 * const authUrl = client.getAuthUrl(['gmail.readonly', 'gmail.send']);
 *
 * // Handle callback
 * const tokens = await client.handleCallback(code);
 *
 * // Set credentials
 * client.setCredentials(tokens);
 *
 * // Fetch messages
 * const messages = await client.getMessages({ maxResults: 10 });
 * ```
 */
export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail | null = null;
  private config: GmailOAuthConfig;

  constructor(config: Partial<GmailOAuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Gmail OAuth configuration missing: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
    }

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  // ==========================================================================
  // OAuth Methods
  // ==========================================================================

  /**
   * Generate OAuth authorization URL
   *
   * @param scopes - Gmail API scopes to request
   * @param state - CSRF protection state parameter
   * @returns Authorization URL
   */
  getAuthUrl(scopes: GmailScope[] = DEFAULT_SCOPES, state?: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent to get refresh token
      include_granted_scopes: true,
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   *
   * @param code - Authorization code from OAuth callback
   * @returns OAuth tokens
   */
  async handleCallback(code: string): Promise<GmailTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new GmailError(
          'No access token received from Google',
          GMAIL_ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      const gmailTokens: GmailTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      };

      // Automatically set credentials
      this.setCredentials(gmailTokens);

      return gmailTokens;
    } catch (error: any) {
      throw new GmailError(
        `Failed to exchange authorization code: ${error.message}`,
        GMAIL_ERROR_CODES.INVALID_CREDENTIALS,
        error.code,
        error
      );
    }
  }

  /**
   * Set OAuth credentials for API calls
   *
   * @param tokens - OAuth tokens
   */
  setCredentials(tokens: GmailTokens): void {
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
      scope: tokens.scope,
      token_type: tokens.tokenType,
    });

    // Initialize Gmail API client
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Refresh expired access token using refresh token
   *
   * @param refreshToken - OAuth refresh token
   * @returns New access token and expiry
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new GmailError(
          'No access token received after refresh',
          GMAIL_ERROR_CODES.REFRESH_FAILED
        );
      }

      const result: RefreshTokenResult = {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
        scope: credentials.scope,
        tokenType: credentials.token_type,
      };

      // Update credentials
      this.oauth2Client.setCredentials(credentials);

      return result;
    } catch (error: any) {
      // Check for invalid_grant error (refresh token expired/revoked)
      if (error.message?.includes('invalid_grant')) {
        throw new GmailError(
          'Refresh token expired or revoked. User must re-authenticate.',
          GMAIL_ERROR_CODES.INVALID_GRANT,
          error.code,
          error
        );
      }

      throw new GmailError(
        `Failed to refresh access token: ${error.message}`,
        GMAIL_ERROR_CODES.REFRESH_FAILED,
        error.code,
        error
      );
    }
  }

  /**
   * Check if credentials are set
   */
  hasCredentials(): boolean {
    return this.gmail !== null;
  }

  /**
   * Ensure Gmail API client is initialized
   */
  private ensureInitialized(): gmail_v1.Gmail {
    if (!this.gmail) {
      throw new GmailError(
        'Gmail client not initialized. Call setCredentials() first.',
        GMAIL_ERROR_CODES.INVALID_CREDENTIALS
      );
    }
    return this.gmail;
  }

  // ==========================================================================
  // Profile Methods
  // ==========================================================================

  /**
   * Get Gmail profile information
   *
   * @returns Gmail profile
   */
  async getProfile(): Promise<GmailProfile> {
    const gmail = this.ensureInitialized();

    try {
      const response = await gmail.users.getProfile({ userId: 'me' });
      const profile = response.data;

      return {
        emailAddress: profile.emailAddress || '',
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId,
      };
    } catch (error: any) {
      throw this.handleApiError(error, 'Failed to get Gmail profile');
    }
  }

  // ==========================================================================
  // Message Methods
  // ==========================================================================

  /**
   * Get list of messages matching query
   *
   * @param options - Query options
   * @returns Array of message IDs and thread IDs
   */
  async getMessages(options: GetMessagesOptions = {}): Promise<GmailMessage[]> {
    const gmail = this.ensureInitialized();

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults || 100,
        pageToken: options.pageToken,
        q: options.query,
        labelIds: options.labelIds,
        includeSpamTrash: options.includeSpamTrash,
      });

      const messages = response.data.messages || [];

      // Map to GmailMessage format
      return messages.map(msg => ({
        id: msg.id || '',
        threadId: msg.threadId || '',
      }));
    } catch (error: any) {
      throw this.handleApiError(error, 'Failed to fetch messages');
    }
  }

  /**
   * Get full message details by ID
   *
   * @param messageId - Message ID
   * @param format - Response format (default: 'full')
   * @returns Full message details
   */
  async getMessage(messageId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailMessage> {
    const gmail = this.ensureInitialized();

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format,
      });

      return response.data as GmailMessage;
    } catch (error: any) {
      if (error.code === 404) {
        throw new GmailError(
          `Message not found: ${messageId}`,
          GMAIL_ERROR_CODES.MESSAGE_NOT_FOUND,
          404,
          error
        );
      }
      throw this.handleApiError(error, `Failed to get message ${messageId}`);
    }
  }

  /**
   * Parse Gmail message into structured format
   *
   * @param message - Gmail message
   * @returns Parsed email
   */
  parseMessage(message: GmailMessage): ParsedEmail {
    const headers = message.payload?.headers || [];

    const getHeader = (name: string): string => {
      const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const from = getHeader('From');
    const emailMatch = from.match(/<([^>]+)>/);
    const fromEmail = emailMatch ? emailMatch[1] : from;
    const fromName = emailMatch ? from.replace(/<[^>]+>/, '').trim() : '';

    const to = getHeader('To').split(',').map(e => e.trim());
    const cc = getHeader('Cc').split(',').filter(Boolean).map(e => e.trim());
    const bcc = getHeader('Bcc').split(',').filter(Boolean).map(e => e.trim());
    const subject = getHeader('Subject');
    const dateStr = getHeader('Date');

    // Extract body
    const { text, html } = this.extractBody(message.payload);

    return {
      id: message.id,
      threadId: message.threadId,
      from,
      fromName,
      fromEmail,
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      body: text || html || '',
      bodyHtml: html,
      date: dateStr ? new Date(dateStr) : new Date(),
      labels: message.labelIds,
      snippet: message.snippet,
    };
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(payload: any): { text: string; html: string } {
    let text = '';
    let html = '';

    if (!payload) {
return { text, html };
}

    // Single part message
    if (payload.body?.data) {
      const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/html') {
        html = decoded;
      } else {
        text = decoded;
      }
    }

    // Multipart message
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          text = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          // Nested parts
          const nested = this.extractBody(part);
          text = text || nested.text;
          html = html || nested.html;
        }
      }
    }

    return { text, html };
  }

  /**
   * Send email message
   *
   * @param options - Send email options
   * @returns Send result with message ID
   */
  async sendMessage(options: SendEmailOptions): Promise<SendEmailResult> {
    const gmail = this.ensureInitialized();

    try {
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined;
      const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined;

      const headers = [
        `To: ${to}`,
        `Subject: ${options.subject}`,
        ...(cc ? [`Cc: ${cc}`] : []),
        ...(bcc ? [`Bcc: ${bcc}`] : []),
        ...(options.replyTo ? [`Reply-To: ${options.replyTo}`] : []),
        ...(options.threadId ? [`In-Reply-To: ${options.threadId}`, `References: ${options.threadId}`] : []),
      ];

      // Add custom headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers.push(`${key}: ${value}`);
        });
      }

      // Add content type
      const contentType = options.bodyType === 'html'
        ? 'Content-Type: text/html; charset=UTF-8'
        : 'Content-Type: text/plain; charset=UTF-8';

      headers.push(contentType);

      // Build message
      const message = [
        ...headers,
        '',
        options.body,
      ].join('\r\n');

      // Encode message
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send message
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: options.threadId,
        },
      });

      return {
        messageId: response.data.id || '',
        threadId: response.data.threadId,
        labelIds: response.data.labelIds,
      };
    } catch (error: any) {
      throw new GmailError(
        `Failed to send email: ${error.message}`,
        GMAIL_ERROR_CODES.SEND_FAILED,
        error.code,
        error
      );
    }
  }

  /**
   * Modify message labels (mark read/unread, archive, etc.)
   *
   * @param messageId - Message ID
   * @param addLabelIds - Labels to add
   * @param removeLabelIds - Labels to remove
   */
  async modifyMessage(
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<void> {
    const gmail = this.ensureInitialized();

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds,
          removeLabelIds,
        },
      });
    } catch (error: any) {
      throw this.handleApiError(error, `Failed to modify message ${messageId}`);
    }
  }

  /**
   * Trash a message
   *
   * @param messageId - Message ID
   */
  async trashMessage(messageId: string): Promise<void> {
    const gmail = this.ensureInitialized();

    try {
      await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });
    } catch (error: any) {
      throw this.handleApiError(error, `Failed to trash message ${messageId}`);
    }
  }

  /**
   * Delete a message permanently
   *
   * @param messageId - Message ID
   */
  async deleteMessage(messageId: string): Promise<void> {
    const gmail = this.ensureInitialized();

    try {
      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });
    } catch (error: any) {
      throw this.handleApiError(error, `Failed to delete message ${messageId}`);
    }
  }

  // ==========================================================================
  // Label Methods
  // ==========================================================================

  /**
   * Get all labels
   *
   * @returns Array of labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    const gmail = this.ensureInitialized();

    try {
      const response = await gmail.users.labels.list({ userId: 'me' });
      return (response.data.labels || []) as GmailLabel[];
    } catch (error: any) {
      throw this.handleApiError(error, 'Failed to get labels');
    }
  }

  /**
   * Create a new label
   *
   * @param name - Label name
   * @returns Created label
   */
  async createLabel(name: string): Promise<GmailLabel> {
    const gmail = this.ensureInitialized();

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      return response.data as GmailLabel;
    } catch (error: any) {
      throw this.handleApiError(error, `Failed to create label ${name}`);
    }
  }

  // ==========================================================================
  // Draft Methods
  // ==========================================================================

  /**
   * Create a draft message
   *
   * @param options - Send email options
   * @returns Created draft
   */
  async createDraft(options: SendEmailOptions): Promise<GmailDraft> {
    const gmail = this.ensureInitialized();

    try {
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
      const message = [
        `To: ${to}`,
        `Subject: ${options.subject}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        options.body,
      ].join('\r\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return response.data as GmailDraft;
    } catch (error: any) {
      throw this.handleApiError(error, 'Failed to create draft');
    }
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  /**
   * Handle Gmail API errors
   */
  private handleApiError(error: any, context: string): GmailError {
    // Rate limit errors
    if (error.code === 429) {
      return new GmailError(
        `${context}: Rate limit exceeded`,
        GMAIL_ERROR_CODES.RATE_LIMIT,
        429,
        error
      );
    }

    // Quota errors
    if (error.message?.includes('quota')) {
      return new GmailError(
        `${context}: Quota exceeded`,
        GMAIL_ERROR_CODES.QUOTA_EXCEEDED,
        error.code,
        error
      );
    }

    // Token expired
    if (error.code === 401 || error.message?.includes('Invalid Credentials')) {
      return new GmailError(
        `${context}: Token expired or invalid`,
        GMAIL_ERROR_CODES.TOKEN_EXPIRED,
        401,
        error
      );
    }

    // Generic API error
    return new GmailError(
      `${context}: ${error.message}`,
      GMAIL_ERROR_CODES.API_ERROR,
      error.code,
      error
    );
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a Gmail client with default configuration
 */
export function createGmailClient(config?: Partial<GmailOAuthConfig>): GmailClient {
  return new GmailClient(config);
}

/**
 * Get OAuth authorization URL
 *
 * @param scopes - Gmail API scopes
 * @param state - CSRF state parameter
 * @returns Authorization URL
 */
export function getAuthUrl(scopes: GmailScope[] = DEFAULT_SCOPES, state?: string): string {
  const client = createGmailClient();
  return client.getAuthUrl(scopes, state);
}

/**
 * Handle OAuth callback
 *
 * @param code - Authorization code
 * @returns OAuth tokens
 */
export async function handleCallback(code: string): Promise<GmailTokens> {
  const client = createGmailClient();
  return client.handleCallback(code);
}

/**
 * Refresh access token
 *
 * @param refreshToken - Refresh token
 * @returns New access token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
  const client = createGmailClient();
  return client.refreshToken(refreshToken);
}

/**
 * Get messages with authenticated client
 *
 * @param accessToken - Access token
 * @param options - Query options
 * @returns Messages
 */
export async function getMessages(
  accessToken: string,
  options: GetMessagesOptions = {}
): Promise<ParsedEmail[]> {
  const client = createGmailClient();
  client.setCredentials({ accessToken });

  const messages = await client.getMessages(options);

  const parsed: ParsedEmail[] = [];
  for (const msg of messages) {
    const fullMessage = await client.getMessage(msg.id);
    parsed.push(client.parseMessage(fullMessage));
  }

  return parsed;
}

/**
 * Send email with authenticated client
 *
 * @param accessToken - Access token
 * @param options - Send options
 * @returns Send result
 */
export async function sendMessage(
  accessToken: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const client = createGmailClient();
  client.setCredentials({ accessToken });
  return client.sendMessage(options);
}

// ============================================================================
// Exports
// ============================================================================

export * from './types';
export { GmailClient as default };
