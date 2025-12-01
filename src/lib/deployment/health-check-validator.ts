/* eslint-disable no-undef */
/**
 * Health Check Validator - Retry logic for health check validation
 *
 * Purpose: Validate health checks with exponential backoff retry logic
 *
 * Features:
 * - Exponential backoff with configurable multiplier
 * - Timeout support per attempt
 * - Configurable max retries
 * - Detailed error tracking
 * - Used by deployment scripts for blue-green validation
 *
 * Integration:
 * - Called by deployment scripts to validate new deployment
 * - Validates /api/health endpoint returns healthy status
 * - Ensures graceful shutdown is working correctly
 */

export interface HealthCheckOptions {
  timeout?: number; // Timeout in milliseconds (default: 30000)
  maxRetries?: number; // Max retry attempts (default: 5)
  backoffMultiplier?: number; // Backoff multiplier (default: 1.5)
  initialDelay?: number; // Initial delay in ms (default: 1000)
}

export interface HealthCheckResult {
  healthy: boolean;
  attempts: number;
  lastError?: string;
  responseTime?: number;
  deployment?: string; // blue/green
  gracefulShutdown?: {
    enabled: boolean;
    acceptingRequests: boolean;
    activeConnections: number;
  };
}

export interface HealthResponse {
  status: string;
  deployment?: string;
  graceful_shutdown?: {
    enabled: boolean;
    accepting_requests: boolean;
    active_connections: number;
  };
  readiness?: boolean;
}

/**
 * Validate health check endpoint with retry logic
 */
export async function validateHealthCheck(
  url: string,
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const {
    timeout = 30000,
    maxRetries = 5,
    backoffMultiplier = 1.5,
    initialDelay = 1000,
  } = options;

  let attempts = 0;
  let lastError: string | undefined;
  let delay = initialDelay;

  while (attempts < maxRetries) {
    attempts++;

    try {
      const startTime = Date.now();

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Make health check request
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      // Check if response is OK
      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;

        // If it's a 503, the service is unhealthy but responding
        if (response.status === 503) {
          try {
            const data: HealthResponse = await response.json();
            lastError = `Service unhealthy: ${data.status}`;
          } catch {
            // Ignore JSON parse error
          }
        }

        // Wait before retry (unless last attempt)
        if (attempts < maxRetries) {
          await sleep(delay);
          delay = Math.floor(delay * backoffMultiplier);
        }
        continue;
      }

      // Parse response
      const data: HealthResponse = await response.json();

      // Check if status is healthy
      if (data.status !== 'healthy') {
        lastError = `Status: ${data.status}`;

        // Wait before retry (unless last attempt)
        if (attempts < maxRetries) {
          await sleep(delay);
          delay = Math.floor(delay * backoffMultiplier);
        }
        continue;
      }

      // Success! Return healthy result
      return {
        healthy: true,
        attempts,
        responseTime,
        deployment: data.deployment,
        gracefulShutdown: data.graceful_shutdown
          ? {
              enabled: data.graceful_shutdown.enabled,
              acceptingRequests: data.graceful_shutdown.accepting_requests,
              activeConnections: data.graceful_shutdown.active_connections,
            }
          : undefined,
      };
    } catch (error) {
      // Handle fetch errors (network, timeout, etc.)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = `Timeout after ${timeout}ms`;
        } else {
          lastError = error.message;
        }
      } else {
        lastError = 'Unknown error';
      }

      // Wait before retry (unless last attempt)
      if (attempts < maxRetries) {
        await sleep(delay);
        delay = Math.floor(delay * backoffMultiplier);
      }
    }
  }

  // All retries exhausted
  return {
    healthy: false,
    attempts,
    lastError: lastError || 'Unknown error',
  };
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate multiple health check endpoints
 * Useful for validating both blue and green deployments
 */
export async function validateMultipleHealthChecks(
  urls: string[],
  options: HealthCheckOptions = {}
): Promise<Map<string, HealthCheckResult>> {
  const results = new Map<string, HealthCheckResult>();

  // Validate all URLs in parallel
  const promises = urls.map(async (url) => {
    const result = await validateHealthCheck(url, options);
    results.set(url, result);
  });

  await Promise.all(promises);

  return results;
}
