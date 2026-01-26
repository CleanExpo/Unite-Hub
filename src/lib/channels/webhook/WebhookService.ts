/**
 * Webhook Service
 *
 * Reliable webhook execution with retry logic and error handling
 *
 * Features:
 * - Multiple HTTP methods (GET, POST, PUT, DELETE, PATCH)
 * - Custom headers and authentication
 * - Retry with exponential backoff
 * - Timeout configuration
 * - Payload signing (HMAC-SHA256)
 * - Response validation
 *
 * @module channels/webhook/WebhookService
 */

import { createApiLogger } from '@/lib/logger';
import crypto from 'crypto';

const logger = createApiLogger({ service: 'WebhookService' });

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface WebhookOptions {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  payload?: any;
  timeout?: number; // milliseconds
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  authentication?: WebhookAuth;
  signPayload?: boolean;
  validateResponse?: (response: any) => boolean;
  metadata?: Record<string, any>;
}

export interface WebhookAuth {
  type: 'bearer' | 'basic' | 'api-key' | 'hmac';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  secret?: string; // For HMAC signing
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: any;
  retries?: number;
  duration?: number; // milliseconds
  timestamp: Date;
}

// ============================================================================
// Configuration
// ============================================================================

const defaultConfig = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 1000,
  webhookSecret: process.env.WEBHOOK_SECRET || 'unite-hub-webhook-secret',
};

// ============================================================================
// Main API
// ============================================================================

/**
 * Execute webhook with retry logic
 */
export async function executeWebhook(options: WebhookOptions): Promise<WebhookResult> {
  const startTime = Date.now();

  logger.info('Executing webhook', {
    url: options.url,
    method: options.method,
  });

  // Validate options
  const validation = validateOptions(options);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', '),
      timestamp: new Date(),
    };
  }

  const maxRetries = options.maxRetries ?? (options.retryOnFailure ? defaultConfig.maxRetries : 0);
  let lastError: any = null;

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.info('Webhook attempt', { attempt: attempt + 1, maxRetries: maxRetries + 1 });

      const result = await executeWebhookOnce(options);

      // Success
      if (result.success) {
        const duration = Date.now() - startTime;

        logger.info('Webhook executed successfully', {
          url: options.url,
          duration,
          retries: attempt,
        });

        return {
          ...result,
          retries: attempt,
          duration,
        };
      }

      // Failed but might retry
      lastError = result.error;

      // Don't retry on client errors (4xx)
      if (result.statusCode && result.statusCode >= 400 && result.statusCode < 500) {
        logger.warn('Webhook failed with client error, not retrying', {
          statusCode: result.statusCode,
        });
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = (options.retryDelayMs || defaultConfig.retryDelayMs) * Math.pow(2, attempt);
        logger.info('Retrying webhook after delay', { delay });
        await sleep(delay);
      }
    } catch (error) {
      lastError = error;
      logger.error('Webhook attempt failed', { error, attempt });

      // Wait before retry
      if (attempt < maxRetries) {
        const delay = (options.retryDelayMs || defaultConfig.retryDelayMs) * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const duration = Date.now() - startTime;

  logger.error('Webhook failed after all retries', {
    url: options.url,
    error: lastError,
    retries: maxRetries,
  });

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    retries: maxRetries,
    duration,
    timestamp: new Date(),
  };
}

/**
 * Execute webhook once (no retry)
 */
async function executeWebhookOnce(options: WebhookOptions): Promise<WebhookResult> {
  const { url, method, payload, timeout = defaultConfig.timeout } = options;

  try {
    // Build headers
    const headers = buildHeaders(options);

    // Build request options
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for POST, PUT, PATCH
    if (payload && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(payload);
    }

    // Execute request
    const response = await fetch(url, fetchOptions);

    // Parse response
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check if response is successful
    const isSuccess = response.ok;

    // Validate response if validator provided
    if (isSuccess && options.validateResponse) {
      const isValid = options.validateResponse(responseData);
      if (!isValid) {
        return {
          success: false,
          statusCode: response.status,
          response: responseData,
          error: 'Response validation failed',
          timestamp: new Date(),
        };
      }
    }

    return {
      success: isSuccess,
      statusCode: response.status,
      response: responseData,
      error: isSuccess ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Webhook execution error', { error, url });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build request headers
 */
function buildHeaders(options: WebhookOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Unite-Hub/1.0',
    ...options.headers,
  };

  // Add authentication
  if (options.authentication) {
    const auth = options.authentication;

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;

      case 'basic':
        if (auth.username && auth.password) {
          const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;

      case 'api-key':
        if (auth.apiKey && auth.apiKeyHeader) {
          headers[auth.apiKeyHeader] = auth.apiKey;
        }
        break;

      case 'hmac':
        // HMAC signature added to payload
        break;
    }
  }

  // Add payload signature
  if (options.signPayload && options.payload) {
    const signature = signPayload(options.payload, options.authentication?.secret);
    headers['X-Webhook-Signature'] = signature;
  }

  return headers;
}

/**
 * Sign payload with HMAC-SHA256
 */
function signPayload(payload: any, secret?: string): string {
  const payloadString = JSON.stringify(payload);
  const secretKey = secret || defaultConfig.webhookSecret;

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(payloadString);

  return hmac.digest('hex');
}

/**
 * Validate webhook options
 */
function validateOptions(options: WebhookOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!options.url || !isValidUrl(options.url)) {
    errors.push('Valid URL is required');
  }

  if (!options.method) {
    errors.push('HTTP method is required');
  }

  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (options.method && !validMethods.includes(options.method)) {
    errors.push(`Invalid HTTP method: ${options.method}`);
  }

  if (options.timeout && (options.timeout < 0 || options.timeout > 120000)) {
    errors.push('Timeout must be between 0 and 120000 ms');
  }

  if (options.authentication) {
    const auth = options.authentication;

    if (auth.type === 'bearer' && !auth.token) {
      errors.push('Bearer token is required for bearer authentication');
    }

    if (auth.type === 'basic' && (!auth.username || !auth.password)) {
      errors.push('Username and password are required for basic authentication');
    }

    if (auth.type === 'api-key' && (!auth.apiKey || !auth.apiKeyHeader)) {
      errors.push('API key and header name are required for API key authentication');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if string is valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Webhook Event Logging
// ============================================================================

export interface WebhookEvent {
  id: string;
  campaignId?: string;
  enrollmentId?: string;
  contactId?: string;
  url: string;
  method: HttpMethod;
  statusCode?: number;
  success: boolean;
  retries: number;
  duration: number;
  error?: string;
  timestamp: Date;
}

/**
 * Log webhook execution for analytics
 */
export async function logWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    // TODO: Store in database (webhook_events table)
    logger.info('Webhook event logged', {
      url: event.url,
      success: event.success,
      duration: event.duration,
    });
  } catch (error) {
    logger.error('Failed to log webhook event', { error });
  }
}

// ============================================================================
// Webhook Verification (for incoming webhooks)
// ============================================================================

/**
 * Verify incoming webhook signature
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret?: string
): boolean {
  const expectedSignature = signPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
