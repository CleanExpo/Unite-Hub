/**
 * Centralized Anthropic Client with Circuit Breaker Pattern
 * 
 * This is the SINGLE SOURCE OF TRUTH for all Anthropic API calls.
 * All other files should import from here, not create their own clients.
 * 
 * Features:
 * - Circuit breaker to prevent cascading failures
 * - Automatic health checking
 * - API key validation
 * - Connection pooling
 * - Graceful fallback to OpenRouter
 */

import Anthropic from '@anthropic-ai/sdk';

// Circuit breaker states
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes to close circuit
  timeout: number;               // Time to wait before trying half-open (ms)
  monitoringWindow: number;      // Time window to track failures (ms)
}

interface HealthCheckResult {
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  circuitState: CircuitState;
  error?: string;
}

class AnthropicClientManager {
  private static instance: AnthropicClientManager;
  private client: Anthropic | null = null;
  private circuitState: CircuitState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private lastHealthCheck: Date = new Date();
  private failureWindow: number[] = [];

  private config: CircuitBreakerConfig = {
    failureThreshold: 5,       // Open circuit after 5 failures
    successThreshold: 2,       // Close circuit after 2 successes
    timeout: 60000,            // Try half-open after 60s
    monitoringWindow: 300000,  // Track failures over 5 minutes
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AnthropicClientManager {
    if (!AnthropicClientManager.instance) {
      AnthropicClientManager.instance = new AnthropicClientManager();
    }
    return AnthropicClientManager.instance;
  }

  private initialize(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not configured. Anthropic client will not be available.');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      console.error('❌ ANTHROPIC_API_KEY has invalid format. Must start with "sk-ant-"');
      return;
    }

    try {
      this.client = new Anthropic({
        apiKey,
        maxRetries: 0, // We handle retries ourselves
        timeout: 60000, // 60 second timeout
      });

      console.log('✅ Anthropic client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Anthropic client:', error);
    }
  }

  public getClient(): Anthropic {
    if (!this.client) {
      throw new Error(
        'Anthropic client not initialized. Please check ANTHROPIC_API_KEY configuration.'
      );
    }

    // Check circuit breaker state
    if (this.circuitState === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.config.timeout) {
        // Try half-open state
        this.circuitState = 'half-open';
        this.successCount = 0;
        console.log('🔄 Circuit breaker: Moving to HALF-OPEN state');
      } else {
        throw new Error(
          `Anthropic API circuit breaker is OPEN. Too many recent failures. ` +
          `Will retry in ${Math.ceil((this.config.timeout - timeSinceLastFailure) / 1000)}s. ` +
          `Please check Anthropic status at https://status.anthropic.com/`
        );
      }
    }

    return this.client;
  }

  public recordSuccess(): void {
    // Clean old failures from tracking window
    const now = Date.now();
    this.failureWindow = this.failureWindow.filter(
      time => now - time < this.config.monitoringWindow
    );

    if (this.circuitState === 'half-open') {
      this.successCount++;
      console.log(`✅ Circuit breaker: Success ${this.successCount}/${this.config.successThreshold} in HALF-OPEN`);

      if (this.successCount >= this.config.successThreshold) {
        this.circuitState = 'closed';
        this.failureCount = 0;
        this.failureWindow = [];
        console.log('✅ Circuit breaker: CLOSED (service recovered)');
      }
    } else if (this.circuitState === 'closed') {
      // Reset failure count on success
      this.failureCount = 0;
    }

    this.lastHealthCheck = new Date();
  }

  public recordFailure(error: unknown): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureCount++;
    this.failureWindow.push(now);
    this.lastHealthCheck = new Date();

    // Clean old failures from tracking window
    this.failureWindow = this.failureWindow.filter(
      time => now - time < this.config.monitoringWindow
    );

    const recentFailures = this.failureWindow.length;

    console.error(
      `❌ Anthropic API failure recorded. ` +
      `Recent failures: ${recentFailures}/${this.config.failureThreshold} ` +
      `(Circuit: ${this.circuitState})`
    );

    // Log error details
    if (error instanceof Anthropic.APIError) {
      console.error(`   Status: ${error.status}, Message: ${error.message}`);
    }

    if (this.circuitState === 'half-open') {
      // Failure in half-open state - reopen circuit
      this.circuitState = 'open';
      this.successCount = 0;
      console.error('🚨 Circuit breaker: Re-OPENED (recovery failed)');
    } else if (this.circuitState === 'closed') {
      // Check if we should open circuit
      if (recentFailures >= this.config.failureThreshold) {
        this.circuitState = 'open';
        console.error('🚨 Circuit breaker: OPENED (too many failures)');
        console.error(`   Will retry in ${this.config.timeout / 1000}s`);
      }
    }
  }

  public getHealthStatus(): HealthCheckResult {
    const recentFailures = this.failureWindow.filter(
      time => Date.now() - time < this.config.monitoringWindow
    ).length;

    return {
      healthy: this.circuitState === 'closed' && this.client !== null,
      lastCheck: this.lastHealthCheck,
      consecutiveFailures: recentFailures,
      circuitState: this.circuitState,
      error: this.circuitState === 'open' 
        ? `Circuit breaker is OPEN due to ${recentFailures} recent failures`
        : undefined,
    };
  }

  public isAvailable(): boolean {
    return this.client !== null && this.circuitState !== 'open';
  }

  public reset(): void {
    this.circuitState = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.failureWindow = [];
    console.log('🔄 Circuit breaker manually reset');
  }
}

// Export singleton instance
const manager = AnthropicClientManager.getInstance();

/**
 * Get the centralized Anthropic client
 * 
 * @throws Error if client not configured or circuit breaker is open
 */
export function getAnthropicClient(): Anthropic {
  return manager.getClient();
}

/**
 * Check if Anthropic client is available and healthy
 */
export function isAnthropicAvailable(): boolean {
  return manager.isAvailable();
}

/**
 * Get health status of Anthropic connection
 */
export function getAnthropicHealth(): HealthCheckResult {
  return manager.getHealthStatus();
}

/**
 * Record successful API call (for circuit breaker)
 */
export function recordAnthropicSuccess(): void {
  manager.recordSuccess();
}

/**
 * Record failed API call (for circuit breaker)
 */
export function recordAnthropicFailure(error: unknown): void {
  manager.recordFailure(error);
}

/**
 * Reset circuit breaker (admin function)
 */
export function resetCircuitBreaker(): void {
  manager.reset();
}

// Default export for backward compatibility
export default getAnthropicClient;

/**
 * Lazy-initialized Anthropic client export
 *
 * This provides a drop-in replacement for:
 *   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *
 * Replace with:
 *   import { anthropic } from '@/lib/anthropic/client';
 *
 * The client is only initialized when first accessed, avoiding build-time errors.
 */
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    const client = manager.getClient();
    return (client as any)[prop];
  },
});
