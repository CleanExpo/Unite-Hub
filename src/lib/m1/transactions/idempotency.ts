/**
 * M1 Idempotency Framework
 *
 * Request deduplication and idempotent operation support
 * for ensuring operations execute at most once
 *
 * Version: v1.0.0
 * Phase: 23 - Distributed Transactions & Saga Patterns
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Idempotency key information
 */
export interface IdempotencyKey {
  keyId: string;
  key: string;
  operationName: string;
  createdAt: number;
  expiresAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: Error;
  lastAccessedAt: number;
}

/**
 * Idempotency check result
 */
export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  keyId?: string;
  previousResult?: unknown;
  shouldExecute: boolean;
  reason: string;
}

/**
 * Idempotency framework for request deduplication
 */
export class IdempotencyFramework {
  private idempotencyKeys: Map<string, IdempotencyKey> = new Map(); // key -> IdempotencyKey
  private operationRegistry: Map<string, string[]> = new Map(); // operationName -> keyIds
  private inFlightRequests: Map<string, Promise<unknown>> = new Map(); // key -> promise (concurrent dedup)
  private expirationTimers: Map<string, NodeJS.Timeout> = new Map();

  private readonly defaultTTLMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if request is duplicate or should execute
   */
  checkIdempotency(key: string, operationName: string, ttlMs?: number): IdempotencyCheckResult {
    // Clean up expired keys
    this.cleanupExpired();

    const existing = this.idempotencyKeys.get(key);

    if (!existing) {
      // New request - create entry
      const keyId = `idem_${generateUUID()}`;
      const expiresAt = ttlMs ? Date.now() + ttlMs : Date.now() + this.defaultTTLMs;

      const idempotencyKey: IdempotencyKey = {
        keyId,
        key,
        operationName,
        createdAt: Date.now(),
        expiresAt,
        status: 'pending',
        lastAccessedAt: Date.now(),
      };

      this.idempotencyKeys.set(key, idempotencyKey);

      // Track in operation registry
      if (!this.operationRegistry.has(operationName)) {
        this.operationRegistry.set(operationName, []);
      }
      this.operationRegistry.get(operationName)!.push(keyId);

      // Set expiration timer
      if (ttlMs) {
        const timer = setTimeout(() => {
          this.idempotencyKeys.delete(key);
          this.expirationTimers.delete(key);
        }, ttlMs);
        this.expirationTimers.set(key, timer);
      }

      return {
        isDuplicate: false,
        keyId,
        shouldExecute: true,
        reason: 'New request - no previous execution',
      };
    }

    // Check if expired
    if (existing.expiresAt && existing.expiresAt < Date.now()) {
      this.idempotencyKeys.delete(key);
      if (this.expirationTimers.has(key)) {
        clearTimeout(this.expirationTimers.get(key)!);
        this.expirationTimers.delete(key);
      }

      return {
        isDuplicate: false,
        shouldExecute: true,
        reason: 'Previous execution expired',
      };
    }

    // Duplicate detected
    existing.lastAccessedAt = Date.now();

    switch (existing.status) {
      case 'pending':
      case 'processing':
        // Request still being processed - wait for result
        return {
          isDuplicate: true,
          keyId: existing.keyId,
          shouldExecute: false,
          reason: 'Request already processing',
        };

      case 'completed':
        return {
          isDuplicate: true,
          keyId: existing.keyId,
          previousResult: existing.result,
          shouldExecute: false,
          reason: 'Request already completed',
        };

      case 'failed':
        return {
          isDuplicate: true,
          keyId: existing.keyId,
          shouldExecute: false,
          reason: 'Previous execution failed',
        };

      default:
        return {
          isDuplicate: true,
          keyId: existing.keyId,
          shouldExecute: false,
          reason: 'Duplicate request detected',
        };
    }
  }

  /**
   * Mark operation as processing
   */
  markProcessing(key: string): void {
    const idempotency = this.idempotencyKeys.get(key);
    if (idempotency) {
      idempotency.status = 'processing';
      idempotency.lastAccessedAt = Date.now();
    }
  }

  /**
   * Mark operation as completed with result
   */
  markCompleted(key: string, result: unknown): void {
    const idempotency = this.idempotencyKeys.get(key);
    if (idempotency) {
      idempotency.status = 'completed';
      idempotency.result = result;
      idempotency.lastAccessedAt = Date.now();
    }
  }

  /**
   * Mark operation as failed
   */
  markFailed(key: string, error: Error): void {
    const idempotency = this.idempotencyKeys.get(key);
    if (idempotency) {
      idempotency.status = 'failed';
      idempotency.error = error;
      idempotency.lastAccessedAt = Date.now();
    }
  }

  /**
   * Get previous result if exists
   */
  getPreviousResult(key: string): unknown | null {
    const idempotency = this.idempotencyKeys.get(key);
    if (idempotency && idempotency.status === 'completed') {
      return idempotency.result || null;
    }
    return null;
  }

  /**
   * Deduplicate concurrent identical requests
   */
  async deduplicateConcurrentRequest<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Check if request already in flight
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)! as Promise<T>;
    }

    // Execute and store promise
    const promise = Promise.resolve(operation());
    this.inFlightRequests.set(key, promise);

    try {
      return (await promise) as T;
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  /**
   * Get statistics for operation
   */
  getOperationStats(operationName: string): Record<string, unknown> {
    const keyIds = this.operationRegistry.get(operationName) || [];
    const keys = keyIds.map((id) => Array.from(this.idempotencyKeys.values()).find((k) => k.keyId === id)).filter(Boolean) as IdempotencyKey[];

    const completed = keys.filter((k) => k.status === 'completed');
    const failed = keys.filter((k) => k.status === 'failed');
    const processing = keys.filter((k) => k.status === 'processing');

    return {
      operation: operationName,
      totalRequests: keys.length,
      completed: completed.length,
      failed: failed.length,
      processing: processing.length,
      successRate: keys.length > 0 ? (completed.length / keys.length) * 100 : 0,
      dedupedRequests: keyIds.filter((id) => {
        const key = Array.from(this.idempotencyKeys.values()).find((k) => k.keyId === id);
        return key && key.status !== 'pending';
      }).length,
    };
  }

  /**
   * Get all idempotency entries
   */
  getAllEntries(filter?: { operationName?: string; status?: IdempotencyKey['status'] }): IdempotencyKey[] {
    let entries = Array.from(this.idempotencyKeys.values());

    if (filter?.operationName) {
      entries = entries.filter((e) => e.operationName === filter.operationName);
    }

    if (filter?.status) {
      entries = entries.filter((e) => e.status === filter.status);
    }

    return entries;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.idempotencyKeys) {
      if (entry.expiresAt && entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.idempotencyKeys.delete(key);
      if (this.expirationTimers.has(key)) {
        clearTimeout(this.expirationTimers.get(key)!);
        this.expirationTimers.delete(key);
      }
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): Record<string, unknown> {
    const allEntries = Array.from(this.idempotencyKeys.values());
    const completed = allEntries.filter((e) => e.status === 'completed');
    const failed = allEntries.filter((e) => e.status === 'failed');
    const processing = allEntries.filter((e) => e.status === 'processing');

    const totalDuration = completed.reduce((sum, e) => sum + (e.lastAccessedAt - e.createdAt), 0);

    return {
      totalKeys: allEntries.length,
      completed: completed.length,
      failed: failed.length,
      processing: processing.length,
      successRate: allEntries.length > 0 ? (completed.length / allEntries.length) * 100 : 0,
      avgDurationMs: completed.length > 0 ? totalDuration / completed.length : 0,
      inFlightRequests: this.inFlightRequests.size,
      operations: this.operationRegistry.size,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    for (const timer of this.expirationTimers.values()) {
      clearTimeout(timer);
    }

    this.idempotencyKeys.clear();
    this.operationRegistry.clear();
    this.inFlightRequests.clear();
    this.expirationTimers.clear();
  }

  /**
   * Shutdown framework
   */
  shutdown(): void {
    this.clear();
  }
}

// Export singleton
export const idempotencyFramework = new IdempotencyFramework();
