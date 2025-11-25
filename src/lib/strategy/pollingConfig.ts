/**
 * Polling Configuration & Smart Interval Management
 * Provides intelligent polling strategies with adaptive intervals and deduplication
 */

/**
 * Polling mode configuration
 * Determines how aggressively data should be refreshed
 */
export enum PollingMode {
  PAUSED = 'paused',           // No polling
  IDLE = 'idle',               // Slow polling (30s)
  NORMAL = 'normal',           // Standard polling (5s)
  ACTIVE = 'active',           // Fast polling (2s)
  CRITICAL = 'critical',       // Very fast polling (1s) - for critical operations
}

/**
 * Get polling interval based on mode
 */
export function getPollingInterval(mode: PollingMode): number {
  const intervals: Record<PollingMode, number> = {
    [PollingMode.PAUSED]: 0,
    [PollingMode.IDLE]: 30000,      // 30 seconds
    [PollingMode.NORMAL]: 5000,     // 5 seconds (default)
    [PollingMode.ACTIVE]: 2000,     // 2 seconds
    [PollingMode.CRITICAL]: 1000,   // 1 second
  };
  return intervals[mode];
}

/**
 * Polling configuration for different contexts
 */
export const POLLING_CONFIG = {
  // Active strategy - most frequently accessed
  activeStrategy: {
    defaultMode: PollingMode.NORMAL,
    minInterval: 1000,
    maxInterval: 30000,
    backoffMultiplier: 1.5,
  },

  // Strategy history - less frequently updated
  history: {
    defaultMode: PollingMode.IDLE,
    minInterval: 2000,
    maxInterval: 60000,
    backoffMultiplier: 2,
  },

  // Validation results - medium frequency
  validation: {
    defaultMode: PollingMode.NORMAL,
    minInterval: 2000,
    maxInterval: 30000,
    backoffMultiplier: 1.5,
  },

  // Strategy creation - high priority while creating
  creation: {
    defaultMode: PollingMode.CRITICAL,
    minInterval: 500,
    maxInterval: 5000,
    backoffMultiplier: 1.2,
  },
};

/**
 * Adaptive polling - adjusts interval based on data freshness
 */
export class AdaptivePollingManager {
  private interval: number;
  private minInterval: number;
  private maxInterval: number;
  private backoffMultiplier: number;
  private lastSuccessTime: number = 0;
  private lastDataChangeTime: number = 0;
  private failureCount: number = 0;

  constructor(
    initialInterval: number,
    minInterval: number,
    maxInterval: number,
    backoffMultiplier: number = 1.5
  ) {
    this.interval = initialInterval;
    this.minInterval = minInterval;
    this.maxInterval = maxInterval;
    this.backoffMultiplier = backoffMultiplier;
    this.lastSuccessTime = Date.now();
  }

  /**
   * Record successful fetch
   */
  recordSuccess(dataChanged: boolean = false): void {
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;

    if (dataChanged) {
      this.lastDataChangeTime = Date.now();
      // Data changed recently - increase polling frequency
      this.interval = Math.max(this.minInterval, Math.floor(this.interval / this.backoffMultiplier));
    } else {
      // No data change - gradually increase interval
      const timeSinceChange = Date.now() - this.lastDataChangeTime;
      const staleSeconds = timeSinceChange / 1000;

      // After 5 minutes without changes, slow down polling significantly
      if (staleSeconds > 300) {
        this.interval = Math.min(this.maxInterval, this.interval * this.backoffMultiplier);
      }
      // After 30 seconds without changes, slow down slightly
      else if (staleSeconds > 30) {
        this.interval = Math.min(this.maxInterval, Math.floor(this.interval * 1.2));
      }
    }
  }

  /**
   * Record fetch failure
   */
  recordFailure(): void {
    this.failureCount++;

    // Exponential backoff on failures
    // Increase interval by 50% for each failure (max 3x the base interval)
    const backoffFactor = Math.min(3, Math.pow(this.backoffMultiplier, this.failureCount - 1));
    this.interval = Math.min(this.maxInterval, Math.floor(this.minInterval * backoffFactor));
  }

  /**
   * Get current polling interval
   */
  getInterval(): number {
    return Math.max(this.minInterval, Math.min(this.maxInterval, this.interval));
  }

  /**
   * Reset to default interval
   */
  reset(): void {
    this.interval = this.minInterval;
    this.failureCount = 0;
    this.lastSuccessTime = Date.now();
  }

  /**
   * Get polling stats for monitoring
   */
  getStats(): {
    currentInterval: number;
    failureCount: number;
    timeSinceLastSuccess: number;
    timeSinceLastDataChange: number;
  } {
    return {
      currentInterval: this.getInterval(),
      failureCount: this.failureCount,
      timeSinceLastSuccess: Date.now() - this.lastSuccessTime,
      timeSinceLastDataChange: Date.now() - this.lastDataChangeTime,
    };
  }
}

/**
 * Request deduplication tracker
 * Prevents duplicate concurrent requests
 */
export class DeduplicationTracker {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Execute request with deduplication
   * If a request for the same key is already pending, return that promise instead
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Return existing promise if already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create and store new promise
    const promise = fn()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Check if request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Cancel pending request
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * Request batching - combine multiple requests into one
 */
export class RequestBatcher {
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingRequests: Map<string, () => Promise<any>> = new Map();
  private batchWindow: number;

  constructor(batchWindow: number = 100) {
    this.batchWindow = batchWindow; // milliseconds to wait before executing batch
  }

  /**
   * Queue request to be batched
   */
  queue(key: string, fn: () => Promise<any>): void {
    this.pendingRequests.set(key, fn);

    // If this is the first request, start the batch timer
    if (this.pendingRequests.size === 1) {
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, this.batchWindow);
    }
  }

  /**
   * Execute all pending requests in the batch
   */
  private async executeBatch(): Promise<void> {
    const requests = Array.from(this.pendingRequests.entries());
    this.pendingRequests.clear();
    this.batchTimeout = null;

    // Execute all requests in parallel
    await Promise.allSettled(requests.map(([_, fn]) => fn()));
  }

  /**
   * Get count of queued requests
   */
  getQueuedCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Force immediate execution of pending batch
   */
  flush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.executeBatch();
    }
  }

  /**
   * Clear all pending requests without executing
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.pendingRequests.clear();
  }
}

/**
 * Rate limiter - client-side rate limiting to respect server limits
 */
export class ClientRateLimiter {
  private lastRequestTime: number = 0;
  private minInterval: number; // Minimum milliseconds between requests

  constructor(minInterval: number = 100) {
    this.minInterval = minInterval;
  }

  /**
   * Check if request is allowed
   */
  canRequest(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    return timeSinceLastRequest >= this.minInterval;
  }

  /**
   * Wait until request is allowed
   */
  async waitUntilAllowed(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      return new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Record request
   */
  recordRequest(): void {
    this.lastRequestTime = Date.now();
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilAllowed(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    return Math.max(0, this.minInterval - timeSinceLastRequest);
  }
}

/**
 * Polling statistics for monitoring and debugging
 */
export class PollingStatistics {
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private totalTime: number = 0;
  private lastRequestTime: number | null = null;
  private requestTimes: number[] = [];
  private maxRequestTimesToTrack: number = 100;

  /**
   * Record request start
   */
  startRequest(): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.totalTime += duration;
      this.totalRequests++;
      this.lastRequestTime = Date.now();

      // Track request time for average calculation
      this.requestTimes.push(duration);
      if (this.requestTimes.length > this.maxRequestTimesToTrack) {
        this.requestTimes.shift();
      }
    };
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.successfulRequests++;
  }

  /**
   * Record failed request
   */
  recordFailure(): void {
    this.failedRequests++;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageRequestTime: number;
    medianRequestTime: number;
    maxRequestTime: number;
    minRequestTime: number;
    lastRequestTime: number | null;
  } {
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    const medianTime =
      sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)]
        : 0;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate:
        this.totalRequests > 0
          ? (this.successfulRequests / this.totalRequests) * 100
          : 0,
      averageRequestTime:
        this.totalRequests > 0
          ? this.totalTime / this.totalRequests
          : 0,
      medianRequestTime: medianTime,
      maxRequestTime: Math.max(...this.requestTimes, 0),
      minRequestTime:
        this.requestTimes.length > 0
          ? Math.min(...this.requestTimes)
          : 0,
      lastRequestTime: this.lastRequestTime,
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalTime = 0;
    this.lastRequestTime = null;
    this.requestTimes = [];
  }
}

/**
 * Create a polling configuration preset
 */
export function createPollingConfig(mode: PollingMode) {
  const interval = getPollingInterval(mode);
  const config = POLLING_CONFIG.activeStrategy;

  return {
    interval,
    adaptiveManager: new AdaptivePollingManager(
      interval,
      config.minInterval,
      config.maxInterval,
      config.backoffMultiplier
    ),
  };
}

/**
 * Export utilities
 */
export const pollingUtils = {
  POLLING_CONFIG,
  AdaptivePollingManager,
  DeduplicationTracker,
  RequestBatcher,
  ClientRateLimiter,
  PollingStatistics,
  getPollingInterval,
  createPollingConfig,
};
