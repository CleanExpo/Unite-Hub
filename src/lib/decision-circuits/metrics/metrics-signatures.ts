/**
 * Webhook Signature Verification Service
 * Supports: SendGrid, Resend, Meta (FB/IG), LinkedIn
 */

import crypto from 'crypto';
import {
  type MetricsProvider,
  type VerificationResult,
  PROVIDER_WEBHOOK_HEADERS,
} from './metrics-types';

/**
 * Verify webhook signature based on provider
 * Hard-fail on invalid signature
 */
export function verifyWebhookSignature(
  provider: MetricsProvider,
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): VerificationResult {
  const headerConfig = PROVIDER_WEBHOOK_HEADERS[provider];

  if (!headerConfig) {
    return {
      valid: false,
      provider,
      reason: `Unknown provider: ${provider}`,
    };
  }

  try {
    switch (provider) {
      case 'sendgrid':
        return verifySendGridSignature(headers, rawBody, secret);

      case 'resend':
        return verifyResendSignature(headers, rawBody, secret);

      case 'facebook':
      case 'instagram':
        return verifyMetaSignature(headers, rawBody, secret, provider);

      case 'linkedin':
        return verifyLinkedInSignature(headers, rawBody, secret);

      default:
        return {
          valid: false,
          provider,
          reason: `Unsupported provider: ${provider}`,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      provider,
      reason: `Signature verification error: ${message}`,
    };
  }
}

/**
 * SendGrid signature verification
 * Uses HMAC-SHA256 with timestamp
 */
function verifySendGridSignature(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): VerificationResult {
  const signature = headers['x-twilio-email-event-webhook-signature'];
  const timestamp = headers['x-twilio-email-event-webhook-timestamp'];

  if (!signature || !timestamp) {
    return {
      valid: false,
      provider: 'sendgrid',
      reason: 'Missing signature or timestamp header',
    };
  }

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const eventTime = parseInt(timestamp, 10);
  const timeDiff = Math.abs(now - eventTime);

  if (timeDiff > 300) {
    return {
      valid: false,
      provider: 'sendgrid',
      reason: `Timestamp outside 5-minute window (diff: ${timeDiff}s)`,
    };
  }

  // Compute expected signature
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + body)
    .digest('base64');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );

  return {
    valid: isValid,
    provider: 'sendgrid',
    reason: isValid ? undefined : 'Signature mismatch',
  };
}

/**
 * Resend signature verification
 * Uses Svix format (base64 + timestamp check)
 * Format: version,signature
 */
function verifyResendSignature(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): VerificationResult {
  const signature = headers['svix-signature'];
  const timestamp = headers['svix-timestamp'];
  const id = headers['svix-id'];

  if (!signature || !timestamp || !id) {
    return {
      valid: false,
      provider: 'resend',
      reason: 'Missing signature, timestamp, or id header',
    };
  }

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const eventTime = parseInt(timestamp, 10);
  const timeDiff = Math.abs(now - eventTime);

  if (timeDiff > 300) {
    return {
      valid: false,
      provider: 'resend',
      reason: `Timestamp outside 5-minute window (diff: ${timeDiff}s)`,
    };
  }

  // Compute expected signature
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const toSign = `${id}.${timestamp}.${body}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(toSign).digest('base64');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature.split(',')[0], 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );

  return {
    valid: isValid,
    provider: 'resend',
    reason: isValid ? undefined : 'Signature mismatch',
  };
}

/**
 * Meta (Facebook/Instagram) signature verification
 * Uses HMAC-SHA256 with app secret
 * Format: sha256=<signature>
 */
function verifyMetaSignature(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string,
  provider: 'facebook' | 'instagram'
): VerificationResult {
  const signature = headers['x-hub-signature-256'];

  if (!signature) {
    return {
      valid: false,
      provider,
      reason: 'Missing x-hub-signature-256 header',
    };
  }

  // Extract signature (format: sha256=<hash>)
  const [algorithm, providedSignature] = signature.split('=');

  if (algorithm !== 'sha256' || !providedSignature) {
    return {
      valid: false,
      provider,
      reason: 'Invalid signature format',
    };
  }

  // Compute expected signature
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(providedSignature, 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );

  return {
    valid: isValid,
    provider,
    reason: isValid ? undefined : 'Signature mismatch',
  };
}

/**
 * LinkedIn signature verification
 * Uses RSA-SHA256 public key verification (simplified)
 * Format: 48BitTimestamp.Base64EncodedSignature
 */
function verifyLinkedInSignature(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): VerificationResult {
  const signature = headers['x-linkedin-signature'];
  const timestamp = headers['x-linkedin-timestamp'];

  if (!signature || !timestamp) {
    return {
      valid: false,
      provider: 'linkedin',
      reason: 'Missing signature or timestamp header',
    };
  }

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const eventTime = parseInt(timestamp, 10);
  const timeDiff = Math.abs(now - eventTime);

  if (timeDiff > 300) {
    return {
      valid: false,
      provider: 'linkedin',
      reason: `Timestamp outside 5-minute window (diff: ${timeDiff}s)`,
    };
  }

  // LinkedIn uses HMAC-SHA256 with shared secret
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}${body}`)
    .digest('base64');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );

  return {
    valid: isValid,
    provider: 'linkedin',
    reason: isValid ? undefined : 'Signature mismatch',
  };
}

/**
 * Get provider webhook secret from environment
 * Secrets should be stored in .env.local or secrets manager
 */
export function getProviderSecret(provider: MetricsProvider): string | null {
  const secretMap: Record<MetricsProvider, string> = {
    sendgrid: process.env.SENDGRID_WEBHOOK_SECRET || '',
    resend: process.env.RESEND_WEBHOOK_SECRET || '',
    facebook: process.env.FACEBOOK_WEBHOOK_SECRET || '',
    instagram: process.env.INSTAGRAM_WEBHOOK_SECRET || '',
    linkedin: process.env.LINKEDIN_WEBHOOK_SECRET || '',
  };

  return secretMap[provider] || null;
}
