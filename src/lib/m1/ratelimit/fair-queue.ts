/**
 * M1 Fair Queue
 *
 * Weighted Fair Queuing (WFQ) algorithm for distributing resources
 * proportionally among different clients based on assigned weights.
 *
 * Version: v1.0.0
 * Phase: 24 - Advanced Rate Limiting & Fair Queuing
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Queue entry
 */
export interface QueueEntry<T> {
  entryId: string;
  clientId: string;
  item: T;
  weight: number;
  priority: number;
  enqueuedAt: number;
  virtualTime: number; // For WFQ scheduling
  dequeuedAt?: number;
  processingTime?: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  clientId: string;
  weight: number;
  queueSize: number;
  totalEnqueued: number;
  totalDequeued: number;
  totalProcessingTime: number;
  avgProcessingTime: number;
  waitTime: number;
}

/**
 * Fair queue using Weighted Fair Queuing algorithm
 */
export class FairQueue<T = unknown> {
  private queue: QueueEntry<T>[] = [];
  private clientWeights: Map<string, number> = new Map();
  private clientStats: Map<string, QueueStats> = new Map();
  private virtualTime = 0;
  private finishTimeMap: Map<string, number> = new Map();

  /**
   * Register a client with a weight
   */
  registerClient(clientId: string, weight: number = 1): void {
    if (weight <= 0) {
      throw new Error('Weight must be positive');
    }

    this.clientWeights.set(clientId, weight);
    this.finishTimeMap.set(clientId, 0);

    if (!this.clientStats.has(clientId)) {
      this.clientStats.set(clientId, {
        clientId,
        weight,
        queueSize: 0,
        totalEnqueued: 0,
        totalDequeued: 0,
        totalProcessingTime: 0,
        avgProcessingTime: 0,
        waitTime: 0,
      });
    }
  }

  /**
   * Update client weight dynamically
   */
  updateClientWeight(clientId: string, newWeight: number): boolean {
    if (!this.clientWeights.has(clientId)) {
      return false;
    }

    if (newWeight <= 0) {
      throw new Error('Weight must be positive');
    }

    this.clientWeights.set(clientId, newWeight);

    const stats = this.clientStats.get(clientId);
    if (stats) {
      stats.weight = newWeight;
    }

    return true;
  }

  /**
   * Enqueue an item for a client
   */
  enqueue(clientId: string, item: T, priority: number = 0): string {
    if (!this.clientWeights.has(clientId)) {
      this.registerClient(clientId);
    }

    const entryId = `entry_${generateUUID()}`;
    const weight = this.clientWeights.get(clientId)!;

    // Calculate virtual finish time for WFQ
    const currentFinishTime = this.finishTimeMap.get(clientId) || 0;
    const virtualFinishTime = Math.max(this.virtualTime, currentFinishTime) + 1 / weight;

    const entry: QueueEntry<T> = {
      entryId,
      clientId,
      item,
      weight,
      priority,
      enqueuedAt: Date.now(),
      virtualTime: virtualFinishTime,
    };

    this.queue.push(entry);
    this.finishTimeMap.set(clientId, virtualFinishTime);

    // Update stats
    const stats = this.clientStats.get(clientId)!;
    stats.queueSize++;
    stats.totalEnqueued++;

    // Sort queue by virtual time (and priority as tiebreaker)
    this.queue.sort((a, b) => {
      if (a.virtualTime !== b.virtualTime) {
        return a.virtualTime - b.virtualTime;
      }
      return b.priority - a.priority;
    });

    return entryId;
  }

  /**
   * Dequeue the next item according to WFQ
   */
  dequeue(): QueueEntry<T> | null {
    if (this.queue.length === 0) {
      return null;
    }

    // Get first entry (lowest virtual time)
    const entry = this.queue.shift();
    if (!entry) {
      return null;
    }

    entry.dequeuedAt = Date.now();

    // Update virtual time
    this.virtualTime = Math.max(this.virtualTime, entry.virtualTime);

    // Update stats
    const stats = this.clientStats.get(entry.clientId);
    if (stats) {
      stats.queueSize--;
      stats.totalDequeued++;
      if (entry.enqueuedAt) {
        stats.waitTime = entry.dequeuedAt - entry.enqueuedAt;
      }
    }

    return entry;
  }

  /**
   * Mark an item as completed (update processing time)
   */
  markCompleted(entryId: string, processingTimeMs: number): boolean {
    // Update processing time stats for all clients
    for (const stats of this.clientStats.values()) {
      stats.totalProcessingTime += processingTimeMs;
      if (stats.totalDequeued > 0) {
        stats.avgProcessingTime = stats.totalProcessingTime / stats.totalDequeued;
      }
    }

    return true;
  }

  /**
   * Peek at next item without removing
   */
  peek(): QueueEntry<T> | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get queue size for a specific client
   */
  getClientQueueSize(clientId: string): number {
    return this.queue.filter((e) => e.clientId === clientId).length;
  }

  /**
   * Get statistics for a client
   */
  getClientStats(clientId: string): QueueStats | null {
    return this.clientStats.get(clientId) || null;
  }

  /**
   * Get statistics for all clients
   */
  getAllClientStats(): QueueStats[] {
    return Array.from(this.clientStats.values());
  }

  /**
   * Get fairness metric (how evenly resources are distributed)
   */
  getFairnessMetric(): number {
    const stats = Array.from(this.clientStats.values());

    if (stats.length === 0 || stats.length === 1) {
      return 1.0; // Perfect fairness (only one client or none)
    }

    // Calculate weighted average of processing times
    const totalWeight = stats.reduce((sum, s) => sum + s.weight, 0);
    const weightedProcessing = stats.reduce((sum, s) => sum + (s.avgProcessingTime * s.weight), 0);
    const normalizedWeightedProcessing = weightedProcessing / totalWeight;

    // Calculate variance from expected
    let variance = 0;
    for (const stat of stats) {
      const expected = normalizedWeightedProcessing / stat.weight;
      const deviation = stat.avgProcessingTime - expected;
      variance += deviation * deviation;
    }
    variance /= stats.length;

    // Convert to fairness score (1.0 = perfect, lower = less fair)
    const stdDev = Math.sqrt(variance);
    const mean = stats.reduce((sum, s) => sum + s.avgProcessingTime, 0) / stats.length;
    const cv = mean > 0 ? stdDev / mean : 0; // Coefficient of variation

    // Fairness = 1 / (1 + CV)
    return 1 / (1 + cv);
  }

  /**
   * Get normalized throughput per client
   */
  getThroughput(): Record<string, number> {
    const throughput: Record<string, number> = {};

    for (const [clientId, stats] of this.clientStats) {
      // Throughput = completed items / total weight
      throughput[clientId] = stats.totalDequeued / stats.weight;
    }

    return throughput;
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): Record<string, unknown> {
    const clientStats = this.getAllClientStats();
    const fairness = this.getFairnessMetric();
    const totalClients = clientStats.length;
    const totalQueued = clientStats.reduce((sum, s) => sum + s.totalEnqueued, 0);
    const totalDequeued = clientStats.reduce((sum, s) => sum + s.totalDequeued, 0);
    const totalWaiting = this.queue.length;

    const avgWaitTime = clientStats.length > 0
      ? clientStats.reduce((sum, s) => sum + s.waitTime, 0) / clientStats.length
      : 0;

    return {
      queueSize: this.queue.length,
      totalWaiting,
      totalClients,
      totalQueued,
      totalDequeued,
      fairnessMetric: Math.round(fairness * 10000) / 10000,
      avgWaitTimeMs: Math.round(avgWaitTime),
      virtualTime: Math.round(this.virtualTime * 100) / 100,
      clientStats: clientStats.map((s) => ({
        clientId: s.clientId,
        weight: s.weight,
        queueSize: s.queueSize,
        dequeued: s.totalDequeued,
        avgProcessingTime: Math.round(s.avgProcessingTime),
      })),
    };
  }

  /**
   * Drain queue for a specific client
   */
  drainClient(clientId: string): QueueEntry<T>[] {
    const drained = this.queue.filter((e) => e.clientId === clientId);

    this.queue = this.queue.filter((e) => e.clientId !== clientId);

    const stats = this.clientStats.get(clientId);
    if (stats) {
      stats.queueSize = 0;
    }

    return drained;
  }

  /**
   * Clear all queued items
   */
  clear(): void {
    this.queue = [];
    this.virtualTime = 0;

    for (const stats of this.clientStats.values()) {
      stats.queueSize = 0;
    }
  }

  /**
   * Shutdown queue
   */
  shutdown(): void {
    this.clear();
    this.clientWeights.clear();
    this.clientStats.clear();
    this.finishTimeMap.clear();
  }
}

// Export singleton factory
export function createFairQueue<T = unknown>(): FairQueue<T> {
  return new FairQueue<T>();
}
