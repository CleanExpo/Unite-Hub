/**
 * Multi-Channel Communication System
 *
 * Unified interface for all communication channels
 *
 * @module channels
 */

// Channel Manager (main interface)
export { ChannelManager, executeChannel, executeChannels, validateChannelConfig, isChannelAvailable, getAvailableChannels } from './ChannelManager';
export type { ChannelType, ChannelExecutionOptions, ChannelExecutionResult } from './ChannelManager';

// Email Service
export { sendEmail } from '@/lib/email/email-service';
export type { EmailOptions, EmailResult, EmailProvider } from '@/lib/email/email-service';

// SMS Service
export { sendSms, getAvailableProviders as getAvailableSmsProviders, isSmsAvailable, formatToE164 } from './sms/SmsService';
export type { SmsOptions, SmsResult, SmsProvider } from './sms/SmsService';

// Social Media Service
export { postToSocial, isPlatformConfigured, getConfiguredPlatforms, validatePostOptions } from './social/SocialMediaService';
export type { SocialPlatform, PostType, SocialPostOptions, SocialPostResult } from './social/SocialMediaService';

// Webhook Service
export { executeWebhook, logWebhookEvent, verifyWebhookSignature } from './webhook/WebhookService';
export type { HttpMethod, WebhookOptions, WebhookResult, WebhookAuth, WebhookEvent } from './webhook/WebhookService';
