/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by "opening" when error rate exceeds threshold.
 * Provides fail-fast behavior and automatic recovery testing.
 *
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Failing fast, rejecting all requests
 * - HALF_OPEN: Testing recovery, allowing limited requests
 *
 * Usage:
 *   const breaker = new CircuitBreaker({
 *     failureThreshold: 5,
 *     resetTimeout: 60000,
 *   });
 *
 *   const result = await breaker.execute(async () => {
 *     return await riskyOperation();
 *   });
 */

export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures before opening circuit
   * Default: 5
   */
  failureThreshold?: number;

  /**
   * Timeout in milliseconds before attempting recovery
   * Default: 60000 (1 minute)
   */
  resetTimeout?: number;

  /**
   * Number of successful requests in HALF_OPEN before closing circuit
   * Default: 2
   */
  successThreshold?: number;

  /**
   * Name for logging and metrics
   */
  name?: string;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalAttempts: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  circuitOpenedAt: number | null;
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalAttempts: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private circuitOpenedAt: number | null = null;
  private resetTimer?: NodeJS.Timeout;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.successThreshold = options.successThreshold || 2;
    this.name = options.name || 'CircuitBreaker';
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalAttempts++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      if (this.circuitOpenedAt && Date.now() - this.circuitOpenedAt >= this.resetTimeout) {
        this.transition(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `[${this.name}] Circuit breaker is OPEN. Failing fast. Last failure: ${this.lastFailureTime}`
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    try {
      return await this.execute(operation);
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        // Circuit is open, use fallback
        return await fallback();
      }
      throw error;
    }
  }

  /**
   * Check if circuit allows requests
   */
  isAvailable(): boolean {
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      return true;
    }

    if (this.state === CircuitState.OPEN && this.circuitOpenedAt) {
      return Date.now() - this.circuitOpenedAt >= this.resetTimeout;
    }

    return false;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalAttempts: this.totalAttempts,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      circuitOpenedAt: this.circuitOpenedAt,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transition(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.circuitOpenedAt = null;
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transition(CircuitState.OPEN);
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.transition(CircuitState.CLOSED);
  }

  // Private methods

  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.transition(CircuitState.CLOSED);
        this.failureCount = 0;
        this.successCount = 0;
        this.circuitOpenedAt = null;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediate open on failure in HALF_OPEN
      this.transition(CircuitState.OPEN);
      this.successCount = 0;
      this.circuitOpenedAt = Date.now();
      this.scheduleReset();
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      // Open circuit after threshold
      this.transition(CircuitState.OPEN);
      this.circuitOpenedAt = Date.now();
      this.scheduleReset();
    }
  }

  private transition(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    console.log(`[${this.name}] Circuit breaker state: ${oldState} → ${newState}`, {
      failures: this.failureCount,
      successes: this.successCount,
      totalAttempts: this.totalAttempts,
    });
  }

  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transition(CircuitState.HALF_OPEN);
        this.successCount = 0;
      }
    }, this.resetTimeout);
  }
}

/**
 * Create a circuit breaker with Redis-specific defaults
 */
export function createRedisCircuitBreaker(): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    successThreshold: 2,
    name: 'Redis',
  });
}

/**
 * Create a circuit breaker with database-specific defaults
 */
export function createDatabaseCircuitBreaker(): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    successThreshold: 2,
    name: 'Database',
  });
}

/**
 * Create a circuit breaker with AI service-specific defaults
 */
export function createAIServiceCircuitBreaker(): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 120000, // 2 minutes
    successThreshold: 3,
    name: 'AIService',
  });
}
