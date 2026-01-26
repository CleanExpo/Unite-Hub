/**
 * Channel Manager
 *
 * Unified interface for all communication channels
 * Coordinates email, SMS, social media, and webhooks
 *
 * @module channels/ChannelManager
 */

import { createApiLogger } from '@/lib/logger';
import { sendEmail, type EmailOptions, type EmailResult } from '@/lib/email/email-service';
import { sendSms, type SmsOptions, type SmsResult } from './sms/SmsService';
import { postToSocial, type SocialPostOptions, type SocialPostResult } from './social/SocialMediaService';
import { executeWebhook, type WebhookOptions, type WebhookResult } from './webhook/WebhookService';
import type { ChannelConfig } from '@/lib/models/social-drip-campaign';

const logger = createApiLogger({ service: 'ChannelManager' });

// ============================================================================
// Types
// ============================================================================

export type ChannelType = 'email' | 'sms' | 'social' | 'webhook';

export interface ChannelExecutionOptions {
  type: ChannelType;
  config: ChannelConfig;
  contact: {
    id: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ChannelExecutionResult {
  success: boolean;
  type: ChannelType;
  provider?: string;
  messageId?: string;
  postId?: string;
  postUrl?: string;
  error?: any;
  details?: any;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Execute channel action
 */
export async function executeChannel(options: ChannelExecutionOptions): Promise<ChannelExecutionResult> {
  const { type, config, contact } = options;

  logger.info('Executing channel', { type, contactId: contact.id });

  try {
    switch (type) {
      case 'email':
        return await executeEmail(options);

      case 'sms':
        return await executeSms(options);

      case 'social':
        return await executeSocial(options);

      case 'webhook':
        return await executeWebhookChannel(options);

      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }
  } catch (error) {
    logger.error('Channel execution failed', { error, type, contactId: contact.id });

    return {
      success: false,
      type,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Channel Executors
// ============================================================================

/**
 * Execute email channel
 */
async function executeEmail(options: ChannelExecutionOptions): Promise<ChannelExecutionResult> {
  const { config, contact, variables } = options;

  if (!config.email) {
    throw new Error('Email configuration not found');
  }

  if (!contact.email) {
    throw new Error('Contact email not found');
  }

  const emailConfig = config.email;

  // Replace variables in subject and body
  let subject = replaceVariables(emailConfig.subject, contact, variables);
  let body = replaceVariables(emailConfig.body_html || emailConfig.body, contact, variables);

  // Personalize if enabled (would integrate with AI personalization)
  if (emailConfig.personalization_enabled) {
    // TODO: Integrate with AI personalization service
    logger.info('AI personalization requested', { contactId: contact.id });
  }

  // Send email
  const emailOptions: EmailOptions = {
    to: contact.email,
    subject,
    html: body,
    text: stripHtml(body),
  };

  const result: EmailResult = await sendEmail(emailOptions);

  return {
    success: result.success,
    type: 'email',
    provider: result.provider,
    messageId: result.messageId,
    error: result.error,
    details: result,
  };
}

/**
 * Execute SMS channel
 */
async function executeSms(options: ChannelExecutionOptions): Promise<ChannelExecutionResult> {
  const { config, contact, variables } = options;

  if (!config.sms) {
    throw new Error('SMS configuration not found');
  }

  if (!contact.phone) {
    throw new Error('Contact phone number not found');
  }

  const smsConfig = config.sms;

  // Replace variables in message
  const message = replaceVariables(smsConfig.message, contact, variables);

  // Send SMS
  const smsOptions: SmsOptions = {
    to: contact.phone,
    message,
    mediaUrl: smsConfig.media_url,
  };

  const result: SmsResult = await sendSms(smsOptions);

  return {
    success: result.success,
    type: 'sms',
    provider: result.provider,
    messageId: result.messageId,
    error: result.error,
    details: result,
  };
}

/**
 * Execute social media channel
 */
async function executeSocial(options: ChannelExecutionOptions): Promise<ChannelExecutionResult> {
  const { config, contact, variables } = options;

  if (!config.social) {
    throw new Error('Social media configuration not found');
  }

  const socialConfig = config.social;

  // Replace variables in content
  const content = replaceVariables(socialConfig.content, contact, variables);

  // Post to social media
  const socialOptions: SocialPostOptions = {
    platform: socialConfig.platform,
    postType: socialConfig.post_type,
    content,
    mediaUrls: socialConfig.media_urls,
    hashtags: socialConfig.hashtags,
    mentions: socialConfig.mentions,
    scheduleTime: socialConfig.schedule_time,
  };

  const result: SocialPostResult = await postToSocial(socialOptions);

  return {
    success: result.success,
    type: 'social',
    provider: result.platform,
    postId: result.postId,
    postUrl: result.postUrl,
    error: result.error,
    details: result,
  };
}

/**
 * Execute webhook channel
 */
async function executeWebhookChannel(options: ChannelExecutionOptions): Promise<ChannelExecutionResult> {
  const { config, contact, variables, metadata } = options;

  if (!config.webhook) {
    throw new Error('Webhook configuration not found');
  }

  const webhookConfig = config.webhook;

  // Build payload with contact data and variables
  const payload = {
    ...webhookConfig.payload,
    contact: {
      id: contact.id,
      email: contact.email,
      phone: contact.phone,
      first_name: contact.first_name,
      last_name: contact.last_name,
    },
    variables,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Execute webhook
  const webhookOptions: WebhookOptions = {
    url: webhookConfig.url,
    method: webhookConfig.method,
    headers: webhookConfig.headers,
    payload,
    retryOnFailure: webhookConfig.retry_on_failure ?? true,
    maxRetries: webhookConfig.max_retries ?? 3,
  };

  const result: WebhookResult = await executeWebhook(webhookOptions);

  return {
    success: result.success,
    type: 'webhook',
    messageId: result.response?.id,
    error: result.error,
    details: result,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Replace template variables
 */
function replaceVariables(
  text: string,
  contact: Record<string, any>,
  variables?: Record<string, any>
): string {
  let result = text;

  // Replace contact fields
  result = result.replace(/\{\{first_name\}\}/g, contact.first_name || '');
  result = result.replace(/\{\{last_name\}\}/g, contact.last_name || '');
  result = result.replace(/\{\{email\}\}/g, contact.email || '');
  result = result.replace(/\{\{phone\}\}/g, contact.phone || '');
  result = result.replace(/\{\{company_name\}\}/g, contact.company_name || '');

  // Replace custom variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });
  }

  return result;
}

/**
 * Strip HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Execute multiple channels in parallel
 */
export async function executeChannels(
  optionsList: ChannelExecutionOptions[]
): Promise<ChannelExecutionResult[]> {
  logger.info('Executing multiple channels', { count: optionsList.length });

  const results = await Promise.allSettled(optionsList.map((options) => executeChannel(options)));

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        type: optionsList[index].type,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      };
    }
  });
}

// ============================================================================
// Channel Validation
// ============================================================================

/**
 * Validate channel configuration
 */
export function validateChannelConfig(
  type: ChannelType,
  config: ChannelConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'email':
      if (!config.email) {
        errors.push('Email configuration is required');
      } else {
        if (!config.email.subject || config.email.subject.trim() === '') {
          errors.push('Email subject is required');
        }

        if (!config.email.body || config.email.body.trim() === '') {
          errors.push('Email body is required');
        }
      }
      break;

    case 'sms':
      if (!config.sms) {
        errors.push('SMS configuration is required');
      } else {
        if (!config.sms.message || config.sms.message.trim() === '') {
          errors.push('SMS message is required');
        }

        if (config.sms.message && config.sms.message.length > 1600) {
          errors.push('SMS message too long (max 1600 characters)');
        }
      }
      break;

    case 'social':
      if (!config.social) {
        errors.push('Social media configuration is required');
      } else {
        if (!config.social.platform) {
          errors.push('Social media platform is required');
        }

        if (!config.social.post_type) {
          errors.push('Social media post type is required');
        }

        if (!config.social.content || config.social.content.trim() === '') {
          errors.push('Social media content is required');
        }

        // Platform-specific validation
        if (config.social.platform === 'twitter' && config.social.content.length > 280) {
          errors.push('Twitter posts must be 280 characters or less');
        }

        if (
          ['instagram', 'tiktok', 'youtube'].includes(config.social.platform) &&
          (!config.social.media_urls || config.social.media_urls.length === 0)
        ) {
          errors.push(`${config.social.platform} posts require media URLs`);
        }
      }
      break;

    case 'webhook':
      if (!config.webhook) {
        errors.push('Webhook configuration is required');
      } else {
        if (!config.webhook.url || config.webhook.url.trim() === '') {
          errors.push('Webhook URL is required');
        }

        if (!config.webhook.method) {
          errors.push('Webhook HTTP method is required');
        }

        const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
        if (config.webhook.method && !validMethods.includes(config.webhook.method)) {
          errors.push(`Invalid webhook method: ${config.webhook.method}`);
        }

        // Validate URL format
        try {
          new URL(config.webhook.url);
        } catch {
          errors.push('Invalid webhook URL format');
        }
      }
      break;

    default:
      errors.push(`Unknown channel type: ${type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Channel Availability
// ============================================================================

/**
 * Check if channel type is available
 */
export function isChannelAvailable(type: ChannelType): boolean {
  switch (type) {
    case 'email':
      // Check if at least one email provider is configured
      return !!(
        process.env.SENDGRID_API_KEY ||
        process.env.RESEND_API_KEY ||
        (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)
      );

    case 'sms':
      // Check if at least one SMS provider is configured
      return !!(
        (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ||
        (process.env.AWS_SNS_ACCESS_KEY_ID && process.env.AWS_SNS_SECRET_ACCESS_KEY) ||
        (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET)
      );

    case 'social':
      // Check if at least one social platform is configured
      return !!(
        process.env.FACEBOOK_PAGE_ID ||
        process.env.INSTAGRAM_ACCOUNT_ID ||
        process.env.LINKEDIN_ORG_ID ||
        process.env.TWITTER_API_KEY ||
        process.env.TIKTOK_ACCESS_TOKEN ||
        process.env.YOUTUBE_CHANNEL_ID
      );

    case 'webhook':
      // Webhooks always available (no external service required)
      return true;

    default:
      return false;
  }
}

/**
 * Get available channel types
 */
export function getAvailableChannels(): ChannelType[] {
  const channels: ChannelType[] = ['email', 'sms', 'social', 'webhook'];
  return channels.filter(isChannelAvailable);
}
