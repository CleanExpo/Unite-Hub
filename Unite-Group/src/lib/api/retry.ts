/**
 * Retry Strategy Implementation
 * Provides mechanisms for retrying failed API requests with exponential backoff
 */

/**
 * Retry Strategy Configuration
 */
export interface RetryStrategyConfig {
  maxRetries: number;                 // Maximum number of retry attempts
  initialDelay?: number;              // Initial delay in milliseconds (default: 100ms)
  maxDelay?: number;                  // Maximum delay in milliseconds (default: 10000ms)
  backoffFactor?: number;             // Multiplier for each retry attempt (default: 2)
  jitter?: boolean;                   // Whether to add random jitter to delays (default: true)
  retryableStatuses?: number[];       // HTTP status codes that are retryable (default: 429, 503)
  nonRetryableStatuses?: number[];    // HTTP status codes that are not retryable (default: 400, 401, 403, 404)
  retryCondition?: (error: any) => boolean; // Custom function to determine if an error is retryable
}

/**
 * Retry Strategy Implementation
 */
export class RetryStrategy {
  public maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private backoffFactor: number;
  private jitter: boolean;
  public retryableStatuses: number[];
  public nonRetryableStatuses: number[];
  private retryCondition?: (error: any) => boolean;

  constructor(config: RetryStrategyConfig) {
    this.maxRetries = config.maxRetries;
    this.initialDelay = config.initialDelay || 100;
    this.maxDelay = config.maxDelay || 10000;
    this.backoffFactor = config.backoffFactor || 2;
    this.jitter = config.jitter !== undefined ? config.jitter : true;
    this.retryableStatuses = config.retryableStatuses || [429, 503];
    this.nonRetryableStatuses = config.nonRetryableStatuses || [400, 401, 403, 404];
    this.retryCondition = config.retryCondition;
  }

  /**
   * Calculate delay for a retry attempt with exponential backoff
   * @param attempt The current attempt number (1-based)
   * @returns The delay in milliseconds
   */
  public calculateDelay(attempt: number): number {
    // Calculate exponential backoff
    const exponentialDelay = this.initialDelay * Math.pow(this.backoffFactor, attempt - 1);
    
    // Cap at maximum delay
    let delay = Math.min(exponentialDelay, this.maxDelay);
    
    // Add jitter if enabled (±25% of delay)
    if (this.jitter) {
      const jitterFactor = 0.5 + Math.random();
      delay = Math.floor(delay * jitterFactor);
    }
    
    return delay;
  }

  /**
   * Determine if an error is retryable
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  public isRetryable(error: any): boolean {
    // If custom retry condition is provided, use it
    if (this.retryCondition) {
      return this.retryCondition(error);
    }
    
    // Check for network errors (typically retryable)
    if (error instanceof TypeError && error.message.includes('network')) {
      return true;
    }
    
    // Check for abort errors (typically not retryable unless it's a timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return error.message.includes('timeout');
    }
    
    // Check for API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      
      // If status is in non-retryable list, don't retry
      if (this.nonRetryableStatuses.includes(status)) {
        return false;
      }
      
      // If status is in retryable list, retry
      if (this.retryableStatuses.includes(status)) {
        return true;
      }
      
      // Retry server errors (5xx) but not client errors (4xx)
      return status >= 500 && status < 600;
    }
    
    // Default to not retrying unknown errors
    return false;
  }

  /**
   * Create a standard retry strategy for API requests
   * @returns A retry strategy suitable for most API requests
   */
  public static standard(): RetryStrategy {
    return new RetryStrategy({
      maxRetries: 3,
      initialDelay: 250,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: true,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      nonRetryableStatuses: [400, 401, 403, 404, 405, 422],
    });
  }

  /**
   * Create an aggressive retry strategy for important API requests
   * @returns A retry strategy with more retries and longer delays
   */
  public static aggressive(): RetryStrategy {
    return new RetryStrategy({
      maxRetries: 5,
      initialDelay: 500,
      maxDelay: 30000,
      backoffFactor: 3,
      jitter: true,
      retryableStatuses: [408, 429, 500, 502, 503, 504, 507, 510],
      nonRetryableStatuses: [400, 401, 403, 404, 405, 422],
    });
  }

  /**
   * Create a minimal retry strategy for non-critical API requests
   * @returns A retry strategy with minimal retries
   */
  public static minimal(): RetryStrategy {
    return new RetryStrategy({
      maxRetries: 1,
      initialDelay: 100,
      maxDelay: 1000,
      backoffFactor: 1,
      jitter: false,
      retryableStatuses: [429, 503],
      nonRetryableStatuses: [400, 401, 403, 404, 405, 422],
    });
  }
}
