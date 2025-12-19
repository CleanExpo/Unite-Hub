/**
 * M1 Event Streaming System
 *
 * Real-time event streaming with pub/sub, backpressure, and event replay
 * Supports event ordering, deduplication, and filtering
 *
 * Version: v2.6.0
 * Phase: 12B - Real-time Event Streaming
 */

export type EventChannel =
  | 'agent_events'
  | 'tool_events'
  | 'policy_events'
  | 'compliance_events'
  | 'system_events'
  | 'custom';

export type BackpressureStrategy = 'drop' | 'buffer' | 'pause';

/**
 * Event envelope with metadata
 */
export interface EventEnvelope {
  id: string;
  channel: EventChannel;
  type: string;
  timestamp: number;
  sequence: number; // For ordering guarantee
  tenantId: string;
  source: string;
  correlationId?: string; // For tracing
  payload: Record<string, unknown>;
  metadata: {
    priority: 'critical' | 'high' | 'normal' | 'low';
    compressed: boolean;
    encrypted: boolean;
    retentionMs?: number;
  };
}

/**
 * Event consumer/subscriber
 */
export interface EventConsumer {
  id: string;
  channel: EventChannel;
  filter?: (event: EventEnvelope) => boolean;
  handler: (event: EventEnvelope) => Promise<void>;
  options: {
    startFrom?: 'latest' | 'oldest' | number; // timestamp or 'latest'/'oldest'
    backpressure: BackpressureStrategy;
    maxBufferSize: number;
    deduplicationEnabled: boolean;
  };
}

/**
 * Event Stream Manager
 */
export class EventStreamManager {
  private eventLog: Map<EventChannel, EventEnvelope[]> = new Map();
  private consumers: Map<string, EventConsumer> = new Map();
  private sequences: Map<EventChannel, number> = new Map();
  private processedEvents: Set<string> = new Set(); // For deduplication
  private buffers: Map<string, EventEnvelope[]> = new Map();
  private paused: Set<string> = new Set();

  constructor() {
    this.initializeChannels();
  }

  /**
   * Initialize event channels
   */
  private initializeChannels(): void {
    const channels: EventChannel[] = [
      'agent_events',
      'tool_events',
      'policy_events',
      'compliance_events',
      'system_events',
      'custom',
    ];

    for (const channel of channels) {
      this.eventLog.set(channel, []);
      this.sequences.set(channel, 0);
    }
  }

  /**
   * Publish event to channel
   */
  async publishEvent(
    channel: EventChannel,
    event: Omit<EventEnvelope, 'id' | 'timestamp' | 'sequence'>
  ): Promise<string> {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sequence = (this.sequences.get(channel) || 0) + 1;
    this.sequences.set(channel, sequence);

    const envelope: EventEnvelope = {
      id,
      channel,
      timestamp: Date.now(),
      sequence,
      ...event,
    };

    // Store in event log
    const log = this.eventLog.get(channel) || [];
    log.push(envelope);
    this.eventLog.set(channel, log);

    // Deliver to consumers
    await this.deliverToConsumers(envelope);

    return id;
  }

  /**
   * Subscribe to channel
   */
  subscribeToChannel(
    channel: EventChannel,
    handler: (event: EventEnvelope) => Promise<void>,
    options?: Partial<EventConsumer['options']>
  ): string {
    const consumerId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const consumer: EventConsumer = {
      id: consumerId,
      channel,
      handler,
      options: {
        startFrom: 'latest',
        backpressure: 'buffer',
        maxBufferSize: 1000,
        deduplicationEnabled: true,
        ...options,
      },
    };

    this.consumers.set(consumerId, consumer);
    this.buffers.set(consumerId, []);

    return consumerId;
  }

  /**
   * Unsubscribe consumer
   */
  unsubscribe(consumerId: string): boolean {
    this.buffers.delete(consumerId);
    this.paused.delete(consumerId);
    return this.consumers.delete(consumerId);
  }

  /**
   * Deliver event to consumers
   */
  private async deliverToConsumers(envelope: EventEnvelope): Promise<void> {
    const consumers = Array.from(this.consumers.values()).filter(
      (c) => c.channel === envelope.channel
    );

    for (const consumer of consumers) {
      // Check filter
      if (consumer.filter && !consumer.filter(envelope)) {
        continue;
      }

      // Check deduplication
      if (consumer.options.deduplicationEnabled && this.processedEvents.has(envelope.id)) {
        continue;
      }

      // Handle backpressure
      if (this.paused.has(consumer.id)) {
        if (consumer.options.backpressure === 'drop') {
          continue;
        } else if (consumer.options.backpressure === 'buffer') {
          const buffer = this.buffers.get(consumer.id) || [];
          if (buffer.length < consumer.options.maxBufferSize) {
            buffer.push(envelope);
            this.buffers.set(consumer.id, buffer);
          }
          continue;
        }
      }

      try {
        await consumer.handler(envelope);
        this.processedEvents.add(envelope.id);
      } catch (error) {
        // Handle consumer error
        if (consumer.options.backpressure === 'buffer') {
          const buffer = this.buffers.get(consumer.id) || [];
          if (buffer.length < consumer.options.maxBufferSize) {
            buffer.push(envelope);
            this.buffers.set(consumer.id, buffer);
            this.paused.add(consumer.id);
          }
        }
      }
    }
  }

  /**
   * Resume paused consumer with backlog processing
   */
  async resumeConsumer(consumerId: string): Promise<number> {
    const buffer = this.buffers.get(consumerId) || [];
    const consumer = this.consumers.get(consumerId);

    if (!consumer) {
      return 0;
    }

    this.paused.delete(consumerId);
    let processed = 0;

    while (buffer.length > 0) {
      const envelope = buffer.shift()!;

      try {
        await consumer.handler(envelope);
        this.processedEvents.add(envelope.id);
        processed++;
      } catch (error) {
        // Put back in buffer on error
        buffer.unshift(envelope);
        this.paused.add(consumerId);
        break;
      }
    }

    this.buffers.set(consumerId, buffer);
    return processed;
  }

  /**
   * Get buffered events for consumer
   */
  getBufferedEvents(consumerId: string): EventEnvelope[] {
    return this.buffers.get(consumerId) || [];
  }

  /**
   * Replay events from history
   */
  async replayEvents(
    channel: EventChannel,
    consumerId: string,
    startTime?: number,
    endTime?: number
  ): Promise<number> {
    const log = this.eventLog.get(channel) || [];
    const consumer = this.consumers.get(consumerId);

    if (!consumer) {
      return 0;
    }

    let replayed = 0;

    for (const envelope of log) {
      const withinRange =
        (!startTime || envelope.timestamp >= startTime) &&
        (!endTime || envelope.timestamp <= endTime);

      if (!withinRange) {
        continue;
      }

      if (consumer.filter && !consumer.filter(envelope)) {
        continue;
      }

      try {
        await consumer.handler(envelope);
        replayed++;
      } catch (error) {
        // Continue on error during replay
      }
    }

    return replayed;
  }

  /**
   * Get event history for channel
   */
  getEventHistory(channel: EventChannel, limit: number = 100): EventEnvelope[] {
    const log = this.eventLog.get(channel) || [];
    return log.slice(-limit);
  }

  /**
   * Query events by criteria
   */
  queryEvents(
    channel: EventChannel,
    criteria: {
      type?: string;
      tenantId?: string;
      source?: string;
      startTime?: number;
      endTime?: number;
      priority?: string;
    }
  ): EventEnvelope[] {
    const log = this.eventLog.get(channel) || [];

    return log.filter((e) => {
      if (criteria.type && e.type !== criteria.type) {
return false;
}
      if (criteria.tenantId && e.tenantId !== criteria.tenantId) {
return false;
}
      if (criteria.source && e.source !== criteria.source) {
return false;
}
      if (criteria.startTime && e.timestamp < criteria.startTime) {
return false;
}
      if (criteria.endTime && e.timestamp > criteria.endTime) {
return false;
}
      if (criteria.priority && e.metadata.priority !== criteria.priority) {
return false;
}
      return true;
    });
  }

  /**
   * Get consumer status
   */
  getConsumerStatus(consumerId: string): Record<string, unknown> | null {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
return null;
}

    const buffer = this.buffers.get(consumerId) || [];

    return {
      id: consumerId,
      channel: consumer.channel,
      paused: this.paused.has(consumerId),
      bufferSize: buffer.length,
      bufferUtilization: `${Math.round((buffer.length / consumer.options.maxBufferSize) * 100)}%`,
      backpressure: consumer.options.backpressure,
      deduplicationEnabled: consumer.options.deduplicationEnabled,
    };
  }

  /**
   * Get stream statistics
   */
  getStatistics(): Record<string, unknown> {
    const stats: Record<string, unknown> = {
      channels: {},
      consumers: {
        total: this.consumers.size,
        paused: this.paused.size,
      },
      buffers: {
        totalBuffered: Array.from(this.buffers.values()).reduce(
          (sum, buffer) => sum + buffer.length,
          0
        ),
      },
      deduplication: {
        processedEvents: this.processedEvents.size,
      },
    };

    for (const [channel, log] of this.eventLog.entries()) {
      (stats.channels as any)[channel] = {
        events: log.length,
        sequence: this.sequences.get(channel) || 0,
      };
    }

    return stats;
  }

  /**
   * Clean up old events
   */
  cleanupOldEvents(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [channel, log] of this.eventLog.entries()) {
      const filtered = log.filter((e) => e.timestamp > cutoff);
      removed += log.length - filtered.length;
      this.eventLog.set(channel, filtered);
    }

    return removed;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.eventLog.clear();
    this.consumers.clear();
    this.sequences.clear();
    this.processedEvents.clear();
    this.buffers.clear();
    this.paused.clear();
    this.initializeChannels();
  }
}

// Export singleton
export const eventStreamManager = new EventStreamManager();
