/**
 * Rate Limiter Implementation
 * Used to control the rate of API requests to prevent hitting rate limits
 */

/**
 * Rate Limiter Configuration
 */
export interface RateLimiterConfig {
  requestsPerInterval: number;  // Number of requests allowed per interval
  interval: number;             // Interval in milliseconds
  queueSize?: number;           // Maximum queue size (default: 100)
}

/**
 * Rate Limiter Implementation
 * Uses token bucket algorithm for rate limiting
 */
export class RateLimiter {
  private requestsPerInterval: number;
  private interval: number;
  private tokens: number;
  private lastRefill: number;
  private waitQueue: Array<{ resolve: () => void }> = [];
  private queueSize: number;

  constructor(config: RateLimiterConfig) {
    this.requestsPerInterval = config.requestsPerInterval;
    this.interval = config.interval;
    this.tokens = config.requestsPerInterval; // Start with full tokens
    this.lastRefill = Date.now();
    this.queueSize = config.queueSize || 100;
  }

  /**
   * Acquire a token to make a request
   * If no tokens are available, this will wait until one becomes available
   * @returns A promise that resolves when a token is acquired
   */
  public async acquire(): Promise<void> {
    // Refill tokens based on time passed
    this.refillTokens();

    // If tokens are available, consume one and return immediately
    if (this.tokens > 0) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    // If queue is full, reject immediately
    if (this.waitQueue.length >= this.queueSize) {
      return Promise.reject(new Error('Rate limit queue is full'));
    }

    // Otherwise, add to wait queue
    return new Promise<void>((resolve, reject) => {
      // Add to wait queue
      this.waitQueue.push({ resolve });

      // Set timeout to reject if waiting too long
      const timeoutId = setTimeout(() => {
        // Remove from queue
        const index = this.waitQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
          reject(new Error('Rate limit wait timeout'));
        }
      }, this.interval * 2); // Wait for max 2x the interval

      // Modify resolve to clear timeout
      const originalResolve = resolve;
      resolve = () => {
        clearTimeout(timeoutId);
        originalResolve();
      };
    });
  }

  /**
   * Release a token back to the pool
   * Call this in finally block to ensure tokens are released even on error
   */
  public release(): void {
    // If there are waiters, resolve the first one
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        waiter.resolve();
      }
    } else {
      // Otherwise, add a token back to the bucket (up to max)
      if (this.tokens < this.requestsPerInterval) {
        this.tokens += 1;
      }
    }
  }

  /**
   * Refill tokens based on time passed
   * Called automatically before acquire
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    // Calculate how many tokens to add based on time passed
    if (timePassed >= this.interval) {
      // Calculate how many intervals have passed
      const intervals = Math.floor(timePassed / this.interval);
      
      // Calculate how many tokens to add
      const tokensToAdd = intervals * this.requestsPerInterval;
      
      // Add tokens up to the maximum
      this.tokens = Math.min(this.requestsPerInterval, this.tokens + tokensToAdd);
      
      // Update last refill time
      this.lastRefill = now;
    }
  }

  /**
   * Get current available tokens (for debugging)
   */
  public getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  /**
   * Get current queue length (for debugging)
   */
  public getQueueLength(): number {
    return this.waitQueue.length;
  }
}
