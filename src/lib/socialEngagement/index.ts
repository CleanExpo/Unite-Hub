/**
 * Social Engagement Library
 *
 * Clean exports for social engagement functionality.
 */

// Types
export * from './providerTypes';

// Platform Clients
export {
  createPlatformClient,
  BasePlatformClient,
  MetaClient,
  YouTubeClient,
  TikTokClient,
  LinkedInClient,
  XClient,
  type PlatformClientConfig,
  type FetchMessagesOptions,
  type FetchMessagesResult,
  type SendReplyOptions,
  type SendReplyResult,
} from './platformClients';

// Services
export {
  socialInboxService,
  type SyncOptions,
  type InboxFilters,
  type InboxResult,
  type ThreadsResult,
} from './socialInboxService';

export {
  socialTriageService,
  type TriageOptions,
  type BatchTriageResult,
} from './socialTriageService';

export {
  socialReplyService,
  type GenerateReplyOptions,
  type SendReplyOptions as QueueReplyOptions,
  type ReplyResult,
} from './socialReplyService';
