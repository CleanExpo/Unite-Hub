/**
 * Webhook Replay Prevention System
 *
 * Prevents duplicate webhook processing using Redis-based deduplication.
 * Falls back to in-memory storage for development environments.
 *
 * Features:
 * - 24-hour TTL for processed webhook IDs
 * - Source-scoped to prevent collisions (stripe, whatsapp, etc.)
 * - Atomic check-and-mark operation
 * - Redis or in-memory fallback
 *
 * Usage:
 * ```typescript
 * import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';
 *
 * // In your webhook handler
 * const { processed } = await checkAndMarkWebhook(event.id, 'stripe');
 * if (processed) {
 *   return NextResponse.json({ received: true, status: 'already_processed' });
 * }
 * // ... process webhook
 * ```
 */

import { getRedisClient } from '@/lib/redis';

const WEBHOOK_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const REDIS_KEY_PREFIX = 'webhook:replay:';

/**
 * Generate Redis key for a webhook
 */
function getWebhookKey(webhookId: string, source: string): string {
  return `${REDIS_KEY_PREFIX}${source}:${webhookId}`;
}

/**
 * Check if a webhook has already been processed
 *
 * @param webhookId - Unique webhook identifier (e.g., Stripe event ID, WhatsApp message ID)
 * @param source - Webhook source (e.g., 'stripe', 'whatsapp', 'stripe-managed')
 * @returns true if webhook was already processed, false if new
 */
export async function isWebhookProcessed(
  webhookId: string,
  source: string
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const key = getWebhookKey(webhookId, source);

    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Error checking webhook replay status:', error);
    // On error, allow processing to avoid blocking legitimate webhooks
    return false;
  }
}

/**
 * Mark a webhook as processed
 *
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source
 */
export async function markWebhookProcessed(
  webhookId: string,
  source: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = getWebhookKey(webhookId, source);

    // Store webhook ID with 24-hour TTL
    await redis.set(key, new Date().toISOString(), 'EX', WEBHOOK_TTL_SECONDS);
  } catch (error) {
    console.error('Error marking webhook as processed:', error);
    // Non-fatal: continue even if marking fails
  }
}

/**
 * Atomic check-and-mark operation for webhook processing
 *
 * This is the recommended method as it combines checking and marking
 * in a single operation, reducing race conditions.
 *
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source
 * @returns Object with processed status
 *
 * @example
 * ```typescript
 * const { processed } = await checkAndMarkWebhook(event.id, 'stripe');
 * if (processed) {
 *   console.log('Webhook already processed, skipping');
 *   return NextResponse.json({ received: true, status: 'already_processed' });
 * }
 *
 * // Process webhook...
 * ```
 */
export async function checkAndMarkWebhook(
  webhookId: string,
  source: string
): Promise<{ processed: boolean }> {
  try {
    const redis = getRedisClient();
    const key = getWebhookKey(webhookId, source);

    // Use SET NX (set if not exists) for atomic check-and-set
    // Returns 'OK' if key was set, null if key already existed
    const result = await redis.set(
      key,
      new Date().toISOString(),
      'EX',
      WEBHOOK_TTL_SECONDS,
      'NX' // Only set if key doesn't exist
    );

    // If result is null, key already existed (webhook was processed)
    const wasProcessed = result === null;

    return { processed: wasProcessed };
  } catch (error) {
    console.error('Error in checkAndMarkWebhook:', error);
    // On error, assume not processed to avoid blocking legitimate webhooks
    return { processed: false };
  }
}

/**
 * Get when a webhook was processed (for debugging)
 *
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source
 * @returns ISO timestamp when webhook was processed, or null if not found
 */
export async function getWebhookProcessedAt(
  webhookId: string,
  source: string
): Promise<string | null> {
  try {
    const redis = getRedisClient();
    const key = getWebhookKey(webhookId, source);

    const timestamp = await redis.get(key);
    return timestamp;
  } catch (error) {
    console.error('Error getting webhook processed timestamp:', error);
    return null;
  }
}

/**
 * Get TTL (time to live) for a processed webhook in seconds
 *
 * @param webhookId - Unique webhook identifier
 * @param source - Webhook source
 * @returns Remaining TTL in seconds, or -2 if key doesn't exist
 */
export async function getWebhookTTL(
  webhookId: string,
  source: string
): Promise<number> {
  try {
    const redis = getRedisClient();
    const key = getWebhookKey(webhookId, source);

    const ttl = await redis.ttl(key);
    return ttl;
  } catch (error) {
    console.error('Error getting webhook TTL:', error);
    return -2; // Key doesn't exist
  }
}

/**
 * Clear all processed webhooks for a source (admin/testing only)
 *
 * ⚠️ WARNING: This should only be used for testing/debugging
 *
 * @param source - Webhook source to clear
 * @returns Number of webhooks cleared
 */
export async function clearProcessedWebhooks(source: string): Promise<number> {
  try {
    const redis = getRedisClient();
    const pattern = `${REDIS_KEY_PREFIX}${source}:*`;

    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    const deleted = await redis.del(...keys);
    return deleted;
  } catch (error) {
    console.error('Error clearing processed webhooks:', error);
    return 0;
  }
}

/**
 * Get statistics for webhook replay prevention
 *
 * @param source - Optional webhook source to filter by
 * @returns Statistics object
 */
export async function getWebhookStats(source?: string): Promise<{
  totalProcessed: number;
  bySource: Record<string, number>;
}> {
  try {
    const redis = getRedisClient();
    const pattern = source
      ? `${REDIS_KEY_PREFIX}${source}:*`
      : `${REDIS_KEY_PREFIX}*`;

    const keys = await redis.keys(pattern);

    // Count by source
    const bySource: Record<string, number> = {};
    for (const key of keys) {
      // Extract source from key: webhook:replay:SOURCE:id
      const parts = key.split(':');
      if (parts.length >= 3) {
        const keySource = parts[2];
        bySource[keySource] = (bySource[keySource] || 0) + 1;
      }
    }

    return {
      totalProcessed: keys.length,
      bySource,
    };
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    return {
      totalProcessed: 0,
      bySource: {},
    };
  }
}
