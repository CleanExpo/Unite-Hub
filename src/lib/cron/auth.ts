/**
 * Cron Job Authentication Utilities
 *
 * Provides secure authentication for cron endpoints with:
 * - CRON_SECRET validation
 * - Timestamp validation (prevents replay attacks)
 * - Request logging
 *
 * @module cron/auth
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Result of cron authentication validation
 */
export interface CronAuthResult {
  /** Whether the request is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Error response to return if invalid */
  response?: NextResponse;
}

/**
 * Configuration for cron authentication
 */
export interface CronAuthConfig {
  /**
   * Time window in milliseconds for timestamp validation
   * Requests older than this will be rejected
   * @default 300000 (5 minutes)
   */
  timestampWindow?: number;

  /**
   * Whether to require timestamp header
   * If false, requests without timestamp will be allowed
   * @default false
   */
  requireTimestamp?: boolean;

  /**
   * Custom log prefix for this endpoint
   * @default 'Cron'
   */
  logPrefix?: string;
}

/**
 * Validates a cron request for authentication and freshness
 *
 * Checks:
 * 1. CRON_SECRET is configured in environment
 * 2. Authorization header matches CRON_SECRET
 * 3. Timestamp header is within allowed window (if provided/required)
 *
 * @param req - Next.js request object
 * @param config - Optional configuration
 * @returns Validation result with error response if invalid
 *
 * @example
 * // In cron API route:
 * import { validateCronRequest } from '@/lib/cron/auth';
 *
 * export async function GET(req: NextRequest) {
 *   const auth = validateCronRequest(req);
 *   if (!auth.valid) {
 *     return auth.response;
 *   }
 *
 *   // Proceed with cron job logic
 * }
 */
export function validateCronRequest(
  req: NextRequest,
  config: CronAuthConfig = {}
): CronAuthResult {
  const {
    timestampWindow = 300000, // 5 minutes
    requireTimestamp = false,
    logPrefix = 'Cron',
  } = config;

  // Check if CRON_SECRET is configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(`[${logPrefix}] CRON_SECRET not configured`);
    return {
      valid: false,
      error: 'Server configuration error',
      response: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }

  // Validate secret (minimum 32 characters recommended)
  if (cronSecret.length < 32) {
    console.warn(
      `[${logPrefix}] CRON_SECRET is less than 32 characters. ` +
      'Consider using a stronger secret.'
    );
  }

  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    console.warn(`[${logPrefix}] Missing authorization header`);
    return {
      valid: false,
      error: 'Missing authorization header',
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // Validate secret matches
  const expectedAuth = `Bearer ${cronSecret}`;
  if (authHeader !== expectedAuth) {
    console.warn(`[${logPrefix}] Invalid cron secret`);
    return {
      valid: false,
      error: 'Invalid cron secret',
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // Validate timestamp if provided or required
  const timestampHeader = req.headers.get('x-cron-timestamp');
  if (timestampHeader) {
    const timestamp = parseInt(timestampHeader, 10);
    const now = Date.now();
    const age = Math.abs(now - timestamp);

    if (isNaN(timestamp)) {
      console.warn(`[${logPrefix}] Invalid timestamp format: ${timestampHeader}`);
      return {
        valid: false,
        error: 'Invalid timestamp format',
        response: NextResponse.json(
          { error: 'Invalid timestamp' },
          { status: 400 }
        ),
      };
    }

    if (age > timestampWindow) {
      console.warn(
        `[${logPrefix}] Timestamp too old: ${age}ms (max: ${timestampWindow}ms)`
      );
      return {
        valid: false,
        error: 'Timestamp expired',
        response: NextResponse.json(
          { error: 'Timestamp expired' },
          { status: 401 }
        ),
      };
    }
  } else if (requireTimestamp) {
    console.warn(`[${logPrefix}] Missing required timestamp header`);
    return {
      valid: false,
      error: 'Missing timestamp header',
      response: NextResponse.json(
        { error: 'Missing timestamp' },
        { status: 400 }
      ),
    };
  }

  // All checks passed
  console.log(`[${logPrefix}] Request authenticated successfully`);
  return { valid: true };
}

/**
 * Middleware wrapper for cron endpoints
 *
 * Use this to wrap your cron handler for automatic authentication
 *
 * @example
 * import { withCronAuth } from '@/lib/cron/auth';
 *
 * async function handler(req: NextRequest) {
 *   // Your cron job logic here
 *   return NextResponse.json({ success: true });
 * }
 *
 * export const GET = withCronAuth(handler);
 */
export function withCronAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: CronAuthConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const auth = validateCronRequest(req, config);
    if (!auth.valid) {
      return auth.response!;
    }
    return handler(req);
  };
}

/**
 * Generate headers for calling cron endpoints
 *
 * Use this when making internal cron calls (e.g., from scripts)
 *
 * @returns Headers object with authorization and timestamp
 *
 * @example
 * import { getCronHeaders } from '@/lib/cron/auth';
 *
 * const response = await fetch('/api/cron/health-check', {
 *   headers: getCronHeaders(),
 * });
 */
export function getCronHeaders(): HeadersInit {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error('CRON_SECRET not configured');
  }

  return {
    'Authorization': `Bearer ${cronSecret}`,
    'X-Cron-Timestamp': Date.now().toString(),
  };
}
