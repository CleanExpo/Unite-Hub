/**
 * Social Engagement Provider Types
 *
 * Types for social providers, message channels, sentiments, and statuses.
 */

export type SocialProvider = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'reddit' | 'x';

export type ChannelType = 'comment' | 'dm' | 'mention' | 'reply' | 'review';

export type MessageDirection = 'inbound' | 'outbound';

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'mixed';

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';

export type TriageStatus = 'pending' | 'triaged' | 'requires_attention' | 'auto_replied' | 'manually_handled';

export type MessageStatus = 'unread' | 'read' | 'replied' | 'archived' | 'spam';

export type ThreadStatus = 'open' | 'closed' | 'archived' | 'spam';

export type AccountStatus = 'active' | 'paused' | 'disconnected' | 'error';

export type ActionType = 'reply' | 'like' | 'hide' | 'delete' | 'flag' | 'unflag' | 'archive' | 'assign' | 'label';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export interface SocialAccount {
  id: string;
  workspaceId: string;
  provider: SocialProvider;
  externalAccountId: string;
  handle?: string;
  displayName?: string;
  profileImageUrl?: string;
  scopes?: string[];
  status: AccountStatus;
  lastSyncAt?: Date;
  syncCursor?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialThread {
  id: string;
  socialAccountId: string;
  workspaceId: string;
  externalThreadId: string;
  provider: SocialProvider;
  channelType: ChannelType;
  subject?: string;
  snippet?: string;
  participantHandles?: string[];
  participantIds?: string[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt?: Date;
  status: ThreadStatus;
  assignedTo?: string;
  labels?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialMessage {
  id: string;
  socialAccountId: string;
  threadId?: string;
  workspaceId: string;
  externalMessageId: string;
  provider: SocialProvider;
  channelType: ChannelType;
  direction: MessageDirection;
  authorHandle?: string;
  authorId?: string;
  authorName?: string;
  authorProfileImage?: string;
  content: string;
  contentType: ContentType;
  attachments?: MessageAttachment[];
  parentMessageId?: string;
  // AI Triage
  sentiment?: number;
  sentimentLabel?: SentimentLabel;
  spamScore?: number;
  importanceScore?: number;
  intentLabels?: string[];
  triageStatus: TriageStatus;
  triageNotes?: string;
  triagedAt?: Date;
  // Status
  status: MessageStatus;
  isFlagged: boolean;
  flaggedReason?: string;
  // Timestamps
  sentAt: Date;
  readAt?: Date;
  repliedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
}

export interface SocialAction {
  id: string;
  socialMessageId: string;
  workspaceId: string;
  actionType: ActionType;
  payloadJson?: Record<string, unknown>;
  aiGenerated: boolean;
  aiModel?: string;
  aiConfidence?: number;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  performedByUserId?: string;
  externalActionId?: string;
  errorMessage?: string;
  performedAt?: Date;
  createdAt: Date;
}

export interface SocialReplyTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  templateText: string;
  variables?: string[];
  providers?: SocialProvider[];
  channelTypes?: ChannelType[];
  sentimentTriggers?: SentimentLabel[];
  intentTriggers?: string[];
  isAiTemplate: boolean;
  usageCount: number;
  successRate?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialSyncLog {
  id: string;
  socialAccountId: string;
  workspaceId: string;
  syncType: 'full' | 'incremental' | 'manual';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  messagesSynced: number;
  threadsSynced: number;
  messagesTriaged: number;
  errors?: SyncError[];
  startedAt: Date;
  completedAt?: Date;
  syncCursor?: string;
  createdAt: Date;
}

export interface SyncError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

// Platform-specific types
export interface FacebookMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    name: string;
  };
  message: string;
  attachments?: {
    data: Array<{
      type: string;
      url: string;
    }>;
  };
}

export interface InstagramComment {
  id: string;
  timestamp: string;
  text: string;
  username: string;
  user: {
    id: string;
  };
  media: {
    id: string;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    textOriginal: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelId: {
      value: string;
    };
    publishedAt: string;
    updatedAt: string;
  };
}

export interface TikTokComment {
  id: string;
  text: string;
  create_time: number;
  user: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar_url: string;
  };
}

export interface LinkedInComment {
  id: string;
  message: {
    text: string;
  };
  actor: string;
  created: {
    time: number;
  };
}

export interface RedditMessage {
  id: string;
  author: string;
  body: string;
  created_utc: number;
  subreddit?: string;
  parent_id?: string;
}

export interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  in_reply_to_user_id?: string;
  conversation_id?: string;
}

export interface XDirectMessage {
  id: string;
  text: string;
  sender_id: string;
  created_timestamp: string;
  conversation_id: string;
}

// Normalized message for internal processing
export interface NormalizedMessage {
  externalId: string;
  provider: SocialProvider;
  channelType: ChannelType;
  direction: MessageDirection;
  content: string;
  contentType: ContentType;
  author: {
    id: string;
    handle?: string;
    name?: string;
    profileImage?: string;
  };
  attachments: MessageAttachment[];
  sentAt: Date;
  threadId?: string;
  parentId?: string;
  rawData: unknown;
}

// Triage result from AI
export interface TriageResult {
  sentiment: number;
  sentimentLabel: SentimentLabel;
  spamScore: number;
  importanceScore: number;
  intentLabels: string[];
  suggestedAction?: ActionType;
  suggestedReply?: string;
  requiresHumanReview: boolean;
  reviewReason?: string;
  confidence: number;
}

// Reply suggestion
export interface ReplySuggestion {
  text: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  confidence: number;
  templateId?: string;
  personalizationApplied: boolean;
  languageDetected: string;
}
