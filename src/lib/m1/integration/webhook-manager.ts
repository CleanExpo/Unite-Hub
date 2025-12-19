/**
 * M1 Webhook Manager
 *
 * Manages webhook registration, delivery, retry logic, and event streaming
 * Supports multiple delivery strategies with guaranteed delivery
 *
 * Version: v2.6.0
 * Phase: 12A - Real-time Integration & Webhooks
 */

export type WebhookEventType =
  | 'agent.run.started'
  | 'agent.run.completed'
  | 'agent.run.failed'
  | 'tool.execution.started'
  | 'tool.execution.completed'
  | 'tool.execution.failed'
  | 'policy.violation'
  | 'compliance.breach'
  | 'tenant.usage.exceeded'
  | 'role.assignment'
  | 'data.processed'
  | 'custom';

export type DeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'retrying'
  | 'abandoned';

export type RetryStrategy = 'exponential' | 'linear' | 'fixed';

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  secret?: string; // For HMAC signature verification
  active: boolean;
  retryStrategy: RetryStrategy;
  maxRetries: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
  createdAt: number;
  updatedAt: number;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  statusCode?: number;
  responseTime: number;
  retryCount: number;
  nextRetryAt?: number;
  error?: string;
  createdAt: number;
  deliveredAt?: number;
}

/**
 * Webhook event
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  tenantId: string;
  payload: Record<string, unknown>;
  source: string; // Component that triggered event
}

/**
 * Webhook Manager
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<WebhookEventType, Set<(event: WebhookEvent) => void>> = new Map();

  constructor() {
    this.initializeEventTypes();
  }

  /**
   * Initialize event type listeners
   */
  private initializeEventTypes(): void {
    const eventTypes: WebhookEventType[] = [
      'agent.run.started',
      'agent.run.completed',
      'agent.run.failed',
      'tool.execution.started',
      'tool.execution.completed',
      'tool.execution.failed',
      'policy.violation',
      'compliance.breach',
      'tenant.usage.exceeded',
      'role.assignment',
      'data.processed',
      'custom',
    ];

    for (const eventType of eventTypes) {
      this.eventListeners.set(eventType, new Set());
    }
  }

  /**
   * Register a webhook
   */
  registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const webhook: WebhookConfig = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.webhooks.set(id, webhook);
    return id;
  }

  /**
   * Get webhook
   */
  getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * Update webhook
   */
  updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
return false;
}

    Object.assign(webhook, updates, { updatedAt: Date.now() });
    this.webhooks.set(webhookId, webhook);
    return true;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): boolean {
    // Cancel any pending retries
    const timer = this.retryTimers.get(webhookId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(webhookId);
    }

    return this.webhooks.delete(webhookId);
  }

  /**
   * Get all webhooks for tenant
   */
  getWebhooks(tenantId?: string): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Publish event
   */
  publishEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): string {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const fullEvent: WebhookEvent = {
      id: eventId,
      timestamp: now,
      ...event,
    };

    this.eventQueue.push(fullEvent);

    // Trigger matching webhooks asynchronously
    this.triggerWebhooks(fullEvent);

    return eventId;
  }

  /**
   * Trigger webhooks for event
   */
  private triggerWebhooks(event: WebhookEvent): void {
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.active && w.events.includes(event.type)
    );

    for (const webhook of matchingWebhooks) {
      this.deliverEvent(webhook, event);
    }

    // Notify local listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  /**
   * Deliver event to webhook
   */
  private deliverEvent(webhook: WebhookConfig, event: WebhookEvent): void {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventType: event.type,
      payload: event.payload,
      status: 'pending',
      responseTime: 0,
      retryCount: 0,
      createdAt: Date.now(),
    };

    this.deliveries.set(deliveryId, delivery);

    // Attempt delivery
    this.attemptDelivery(delivery, webhook);
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(delivery: WebhookDelivery, webhook: WebhookConfig): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(webhook, delivery);

      if (response.success) {
        delivery.status = 'delivered';
        delivery.statusCode = response.statusCode;
        delivery.responseTime = Date.now() - startTime;
        delivery.deliveredAt = Date.now();
      } else {
        this.scheduleRetry(delivery, webhook);
      }
    } catch (error) {
      delivery.error = error instanceof Error ? error.message : String(error);
      this.scheduleRetry(delivery, webhook);
    }

    this.deliveries.set(delivery.id, delivery);
  }

  /**
   * Make HTTP request to webhook
   */
  private async makeRequest(
    webhook: WebhookConfig,
    delivery: WebhookDelivery
  ): Promise<{ success: boolean; statusCode?: number }> {
    // In production: use actual HTTP client
    // This is a mock implementation for testing
    const payload = JSON.stringify({
      id: delivery.id,
      event: delivery.eventType,
      timestamp: Date.now(),
      data: delivery.payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'm1-webhook-client/1.0',
      ...(webhook.headers || {}),
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payload)
        .digest('hex');
      headers['X-M1-Signature'] = signature;
    }

    // Mock response based on URL pattern
    return {
      success: !webhook.url.includes('fail'),
      statusCode: 200,
    };
  }

  /**
   * Schedule retry for failed delivery
   */
  private scheduleRetry(delivery: WebhookDelivery, webhook: WebhookConfig): void {
    if (delivery.retryCount >= webhook.maxRetries) {
      delivery.status = 'abandoned';
      return;
    }

    delivery.retryCount++;
    delivery.status = 'retrying';

    let delay: number;
    switch (webhook.retryStrategy) {
      case 'exponential':
        delay = webhook.retryDelay * Math.pow(2, delivery.retryCount - 1);
        break;
      case 'linear':
        delay = webhook.retryDelay * delivery.retryCount;
        break;
      case 'fixed':
      default:
        delay = webhook.retryDelay;
    }

    delivery.nextRetryAt = Date.now() + delay;

    const timer = setTimeout(() => {
      const retryWebhook = this.webhooks.get(webhook.id);
      if (retryWebhook) {
        this.attemptDelivery(delivery, retryWebhook);
      }
    }, delay);

    this.retryTimers.set(`${delivery.id}_${delivery.retryCount}`, timer);
  }

  /**
   * Get delivery status
   */
  getDelivery(deliveryId: string): WebhookDelivery | null {
    return this.deliveries.get(deliveryId) || null;
  }

  /**
   * Get deliveries for webhook
   */
  getDeliveries(webhookId: string, limit: number = 100): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter((d) => d.webhookId === webhookId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get failed deliveries
   */
  getFailedDeliveries(limit: number = 100): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter((d) => d.status === 'failed' || d.status === 'abandoned')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get pending deliveries
   */
  getPendingDeliveries(limit: number = 100): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter((d) => d.status === 'pending' || d.status === 'retrying')
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, limit);
  }

  /**
   * Subscribe to event type
   */
  subscribe(eventType: WebhookEventType, listener: (event: WebhookEvent) => void): () => void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
    }

    // Return unsubscribe function
    return () => {
      listeners?.delete(listener);
    };
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: WebhookEventType, limit: number = 100): WebhookEvent[] {
    let events = this.eventQueue;

    if (eventType) {
      events = events.filter((e) => e.type === eventType);
    }

    return events.slice(-limit);
  }

  /**
   * Get webhook statistics
   */
  getStatistics(): Record<string, unknown> {
    const deliveries = Array.from(this.deliveries.values());

    const delivered = deliveries.filter((d) => d.status === 'delivered').length;
    const failed = deliveries.filter((d) => d.status === 'failed' || d.status === 'abandoned')
      .length;
    const pending = deliveries.filter((d) => d.status === 'pending' || d.status === 'retrying')
      .length;

    const avgResponseTime =
      deliveries.length > 0
        ? deliveries.reduce((sum, d) => sum + d.responseTime, 0) / deliveries.length
        : 0;

    return {
      webhooks: this.webhooks.size,
      totalDeliveries: deliveries.length,
      delivered,
      failed,
      pending,
      avgResponseTime,
      successRate: deliveries.length > 0 ? (delivered / deliveries.length) * 100 : 0,
      eventQueueSize: this.eventQueue.length,
    };
  }

  /**
   * Clear old events from queue
   */
  clearOldEvents(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    const initialLength = this.eventQueue.length;

    this.eventQueue = this.eventQueue.filter((e) => e.timestamp > cutoff);

    return initialLength - this.eventQueue.length;
  }

  /**
   * Cleanup completed deliveries
   */
  cleanupCompletedDeliveries(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [id, delivery] of this.deliveries.entries()) {
      if (
        (delivery.status === 'delivered' || delivery.status === 'abandoned') &&
        delivery.createdAt < cutoff
      ) {
        this.deliveries.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

// Export singleton
export const webhookManager = new WebhookManager();
