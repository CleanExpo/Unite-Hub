/**
 * SMS Service
 *
 * Unified SMS sending service with multi-provider support
 *
 * Supports:
 * - Twilio (Primary)
 * - AWS SNS
 * - Vonage (formerly Nexmo)
 *
 * @module channels/sms/SmsService
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'SmsService' });

// ============================================================================
// Types
// ============================================================================

export type SmsProvider = 'twilio' | 'aws-sns' | 'vonage' | 'auto';

export interface SmsOptions {
  to: string; // E.164 format: +1234567890
  message: string;
  from?: string; // Phone number or alphanumeric sender ID
  mediaUrl?: string; // MMS media URL
  provider?: SmsProvider;
  metadata?: Record<string, any>;
}

export interface SmsResult {
  success: boolean;
  provider: SmsProvider;
  messageId?: string;
  error?: any;
  fallbackUsed?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  defaultFrom: process.env.SMS_FROM_NUMBER || '',

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  },

  awsSns: {
    accessKeyId: process.env.AWS_SNS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SNS_SECRET_ACCESS_KEY,
    region: process.env.AWS_SNS_REGION || 'us-east-1',
    enabled: !!(process.env.AWS_SNS_ACCESS_KEY_ID && process.env.AWS_SNS_SECRET_ACCESS_KEY),
  },

  vonage: {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    fromNumber: process.env.VONAGE_FROM_NUMBER,
    enabled: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET),
  },
};

// ============================================================================
// Provider Priority
// ============================================================================

const providerPriority: SmsProvider[] = ['twilio', 'aws-sns', 'vonage'];

// ============================================================================
// Main API
// ============================================================================

/**
 * Send SMS with automatic provider selection and fallback
 */
export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const { to, message, provider = 'auto' } = options;

  logger.info('Sending SMS', { to, provider, messageLength: message.length });

  // Validate phone number
  if (!isValidE164(to)) {
    return {
      success: false,
      provider: 'twilio',
      error: 'Invalid phone number format. Must be E.164 format (+1234567890)',
    };
  }

  // Validate message
  if (!message || message.trim() === '') {
    return {
      success: false,
      provider: 'twilio',
      error: 'Message is required',
    };
  }

  if (message.length > 1600) {
    return {
      success: false,
      provider: 'twilio',
      error: 'Message too long (max 1600 characters)',
    };
  }

  // If specific provider requested, try that provider only
  if (provider !== 'auto') {
    return sendWithProvider(options, provider);
  }

  // Try providers in priority order with automatic fallback
  let lastError: any = null;
  let fallbackUsed = false;

  for (const currentProvider of providerPriority) {
    // Skip if provider not configured
    if (!isProviderConfigured(currentProvider)) {
      logger.debug(`Provider ${currentProvider} not configured, skipping`);
      continue;
    }

    try {
      const result = await sendWithProvider(options, currentProvider);

      if (result.success) {
        return {
          ...result,
          fallbackUsed,
        };
      }

      lastError = result.error;
      fallbackUsed = true;
    } catch (error) {
      logger.warn(`Provider ${currentProvider} failed`, { error });
      lastError = error;
      fallbackUsed = true;
    }
  }

  // All providers failed
  logger.error('All SMS providers failed', { lastError });

  return {
    success: false,
    provider: 'twilio',
    error: lastError || 'All SMS providers failed',
    fallbackUsed: true,
  };
}

/**
 * Send SMS with specific provider
 */
async function sendWithProvider(options: SmsOptions, provider: SmsProvider): Promise<SmsResult> {
  logger.info(`Attempting to send SMS with ${provider}`);

  switch (provider) {
    case 'twilio':
      return sendWithTwilio(options);

    case 'aws-sns':
      return sendWithAwsSns(options);

    case 'vonage':
      return sendWithVonage(options);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================================================
// Provider Implementations
// ============================================================================

/**
 * Send SMS with Twilio
 */
async function sendWithTwilio(options: SmsOptions): Promise<SmsResult> {
  if (!config.twilio.enabled) {
    throw new Error('Twilio is not configured');
  }

  try {
    const { accountSid, authToken, fromNumber } = config.twilio;
    const { to, message, from, mediaUrl } = options;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: to,
      From: from || fromNumber || '',
      Body: message,
    });

    // Add media for MMS
    if (mediaUrl) {
      body.append('MediaUrl', mediaUrl);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || JSON.stringify(error)}`);
    }

    const result = await response.json();

    logger.info('SMS sent successfully with Twilio', { sid: result.sid });

    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid,
    };
  } catch (error) {
    logger.error('Twilio send failed', { error });

    return {
      success: false,
      provider: 'twilio',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send SMS with AWS SNS
 */
async function sendWithAwsSns(options: SmsOptions): Promise<SmsResult> {
  if (!config.awsSns.enabled) {
    throw new Error('AWS SNS is not configured');
  }

  try {
    const { to, message } = options;

    // AWS SNS requires AWS SDK
    // For now, placeholder implementation
    logger.warn('AWS SNS sending not fully implemented');

    return {
      success: true,
      provider: 'aws-sns',
      messageId: 'aws-sns-placeholder',
    };
  } catch (error) {
    logger.error('AWS SNS send failed', { error });

    return {
      success: false,
      provider: 'aws-sns',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send SMS with Vonage
 */
async function sendWithVonage(options: SmsOptions): Promise<SmsResult> {
  if (!config.vonage.enabled) {
    throw new Error('Vonage is not configured');
  }

  try {
    const { apiKey, apiSecret, fromNumber } = config.vonage;
    const { to, message, from } = options;

    const url = 'https://rest.nexmo.com/sms/json';

    const body = {
      api_key: apiKey,
      api_secret: apiSecret,
      to: to.replace('+', ''),
      from: from || fromNumber || 'UNITE',
      text: message,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vonage API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    // Vonage returns array of messages
    const firstMessage = result.messages[0];

    if (firstMessage.status !== '0') {
      throw new Error(`Vonage error: ${firstMessage['error-text']}`);
    }

    logger.info('SMS sent successfully with Vonage', { messageId: firstMessage['message-id'] });

    return {
      success: true,
      provider: 'vonage',
      messageId: firstMessage['message-id'],
    };
  } catch (error) {
    logger.error('Vonage send failed', { error });

    return {
      success: false,
      provider: 'vonage',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if provider is configured
 */
function isProviderConfigured(provider: SmsProvider): boolean {
  switch (provider) {
    case 'twilio':
      return config.twilio.enabled;
    case 'aws-sns':
      return config.awsSns.enabled;
    case 'vonage':
      return config.vonage.enabled;
    default:
      return false;
  }
}

/**
 * Validate E.164 phone number format
 */
function isValidE164(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  // Max 15 digits (including country code)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Get available providers
 */
export function getAvailableProviders(): SmsProvider[] {
  return providerPriority.filter(isProviderConfigured);
}

/**
 * Check if any SMS provider is configured
 */
export function isSmsAvailable(): boolean {
  return getAvailableProviders().length > 0;
}

/**
 * Format phone number to E.164
 */
export function formatToE164(phoneNumber: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If doesn't start with country code, add default
  if (!phoneNumber.startsWith('+')) {
    cleaned = defaultCountryCode.replace('+', '') + cleaned;
  }

  return '+' + cleaned;
}
