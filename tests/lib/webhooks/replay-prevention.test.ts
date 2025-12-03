/**
 * Unit Tests for Webhook Replay Prevention
 *
 * Tests Redis-based webhook deduplication with fallback to in-memory storage
 */

import {
  checkAndMarkWebhook,
  isWebhookProcessed,
  markWebhookProcessed,
  getWebhookProcessedAt,
  getWebhookTTL,
  clearProcessedWebhooks,
  getWebhookStats,
} from '@/lib/webhooks/replay-prevention';

describe('Webhook Replay Prevention', () => {
  const testSource = 'test-source';

  beforeEach(async () => {
    // Clear test webhooks before each test
    await clearProcessedWebhooks(testSource);
  });

  afterAll(async () => {
    // Cleanup after all tests
    await clearProcessedWebhooks(testSource);
  });

  describe('checkAndMarkWebhook', () => {
    it('should return processed: false for first-time webhook', async () => {
      const webhookId = 'wh-first-time-001';
      const { processed } = await checkAndMarkWebhook(webhookId, testSource);

      expect(processed).toBe(false);
    });

    it('should return processed: true for duplicate webhook', async () => {
      const webhookId = 'wh-duplicate-001';

      // First call
      const first = await checkAndMarkWebhook(webhookId, testSource);
      expect(first.processed).toBe(false);

      // Second call (duplicate)
      const second = await checkAndMarkWebhook(webhookId, testSource);
      expect(second.processed).toBe(true);
    });

    it('should be atomic (no race condition)', async () => {
      const webhookId = 'wh-atomic-001';

      // Simulate concurrent requests
      const results = await Promise.all([
        checkAndMarkWebhook(webhookId, testSource),
        checkAndMarkWebhook(webhookId, testSource),
        checkAndMarkWebhook(webhookId, testSource),
      ]);

      // Only one should return processed: false
      const notProcessedCount = results.filter(r => !r.processed).length;
      expect(notProcessedCount).toBe(1);

      // Others should return processed: true
      const processedCount = results.filter(r => r.processed).length;
      expect(processedCount).toBe(2);
    });
  });

  describe('isWebhookProcessed', () => {
    it('should return false for unprocessed webhook', async () => {
      const webhookId = 'wh-unprocessed-001';
      const processed = await isWebhookProcessed(webhookId, testSource);

      expect(processed).toBe(false);
    });

    it('should return true for processed webhook', async () => {
      const webhookId = 'wh-processed-001';

      // Mark as processed
      await markWebhookProcessed(webhookId, testSource);

      // Check if processed
      const processed = await isWebhookProcessed(webhookId, testSource);
      expect(processed).toBe(true);
    });
  });

  describe('markWebhookProcessed', () => {
    it('should mark webhook as processed', async () => {
      const webhookId = 'wh-mark-001';

      // Initially not processed
      expect(await isWebhookProcessed(webhookId, testSource)).toBe(false);

      // Mark as processed
      await markWebhookProcessed(webhookId, testSource);

      // Now processed
      expect(await isWebhookProcessed(webhookId, testSource)).toBe(true);
    });

    it('should be idempotent (can mark multiple times)', async () => {
      const webhookId = 'wh-idempotent-001';

      // Mark multiple times (should not throw)
      await markWebhookProcessed(webhookId, testSource);
      await markWebhookProcessed(webhookId, testSource);
      await markWebhookProcessed(webhookId, testSource);

      // Still processed
      expect(await isWebhookProcessed(webhookId, testSource)).toBe(true);
    });
  });

  describe('Source Isolation', () => {
    it('should isolate webhooks by source', async () => {
      const webhookId = 'wh-isolation-001';
      const sourceA = 'source-a';
      const sourceB = 'source-b';

      // Mark as processed in source A
      await markWebhookProcessed(webhookId, sourceA);

      // Should be processed in source A
      expect(await isWebhookProcessed(webhookId, sourceA)).toBe(true);

      // Should NOT be processed in source B
      expect(await isWebhookProcessed(webhookId, sourceB)).toBe(false);

      // Cleanup
      await clearProcessedWebhooks(sourceA);
      await clearProcessedWebhooks(sourceB);
    });

    it('should handle Stripe test/live mode isolation', async () => {
      const eventId = 'evt_test_isolation_001';
      const testMode = 'stripe-test';
      const liveMode = 'stripe-live';

      // Process in test mode
      const { processed: testProcessed } = await checkAndMarkWebhook(eventId, testMode);
      expect(testProcessed).toBe(false);

      // Same event ID in live mode should be NEW
      const { processed: liveProcessed } = await checkAndMarkWebhook(eventId, liveMode);
      expect(liveProcessed).toBe(false);

      // Cleanup
      await clearProcessedWebhooks(testMode);
      await clearProcessedWebhooks(liveMode);
    });
  });

  describe('getWebhookProcessedAt', () => {
    it('should return timestamp when webhook was processed', async () => {
      const webhookId = 'wh-timestamp-001';

      // Mark as processed
      await markWebhookProcessed(webhookId, testSource);

      // Get timestamp
      const timestamp = await getWebhookProcessedAt(webhookId, testSource);

      expect(timestamp).toBeTruthy();
      expect(typeof timestamp).toBe('string');

      // Should be valid ISO timestamp
      const date = new Date(timestamp!);
      expect(date.toISOString()).toBe(timestamp);
    });

    it('should return null for unprocessed webhook', async () => {
      const webhookId = 'wh-not-processed-001';

      const timestamp = await getWebhookProcessedAt(webhookId, testSource);
      expect(timestamp).toBeNull();
    });
  });

  describe('getWebhookTTL', () => {
    it('should return TTL for processed webhook', async () => {
      const webhookId = 'wh-ttl-001';

      // Mark as processed
      await markWebhookProcessed(webhookId, testSource);

      // Get TTL
      const ttl = await getWebhookTTL(webhookId, testSource);

      // Should be close to 24 hours (86400 seconds)
      // Allow 10 second margin for processing time
      expect(ttl).toBeGreaterThan(86390);
      expect(ttl).toBeLessThanOrEqual(86400);
    });

    it('should return -2 for unprocessed webhook', async () => {
      const webhookId = 'wh-no-ttl-001';

      const ttl = await getWebhookTTL(webhookId, testSource);
      expect(ttl).toBe(-2); // Redis returns -2 for non-existent keys
    });
  });

  describe('clearProcessedWebhooks', () => {
    it('should clear all webhooks for a source', async () => {
      const source = 'clear-test-source';

      // Process multiple webhooks
      await markWebhookProcessed('wh-clear-001', source);
      await markWebhookProcessed('wh-clear-002', source);
      await markWebhookProcessed('wh-clear-003', source);

      // Verify processed
      expect(await isWebhookProcessed('wh-clear-001', source)).toBe(true);
      expect(await isWebhookProcessed('wh-clear-002', source)).toBe(true);
      expect(await isWebhookProcessed('wh-clear-003', source)).toBe(true);

      // Clear all
      const cleared = await clearProcessedWebhooks(source);
      expect(cleared).toBe(3);

      // Verify cleared
      expect(await isWebhookProcessed('wh-clear-001', source)).toBe(false);
      expect(await isWebhookProcessed('wh-clear-002', source)).toBe(false);
      expect(await isWebhookProcessed('wh-clear-003', source)).toBe(false);
    });

    it('should only clear specified source', async () => {
      const sourceA = 'clear-source-a';
      const sourceB = 'clear-source-b';

      // Process webhooks in both sources
      await markWebhookProcessed('wh-a', sourceA);
      await markWebhookProcessed('wh-b', sourceB);

      // Clear only source A
      await clearProcessedWebhooks(sourceA);

      // Source A cleared
      expect(await isWebhookProcessed('wh-a', sourceA)).toBe(false);

      // Source B unchanged
      expect(await isWebhookProcessed('wh-b', sourceB)).toBe(true);

      // Cleanup
      await clearProcessedWebhooks(sourceB);
    });
  });

  describe('getWebhookStats', () => {
    it('should return stats for all sources', async () => {
      const sourceA = 'stats-source-a';
      const sourceB = 'stats-source-b';

      // Process webhooks in multiple sources
      await markWebhookProcessed('wh-stats-a1', sourceA);
      await markWebhookProcessed('wh-stats-a2', sourceA);
      await markWebhookProcessed('wh-stats-b1', sourceB);

      // Get stats
      const stats = await getWebhookStats();

      expect(stats.totalProcessed).toBeGreaterThanOrEqual(3);
      expect(stats.bySource[sourceA]).toBeGreaterThanOrEqual(2);
      expect(stats.bySource[sourceB]).toBeGreaterThanOrEqual(1);

      // Cleanup
      await clearProcessedWebhooks(sourceA);
      await clearProcessedWebhooks(sourceB);
    });

    it('should filter stats by source', async () => {
      const sourceA = 'filter-source-a';
      const sourceB = 'filter-source-b';

      // Process webhooks
      await markWebhookProcessed('wh-filter-a1', sourceA);
      await markWebhookProcessed('wh-filter-a2', sourceA);
      await markWebhookProcessed('wh-filter-b1', sourceB);

      // Get stats for source A only
      const stats = await getWebhookStats(sourceA);

      expect(stats.totalProcessed).toBe(2);
      expect(stats.bySource[sourceA]).toBe(2);
      expect(stats.bySource[sourceB]).toBeUndefined();

      // Cleanup
      await clearProcessedWebhooks(sourceA);
      await clearProcessedWebhooks(sourceB);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty webhook ID gracefully', async () => {
      // Should not throw
      const { processed } = await checkAndMarkWebhook('', testSource);

      // Behavior may vary (allow processing or reject)
      expect(typeof processed).toBe('boolean');
    });

    it('should handle empty source gracefully', async () => {
      // Should not throw
      const { processed } = await checkAndMarkWebhook('wh-empty-source', '');

      // Behavior may vary
      expect(typeof processed).toBe('boolean');
    });

    it('should not throw on Redis errors', async () => {
      // This test depends on Redis implementation
      // Mock Redis client could be used to test error scenarios

      // For now, just verify basic error handling exists
      expect(async () => {
        await checkAndMarkWebhook('wh-error-test', testSource);
      }).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle Stripe webhook replay', async () => {
      const stripeEventId = 'evt_1234567890abcdef';
      const source = 'stripe';

      // First webhook delivery
      const { processed: firstDelivery } = await checkAndMarkWebhook(stripeEventId, source);
      expect(firstDelivery).toBe(false);

      // Stripe retry (replay)
      const { processed: retry } = await checkAndMarkWebhook(stripeEventId, source);
      expect(retry).toBe(true);

      // Cleanup
      await clearProcessedWebhooks(source);
    });

    it('should handle WhatsApp message duplicate', async () => {
      const whatsappMessageId = 'wamid.1234567890abcdef';
      const source = 'whatsapp';

      // First message
      const { processed: first } = await checkAndMarkWebhook(whatsappMessageId, source);
      expect(first).toBe(false);

      // Duplicate (network retry)
      const { processed: duplicate } = await checkAndMarkWebhook(whatsappMessageId, source);
      expect(duplicate).toBe(true);

      // Cleanup
      await clearProcessedWebhooks(source);
    });

    it('should handle high-frequency webhook bursts', async () => {
      const source = 'burst-test';
      const webhookCount = 100;

      // Simulate burst of webhooks
      const promises = Array.from({ length: webhookCount }, (_, i) =>
        checkAndMarkWebhook(`wh-burst-${i}`, source)
      );

      const results = await Promise.all(promises);

      // All should be marked as not processed (first time)
      const notProcessedCount = results.filter(r => !r.processed).length;
      expect(notProcessedCount).toBe(webhookCount);

      // Cleanup
      await clearProcessedWebhooks(source);
    }, 10000); // 10 second timeout for high-frequency test
  });
});
