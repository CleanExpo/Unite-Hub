/**
 * M1 Data Replication Manager
 *
 * Manages cross-region data synchronization with conflict resolution
 *
 * Version: v2.4.0
 * Phase: 11A - Multi-region Support
 */

import { RegionCode } from './region-manager';

export interface ReplicationEvent {
  eventId: string;
  timestamp: number;
  region: RegionCode;
  dataType: string;
  operation: 'create' | 'update' | 'delete';
  dataId: string;
  data?: Record<string, any>;
  version: number;
}

export interface ReplicationQueue {
  region: RegionCode;
  events: ReplicationEvent[];
  lastProcessed: number;
  pendingCount: number;
}

export interface ConflictResolution {
  eventId: string;
  conflict: boolean;
  winner: RegionCode | null;
  resolution: 'timestamp' | 'version' | 'manual' | 'none';
  resolvedAt: number;
}

/**
 * Data Replication Manager
 */
export class DataReplicationManager {
  private replicationQueues: Map<RegionCode, ReplicationQueue> = new Map();
  private eventLog: ReplicationEvent[] = [];
  private conflictResolutions: ConflictResolution[] = [];
  private syncInterval: NodeJS.Timer | null = null;
  private replicationCallbacks: Array<(event: ReplicationEvent) => void> = [];

  constructor(private regions: RegionCode[]) {
    for (const region of regions) {
      this.replicationQueues.set(region, {
        region,
        events: [],
        lastProcessed: Date.now(),
        pendingCount: 0,
      });
    }
  }

  /**
   * Queue event for replication to other regions
   */
  queueReplicationEvent(event: Omit<ReplicationEvent, 'eventId' | 'timestamp' | 'version'>): string {
    const eventId = this.generateEventId();
    const replicationEvent: ReplicationEvent = {
      ...event,
      eventId,
      timestamp: Date.now(),
      version: 1,
    };

    this.eventLog.push(replicationEvent);

    // Queue for all other regions
    for (const region of this.regions) {
      if (region !== event.region) {
        const queue = this.replicationQueues.get(region);
        if (queue) {
          queue.events.push(replicationEvent);
          queue.pendingCount++;
        }
      }
    }

    // Trigger callbacks
    for (const callback of this.replicationCallbacks) {
      callback(replicationEvent);
    }

    return eventId;
  }

  /**
   * Start replication sync
   */
  startReplication(): void {
    if (this.syncInterval) {
return;
}

    this.syncInterval = setInterval(async () => {
      await this.processReplicationQueues();
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop replication sync
   */
  stopReplication(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Process replication queues
   */
  private async processReplicationQueues(): Promise<void> {
    for (const [region, queue] of this.replicationQueues) {
      if (queue.pendingCount === 0) {
continue;
}

      try {
        await this.syncRegion(region, queue);
      } catch (error) {
        console.error(`Replication to ${region} failed:`, error);
      }
    }
  }

  /**
   * Sync specific region
   */
  private async syncRegion(region: RegionCode, queue: ReplicationQueue): Promise<void> {
    if (queue.events.length === 0) {
return;
}

    // In production: Send events to region via network
    // For now: Simulate successful sync
    const startTime = Date.now();
    const syncDuration = Math.random() * 500; // 0-500ms

    await new Promise(resolve => setTimeout(resolve, syncDuration));

    queue.events = [];
    queue.pendingCount = 0;
    queue.lastProcessed = Date.now();
  }

  /**
   * Detect and resolve conflicts
   */
  async resolveConflicts(events: ReplicationEvent[]): Promise<ConflictResolution> {
    if (events.length <= 1) {
      return {
        eventId: events[0]?.eventId || '',
        conflict: false,
        winner: null,
        resolution: 'none',
        resolvedAt: Date.now(),
      };
    }

    // Sort by timestamp
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const winner = sorted[sorted.length - 1]; // Latest by timestamp

    const resolution: ConflictResolution = {
      eventId: events[0].eventId,
      conflict: true,
      winner: winner.region,
      resolution: 'timestamp',
      resolvedAt: Date.now(),
    };

    this.conflictResolutions.push(resolution);
    return resolution;
  }

  /**
   * Register replication callback
   */
  onReplication(callback: (event: ReplicationEvent) => void): void {
    this.replicationCallbacks.push(callback);
  }

  /**
   * Get replication queue for region
   */
  getReplicationQueue(region: RegionCode): ReplicationQueue | null {
    return this.replicationQueues.get(region) || null;
  }

  /**
   * Get all queues
   */
  getAllQueues(): ReplicationQueue[] {
    return Array.from(this.replicationQueues.values());
  }

  /**
   * Get replication lag
   */
  getReplicationLag(region: RegionCode): number {
    const queue = this.replicationQueues.get(region);
    if (!queue) {
return 0;
}

    const now = Date.now();
    const lastProcessed = queue.lastProcessed;
    return now - lastProcessed;
  }

  /**
   * Get event log
   */
  getEventLog(limit: number = 100): ReplicationEvent[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get conflict resolutions
   */
  getConflictResolutions(limit: number = 50): ConflictResolution[] {
    return this.conflictResolutions.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number;
    totalConflicts: number;
    totalQueued: number;
    regionStats: Array<{
      region: RegionCode;
      pending: number;
      lag: number;
      lastSync: number;
    }>;
  } {
    let totalQueued = 0;
    const regionStats = [];

    for (const [region, queue] of this.replicationQueues) {
      totalQueued += queue.pendingCount;
      regionStats.push({
        region,
        pending: queue.pendingCount,
        lag: this.getReplicationLag(region),
        lastSync: queue.lastProcessed,
      });
    }

    return {
      totalEvents: this.eventLog.length,
      totalConflicts: this.conflictResolutions.length,
      totalQueued,
      regionStats,
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Clear old events (for cleanup)
   */
  clearOldEvents(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    const originalLength = this.eventLog.length;
    this.eventLog = this.eventLog.filter(e => e.timestamp > cutoff);
    return originalLength - this.eventLog.length;
  }
}

// Export singleton
export const dataReplicationManager = new DataReplicationManager([
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'ap-southeast-1',
  'ap-northeast-1',
]);
