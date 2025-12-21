/**
 * M1 Event Store
 *
 * Append-only event log with snapshots, projections,
 * and replay capability for complete audit trails
 *
 * Version: v1.0.0
 * Phase: 23 - Distributed Transactions & Saga Patterns
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Event in the store
 */
export interface Event {
  eventId: string;
  aggregateId: string;
  eventType: string;
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Snapshot of aggregate state
 */
export interface EventSnapshot {
  snapshotId: string;
  aggregateId: string;
  version: number;
  state: Record<string, unknown>;
  createdAt: number;
}

/**
 * Event projection (view of data)
 */
export interface EventProjection {
  projectionId: string;
  aggregateId: string;
  eventCount: number;
  version: number;
  state: Record<string, unknown>;
  lastUpdated: number;
}

/**
 * Event store with append-only log
 */
export class EventStore {
  private events: Event[] = [];
  private snapshots: Map<string, EventSnapshot> = new Map();
  private projections: Map<string, EventProjection> = new Map();
  private aggregateVersions: Map<string, number> = new Map();
  private eventIndex: Map<string, Event[]> = new Map(); // aggregateId -> events

  /**
   * Append event to log
   */
  appendEvent(aggregateId: string, eventType: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Event {
    const eventId = `evt_${generateUUID()}`;
    const version = (this.aggregateVersions.get(aggregateId) || 0) + 1;

    const event: Event = {
      eventId,
      aggregateId,
      eventType,
      version,
      timestamp: Date.now(),
      data,
      metadata,
    };

    this.events.push(event);
    this.aggregateVersions.set(aggregateId, version);

    // Index by aggregate
    if (!this.eventIndex.has(aggregateId)) {
      this.eventIndex.set(aggregateId, []);
    }
    this.eventIndex.get(aggregateId)!.push(event);

    // Invalidate projection
    this.projections.delete(aggregateId);

    return event;
  }

  /**
   * Get events for aggregate
   */
  getEvents(aggregateId: string): Event[] {
    return this.eventIndex.get(aggregateId) || [];
  }

  /**
   * Get events of specific type
   */
  getEventsByType(aggregateId: string, eventType: string): Event[] {
    return this.getEvents(aggregateId).filter((e) => e.eventType === eventType);
  }

  /**
   * Get events in version range
   */
  getEventsInRange(aggregateId: string, fromVersion: number, toVersion: number): Event[] {
    return this.getEvents(aggregateId).filter((e) => e.version >= fromVersion && e.version <= toVersion);
  }

  /**
   * Create snapshot of aggregate state
   */
  createSnapshot(aggregateId: string, state: Record<string, unknown>): EventSnapshot {
    const snapshotId = `snap_${generateUUID()}`;
    const version = this.aggregateVersions.get(aggregateId) || 0;

    const snapshot: EventSnapshot = {
      snapshotId,
      aggregateId,
      version,
      state,
      createdAt: Date.now(),
    };

    this.snapshots.set(aggregateId, snapshot);
    return snapshot;
  }

  /**
   * Get snapshot for aggregate
   */
  getSnapshot(aggregateId: string): EventSnapshot | null {
    return this.snapshots.get(aggregateId) || null;
  }

  /**
   * Rebuild state from events (full replay)
   */
  rebuildState(aggregateId: string, applyEvent: (state: Record<string, unknown>, event: Event) => Record<string, unknown>): Record<string, unknown> {
    // Try to find snapshot
    const snapshot = this.getSnapshot(aggregateId);
    let state: Record<string, unknown> = snapshot ? { ...snapshot.state } : {};
    const startVersion = snapshot ? snapshot.version : 0;

    // Replay events after snapshot
    const events = this.getEventsInRange(aggregateId, startVersion + 1, this.aggregateVersions.get(aggregateId) || 0);

    for (const event of events) {
      state = applyEvent(state, event);
    }

    return state;
  }

  /**
   * Partial replay (from version to version)
   */
  replayEvents(
    aggregateId: string,
    fromVersion: number,
    toVersion: number,
    applyEvent: (state: Record<string, unknown>, event: Event) => Record<string, unknown>
  ): Record<string, unknown> {
    let state: Record<string, unknown> = {};
    const events = this.getEventsInRange(aggregateId, fromVersion, toVersion);

    for (const event of events) {
      state = applyEvent(state, event);
    }

    return state;
  }

  /**
   * Get current state via projection
   */
  getCurrentState(
    aggregateId: string,
    applyEvent: (state: Record<string, unknown>, event: Event) => Record<string, unknown>
  ): EventProjection {
    // Check cache
    const cached = this.projections.get(aggregateId);
    if (cached) {
      return cached;
    }

    // Rebuild from events
    const events = this.getEvents(aggregateId);
    let state: Record<string, unknown> = {};

    for (const event of events) {
      state = applyEvent(state, event);
    }

    const projection: EventProjection = {
      projectionId: `proj_${generateUUID()}`,
      aggregateId,
      eventCount: events.length,
      version: this.aggregateVersions.get(aggregateId) || 0,
      state,
      lastUpdated: Date.now(),
    };

    this.projections.set(aggregateId, projection);
    return projection;
  }

  /**
   * Get event history
   */
  getHistory(filter?: { aggregateId?: string; eventType?: string; fromTime?: number; toTime?: number }): Event[] {
    let result = [...this.events];

    if (filter?.aggregateId) {
      result = result.filter((e) => e.aggregateId === filter.aggregateId);
    }

    if (filter?.eventType) {
      result = result.filter((e) => e.eventType === filter.eventType);
    }

    if (filter?.fromTime) {
      result = result.filter((e) => e.timestamp >= filter.fromTime!);
    }

    if (filter?.toTime) {
      result = result.filter((e) => e.timestamp <= filter.toTime!);
    }

    return result;
  }

  /**
   * Verify consistency
   */
  verifyConsistency(): {
    consistent: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check version sequences
    for (const [aggregateId, events] of this.eventIndex) {
      const sorted = [...events].sort((a, b) => a.version - b.version);

      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].version !== i + 1) {
          issues.push(`Missing version ${i + 1} for aggregate ${aggregateId}`);
        }
      }
    }

    // Check snapshot versions
    for (const [aggregateId, snapshot] of this.snapshots) {
      const currentVersion = this.aggregateVersions.get(aggregateId) || 0;
      if (snapshot.version > currentVersion) {
        issues.push(`Snapshot version ${snapshot.version} exceeds current version ${currentVersion} for ${aggregateId}`);
      }
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, unknown> {
    const aggregates = this.eventIndex.size;
    const totalEvents = this.events.length;
    const totalSnapshots = this.snapshots.size;

    const eventTypeDistribution: Record<string, number> = {};
    for (const event of this.events) {
      eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1;
    }

    const avgEventsPerAggregate = aggregates > 0 ? totalEvents / aggregates : 0;

    return {
      aggregates,
      totalEvents,
      snapshots: totalSnapshots,
      eventTypes: Object.keys(eventTypeDistribution).length,
      eventTypeDistribution,
      avgEventsPerAggregate: Math.round(avgEventsPerAggregate * 100) / 100,
      oldestEvent: this.events.length > 0 ? this.events[0].timestamp : null,
      newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.events = [];
    this.snapshots.clear();
    this.projections.clear();
    this.aggregateVersions.clear();
    this.eventIndex.clear();
  }

  /**
   * Shutdown store
   */
  shutdown(): void {
    this.clear();
  }
}

// Export singleton
export const eventStore = new EventStore();
