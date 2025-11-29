/**
 * Gmail Integration Types
 *
 * TypeScript type definitions for Gmail OAuth integration.
 * Follows core auth patterns and provides type safety.
 *
 * @module integrations/gmail/types
 */

import { gmail_v1 } from 'googleapis';

/**
 * Gmail OAuth configuration
 */
export interface GmailOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Gmail OAuth tokens
 */
export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Gmail OAuth scopes
 */
export const GMAIL_SCOPES = {
  READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
  SEND: 'https://www.googleapis.com/auth/gmail.send',
  MODIFY: 'https://www.googleapis.com/auth/gmail.modify',
  COMPOSE: 'https://www.googleapis.com/auth/gmail.compose',
  INSERT: 'https://www.googleapis.com/auth/gmail.insert',
  LABELS: 'https://www.googleapis.com/auth/gmail.labels',
  METADATA: 'https://www.googleapis.com/auth/gmail.metadata',
  SETTINGS_BASIC: 'https://www.googleapis.com/auth/gmail.settings.basic',
  SETTINGS_SHARING: 'https://www.googleapis.com/auth/gmail.settings.sharing',
  FULL_ACCESS: 'https://mail.google.com/',
} as const;

export type GmailScope = typeof GMAIL_SCOPES[keyof typeof GMAIL_SCOPES];

/**
 * Gmail message format
 */
export type GmailMessageFormat = 'minimal' | 'full' | 'raw' | 'metadata';

/**
 * Gmail message options
 */
export interface GetMessagesOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

/**
 * Gmail message details
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePayload;
  sizeEstimate?: number;
  raw?: string;
}

/**
 * Gmail message payload
 */
export interface GmailMessagePayload {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePayload[];
}

/**
 * Gmail message header
 */
export interface GmailHeader {
  name: string;
  value: string;
}

/**
 * Gmail message body
 */
export interface GmailMessageBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

/**
 * Parsed email message
 */
export interface ParsedEmail {
  id: string;
  threadId: string;
  from: string;
  fromName?: string;
  fromEmail: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  labels?: string[];
  snippet?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string;
}

/**
 * Send email options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  bodyType?: 'text' | 'html';
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  threadId?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * Send email result
 */
export interface SendEmailResult {
  messageId: string;
  threadId?: string;
  labelIds?: string[];
}

/**
 * Refresh token result
 */
export interface RefreshTokenResult {
  accessToken: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Gmail profile information
 */
export interface GmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

/**
 * Gmail API error codes
 */
export const GMAIL_ERROR_CODES = {
  INVALID_CREDENTIALS: 'GMAIL_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'GMAIL_TOKEN_EXPIRED',
  REFRESH_FAILED: 'GMAIL_REFRESH_FAILED',
  API_ERROR: 'GMAIL_API_ERROR',
  RATE_LIMIT: 'GMAIL_RATE_LIMIT',
  QUOTA_EXCEEDED: 'GMAIL_QUOTA_EXCEEDED',
  INVALID_GRANT: 'GMAIL_INVALID_GRANT',
  MESSAGE_NOT_FOUND: 'GMAIL_MESSAGE_NOT_FOUND',
  SEND_FAILED: 'GMAIL_SEND_FAILED',
} as const;

export type GmailErrorCode = typeof GMAIL_ERROR_CODES[keyof typeof GMAIL_ERROR_CODES];

/**
 * Gmail API error
 */
export class GmailError extends Error {
  constructor(
    message: string,
    public code: GmailErrorCode,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'GmailError';
  }
}

/**
 * Gmail watch request
 */
export interface GmailWatchRequest {
  labelIds?: string[];
  labelFilterAction?: 'include' | 'exclude';
  topicName: string;
}

/**
 * Gmail watch response
 */
export interface GmailWatchResponse {
  historyId: string;
  expiration: string;
}

/**
 * Gmail batch request
 */
export interface GmailBatchRequest {
  messages: {
    id: string;
    operation: 'get' | 'modify' | 'delete' | 'trash' | 'untrash';
    format?: GmailMessageFormat;
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }[];
}

/**
 * Gmail label
 */
export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

/**
 * Gmail history record
 */
export interface GmailHistory {
  id: string;
  messages?: GmailMessage[];
  messagesAdded?: Array<{ message: GmailMessage }>;
  messagesDeleted?: Array<{ message: GmailMessage }>;
  labelsAdded?: Array<{ message: GmailMessage; labelIds: string[] }>;
  labelsRemoved?: Array<{ message: GmailMessage; labelIds: string[] }>;
}

/**
 * Gmail draft
 */
export interface GmailDraft {
  id: string;
  message: GmailMessage;
}
