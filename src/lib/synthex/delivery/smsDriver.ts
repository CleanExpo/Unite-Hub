/**
 * SMS Driver for Synthex Delivery Engine
 * Phase: B6 - Synthex Outbound Delivery Engine
 *
 * Placeholder for SMS delivery (Twilio, MessageBird, etc.)
 * To be implemented with actual SMS API in future phase.
 */

// Types
export type SmsProvider = 'twilio' | 'messagebird' | 'nexmo' | 'plivo';

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
  provider?: SmsProvider;
  scheduledAt?: Date;
  mediaUrl?: string; // For MMS
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: SmsProvider;
  timestamp: Date;
  segments?: number; // Number of SMS segments
}

// SMS segment sizes
const SMS_SEGMENT_SIZE = 160;
const SMS_SEGMENT_SIZE_UNICODE = 70;

/**
 * Send SMS (placeholder)
 */
export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const timestamp = new Date();
  const provider = options.provider || 'twilio';

  console.log(`[SMS Driver] Placeholder: Would send SMS via ${provider}:`, {
    to: options.to,
    messageLength: options.message.length,
    segments: calculateSegments(options.message),
  });

  return {
    success: true,
    messageId: `placeholder-${provider}-${Date.now()}`,
    provider,
    timestamp,
    segments: calculateSegments(options.message),
  };
}

/**
 * Schedule an SMS (placeholder)
 */
export async function scheduleSms(
  options: SmsOptions & { scheduledAt: Date }
): Promise<SmsResult> {
  const timestamp = new Date();
  const provider = options.provider || 'twilio';

  console.log(
    `[SMS Driver] Placeholder: Would schedule SMS for ${options.scheduledAt.toISOString()}`
  );

  return {
    success: true,
    messageId: `scheduled-${provider}-${Date.now()}`,
    provider,
    timestamp,
    segments: calculateSegments(options.message),
  };
}

/**
 * Calculate number of SMS segments needed
 */
export function calculateSegments(message: string): number {
  // Check if message contains non-ASCII characters (requires Unicode encoding)
  const isUnicode = /[^\x00-\x7F]/.test(message);
  const segmentSize = isUnicode ? SMS_SEGMENT_SIZE_UNICODE : SMS_SEGMENT_SIZE;

  return Math.ceil(message.length / segmentSize);
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check for E.164 format or common formats
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number to E.164
 */
export function formatToE164(phone: string, defaultCountryCode: string = '+1'): string {
  // Remove formatting characters
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Add country code if missing
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

/**
 * Check if SMS driver is configured (placeholder)
 */
export function isSmsConfigured(provider?: SmsProvider): boolean {
  const defaultProvider = provider || 'twilio';

  const envKeys: Record<SmsProvider, string> = {
    twilio: 'TWILIO_AUTH_TOKEN',
    messagebird: 'MESSAGEBIRD_API_KEY',
    nexmo: 'NEXMO_API_KEY',
    plivo: 'PLIVO_AUTH_TOKEN',
  };

  return !!process.env[envKeys[defaultProvider]];
}

/**
 * Get SMS cost estimate (placeholder)
 */
export function estimateCost(message: string, quantity: number = 1): {
  segments: number;
  totalSegments: number;
  estimatedCost: number;
  currency: string;
} {
  const segments = calculateSegments(message);
  const totalSegments = segments * quantity;

  // Placeholder cost estimate (~$0.0075 per segment for Twilio)
  const costPerSegment = 0.0075;

  return {
    segments,
    totalSegments,
    estimatedCost: totalSegments * costPerSegment,
    currency: 'USD',
  };
}
