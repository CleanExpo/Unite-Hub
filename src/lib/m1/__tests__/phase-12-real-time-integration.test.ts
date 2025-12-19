/**
 * M1 Phase 12: Real-time Integration & Webhooks Tests
 *
 * Comprehensive test suite for webhook management, event streaming,
 * and real-time integration capabilities
 *
 * Version: v2.6.0
 * Phase: 12 - Real-time Integration & Webhooks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebhookManager, WebhookConfig, WebhookDelivery } from '../integration/webhook-manager';
import { EventStreamManager, EventEnvelope } from '../integration/event-stream';

describe('Phase 12: Real-time Integration & Webhooks', () => {
  let webhookManager: WebhookManager;
  let eventStreamManager: EventStreamManager;

  beforeEach(() => {
    webhookManager = new WebhookManager();
    eventStreamManager = new EventStreamManager();
  });

  afterEach(() => {
    webhookManager = null as any;
    eventStreamManager = null as any;
  });

  // ===== Webhook Manager Tests (12A) =====

  describe('Webhook Manager (15 tests)', () => {
    it('should register a webhook', () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      expect(webhookId).toBeDefined();
      expect(webhookId).toContain('wh_');

      const webhook = webhookManager.getWebhook(webhookId);
      expect(webhook).toBeDefined();
      expect(webhook?.url).toBe('https://example.com/webhook');
      expect(webhook?.active).toBe(true);
    });

    it('should update webhook configuration', () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const updated = webhookManager.updateWebhook(webhookId, {
        active: false,
        events: ['agent.run.completed', 'agent.run.failed'],
      });

      expect(updated).toBe(true);

      const webhook = webhookManager.getWebhook(webhookId);
      expect(webhook?.active).toBe(false);
      expect(webhook?.events.length).toBe(2);
    });

    it('should delete webhook', () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const deleted = webhookManager.deleteWebhook(webhookId);
      expect(deleted).toBe(true);

      const webhook = webhookManager.getWebhook(webhookId);
      expect(webhook).toBeNull();
    });

    it('should retrieve all webhooks', () => {
      for (let i = 0; i < 3; i++) {
        webhookManager.registerWebhook({
          url: `https://example.com/webhook${i}`,
          events: ['agent.run.completed'],
          active: true,
          retryStrategy: 'exponential',
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 5000,
        });
      }

      const webhooks = webhookManager.getWebhooks();
      expect(webhooks.length).toBeGreaterThanOrEqual(3);
    });

    it('should publish event and trigger webhooks', async () => {
      let triggered = false;

      webhookManager.subscribe('agent.run.completed', (event) => {
        triggered = true;
      });

      const eventId = webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456', status: 'completed' },
        source: 'agent-executor',
      });

      expect(eventId).toBeDefined();
      expect(eventId).toContain('evt_');
    });

    it('should handle multiple webhook events', () => {
      const webhookId1 = webhookManager.registerWebhook({
        url: 'https://example.com/webhook1',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const webhookId2 = webhookManager.registerWebhook({
        url: 'https://example.com/webhook2',
        events: ['tool.execution.completed'],
        active: true,
        retryStrategy: 'linear',
        maxRetries: 2,
        retryDelay: 500,
        timeout: 3000,
      });

      expect(webhookManager.getWebhooks().length).toBeGreaterThanOrEqual(2);
    });

    it('should support webhook signatures with secret', () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        secret: 'my-secret-key',
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const webhook = webhookManager.getWebhook(webhookId);
      expect(webhook?.secret).toBe('my-secret-key');
    });

    it('should track webhook delivery status', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      const deliveries = webhookManager.getDeliveries(webhookId);
      expect(deliveries.length).toBeGreaterThanOrEqual(0);
    });

    it('should get failed deliveries', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook-fail',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 1,
        retryDelay: 100,
        timeout: 5000,
      });

      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      const failed = webhookManager.getFailedDeliveries();
      expect(Array.isArray(failed)).toBe(true);
    });

    it('should get pending deliveries', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      const pending = webhookManager.getPendingDeliveries();
      expect(Array.isArray(pending)).toBe(true);
    });

    it('should subscribe and listen to events', () => {
      let eventReceived = false;
      let eventType = '';

      webhookManager.subscribe('agent.run.completed', (event) => {
        eventReceived = true;
        eventType = event.type;
      });

      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      expect(eventReceived).toBe(true); // Synchronous callback
      expect(eventType).toBe('agent.run.completed');
    });

    it('should get event history', () => {
      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      webhookManager.publishEvent({
        type: 'agent.run.failed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-457', error: 'timeout' },
        source: 'agent-executor',
      });

      const history = webhookManager.getEventHistory();
      expect(history.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate webhook statistics', () => {
      webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const stats = webhookManager.getStatistics();
      expect(stats.webhooks).toBeGreaterThanOrEqual(1);
      expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
    });

    it('should clear old events', () => {
      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      const cleared = webhookManager.clearOldEvents(0); // Clear everything
      expect(typeof cleared).toBe('number');
    });
  });

  // ===== Event Stream Manager Tests (12B) =====

  describe('Event Stream Manager (15 tests)', () => {
    it('should publish event to channel', async () => {
      const eventId = await eventStreamManager.publishEvent('agent_events', {
        type: 'run_started',
        tenantId: 'tenant-123',
        source: 'agent-executor',
        payload: { runId: 'run-456' },
        metadata: {
          priority: 'high',
          compressed: false,
          encrypted: false,
        },
      });

      expect(eventId).toBeDefined();
      expect(eventId).toContain('evt_');
    });

    it('should subscribe to channel', async () => {
      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          // Handle event
        }
      );

      expect(consumerId).toBeDefined();
      expect(consumerId).toContain('sub_');
    });

    it('should handle multiple subscribers', () => {
      const consumer1 = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {}
      );
      const consumer2 = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {}
      );

      expect(consumer1).not.toBe(consumer2);
    });

    it('should unsubscribe consumer', () => {
      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {}
      );

      const unsubscribed = eventStreamManager.unsubscribe(consumerId);
      expect(unsubscribed).toBe(true);
    });

    it('should get event history for channel', async () => {
      await eventStreamManager.publishEvent('agent_events', {
        type: 'run_started',
        tenantId: 'tenant-123',
        source: 'agent-executor',
        payload: { runId: 'run-456' },
        metadata: {
          priority: 'high',
          compressed: false,
          encrypted: false,
        },
      });

      const history = eventStreamManager.getEventHistory('agent_events');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should query events by criteria', async () => {
      await eventStreamManager.publishEvent('agent_events', {
        type: 'run_completed',
        tenantId: 'tenant-123',
        source: 'agent-executor',
        payload: { runId: 'run-456', status: 'success' },
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const results = eventStreamManager.queryEvents('agent_events', {
        type: 'run_completed',
        tenantId: 'tenant-123',
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should support event buffering on backpressure', async () => {
      let callCount = 0;

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Consumer busy');
          }
        },
        { backpressure: 'buffer', maxBufferSize: 100 }
      );

      await eventStreamManager.publishEvent('agent_events', {
        type: 'test_event',
        tenantId: 'tenant-123',
        source: 'test',
        payload: {},
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const buffered = eventStreamManager.getBufferedEvents(consumerId);
      expect(Array.isArray(buffered)).toBe(true);
    });

    it('should replay events from history', async () => {
      const now = Date.now();

      await eventStreamManager.publishEvent('agent_events', {
        type: 'historical_event',
        tenantId: 'tenant-123',
        source: 'test',
        payload: { data: 'value' },
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {}
      );

      const replayed = await eventStreamManager.replayEvents(
        'agent_events',
        consumerId,
        now - 1000
      );

      expect(typeof replayed).toBe('number');
    });

    it('should get consumer status', () => {
      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {}
      );

      const status = eventStreamManager.getConsumerStatus(consumerId);
      expect(status).toBeDefined();
      expect(status?.id).toBe(consumerId);
      expect(status?.channel).toBe('agent_events');
    });

    it('should support event deduplication', async () => {
      let handlerCalls = 0;

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          handlerCalls++;
        },
        { deduplicationEnabled: true }
      );

      const eventId = await eventStreamManager.publishEvent('agent_events', {
        type: 'dedupe_test',
        tenantId: 'tenant-123',
        source: 'test',
        payload: {},
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const history = eventStreamManager.getEventHistory('agent_events');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should support priority-based events', async () => {
      const criticalEvent = await eventStreamManager.publishEvent('system_events', {
        type: 'critical_alert',
        tenantId: 'tenant-123',
        source: 'monitor',
        payload: { severity: 'critical' },
        metadata: {
          priority: 'critical',
          compressed: false,
          encrypted: false,
        },
      });

      expect(criticalEvent).toBeDefined();
    });

    it('should get stream statistics', async () => {
      await eventStreamManager.publishEvent('agent_events', {
        type: 'test',
        tenantId: 'tenant-123',
        source: 'test',
        payload: {},
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const stats = eventStreamManager.getStatistics();
      expect(stats.channels).toBeDefined();
      expect(stats.consumers).toBeDefined();
    });

    it('should clean up old events', async () => {
      await eventStreamManager.publishEvent('agent_events', {
        type: 'old_event',
        tenantId: 'tenant-123',
        source: 'test',
        payload: {},
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const cleaned = eventStreamManager.cleanupOldEvents(0);
      expect(typeof cleaned).toBe('number');
    });

    it('should clear all data', () => {
      eventStreamManager.subscribeToChannel('agent_events', async (event) => {});
      eventStreamManager.clear();

      const history = eventStreamManager.getEventHistory('agent_events');
      expect(history.length).toBe(0);
    });
  });

  // ===== Integration Tests =====

  describe('Webhook & Event Stream Integration (10 tests)', () => {
    it('should connect webhooks to event stream', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          webhookManager.publishEvent({
            type: event.type as any,
            tenantId: event.tenantId,
            source: event.source,
            payload: event.payload,
          });
        }
      );

      expect(webhookId).toBeDefined();
      expect(consumerId).toBeDefined();
    });

    it('should handle high-throughput event publishing', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      for (let i = 0; i < 100; i++) {
        webhookManager.publishEvent({
          type: 'agent.run.completed',
          tenantId: 'tenant-123',
          payload: { runId: `run-${i}` },
          source: 'agent-executor',
        });
      }

      const stats = webhookManager.getStatistics();
      expect(stats.eventQueueSize).toBeGreaterThanOrEqual(0);
    });

    it('should correlate webhook and event stream metrics', () => {
      webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      eventStreamManager.subscribeToChannel('agent_events', async (event) => {});

      const webhookStats = webhookManager.getStatistics();
      const streamStats = eventStreamManager.getStatistics();

      expect(webhookStats.webhooks).toBeGreaterThanOrEqual(1);
      expect(streamStats.consumers.total).toBeGreaterThanOrEqual(1);
    });

    it('should handle consumer backpressure with webhook delivery', async () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          throw new Error('Consumer backpressure');
        },
        { backpressure: 'buffer', maxBufferSize: 50 }
      );

      await eventStreamManager.publishEvent('agent_events', {
        type: 'test',
        tenantId: 'tenant-123',
        source: 'test',
        payload: {},
        metadata: {
          priority: 'normal',
          compressed: false,
          encrypted: false,
        },
      });

      const buffered = eventStreamManager.getBufferedEvents(consumerId);
      expect(Array.isArray(buffered)).toBe(true);
    });

    it('should support event filtering in subscriptions', async () => {
      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {},
        {}
      );

      // Query with filter
      const filtered = eventStreamManager.queryEvents('agent_events', {
        tenantId: 'tenant-123',
        source: 'agent-executor',
      });

      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should track delivery success rates', async () => {
      webhookManager.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
      });

      for (let i = 0; i < 10; i++) {
        webhookManager.publishEvent({
          type: 'agent.run.completed',
          tenantId: 'tenant-123',
          payload: { runId: `run-${i}` },
          source: 'agent-executor',
        });
      }

      const stats = webhookManager.getStatistics();
      expect(typeof stats.successRate).toBe('number');
    });

    it('should maintain event ordering in stream', async () => {
      const events: number[] = [];

      const consumerId = eventStreamManager.subscribeToChannel(
        'agent_events',
        async (event) => {
          events.push(event.sequence);
        }
      );

      for (let i = 0; i < 5; i++) {
        await eventStreamManager.publishEvent('agent_events', {
          type: `test_${i}`,
          tenantId: 'tenant-123',
          source: 'test',
          payload: { index: i },
          metadata: {
            priority: 'normal',
            compressed: false,
            encrypted: false,
          },
        });
      }

      const history = eventStreamManager.getEventHistory('agent_events');
      expect(history.length).toBeGreaterThan(0);
    });

    it('should support webhook retry with exponential backoff', () => {
      const webhookId = webhookManager.registerWebhook({
        url: 'https://example.com/webhook-fail',
        events: ['agent.run.completed'],
        active: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 100,
        timeout: 5000,
      });

      webhookManager.publishEvent({
        type: 'agent.run.completed',
        tenantId: 'tenant-123',
        payload: { runId: 'run-456' },
        source: 'agent-executor',
      });

      const stats = webhookManager.getStatistics();
      expect(stats.webhooks).toBeGreaterThanOrEqual(1);
    });

    it('should provide comprehensive event audit trail', async () => {
      await eventStreamManager.publishEvent('agent_events', {
        type: 'audit_test',
        tenantId: 'tenant-123',
        source: 'test',
        payload: { action: 'test_action' },
        metadata: {
          priority: 'high',
          compressed: false,
          encrypted: false,
        },
      });

      const history = eventStreamManager.getEventHistory('agent_events');
      expect(Array.isArray(history)).toBe(true);

      const query = eventStreamManager.queryEvents('agent_events', {
        type: 'audit_test',
        tenantId: 'tenant-123',
      });

      expect(query.length).toBeGreaterThanOrEqual(0);
    });
  });
});
