/**
 * Rate Limiter — In-memory sliding window for Edge Runtime
 *
 * Tiered limits:
 *   AI routes (/advisory, /campaigns, /coaches, /ai/): 5 req/min
 *   Auth routes (/auth): 10 req/min
 *   Standard API routes (/api/*): 30 req/min
 *   CRON routes (/api/cron): SKIP (validated by CRON_SECRET)
 *   Non-API routes: SKIP
 *
 * Uses Web APIs only — compatible with Next.js Edge Runtime.
 */

import { type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  reset: number;
}

interface SlidingWindowEntry {
  /** Timestamps (ms) of requests within the current window */
  timestamps: number[];
}

type Tier = 'ai' | 'auth' | 'standard';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000; // 1 minute sliding window
const CLEANUP_INTERVAL_MS = 60_000; // purge stale entries every 60 s

const TIER_LIMITS: Record<Tier, number> = {
  ai: 5,
  auth: 10,
  standard: 30,
};

// AI path fragments — checked with `pathname.includes()`
const AI_PATH_FRAGMENTS = ['/advisory', '/campaigns', '/coaches', '/ai/'] as const;

// ---------------------------------------------------------------------------
// In-memory store (per-isolate on Vercel Edge; single process in dev)
// ---------------------------------------------------------------------------

const store = new Map<string, SlidingWindowEntry>();

// ---------------------------------------------------------------------------
// Periodic cleanup — removes entries whose newest timestamp is older than
// the sliding window. Uses a module-scoped flag so we only schedule once.
// ---------------------------------------------------------------------------

let cleanupScheduled = false;

function scheduleCleanup(): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  // setInterval is available in the Edge Runtime (V8 isolates).
  setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, entry] of store) {
      // If the most recent timestamp is older than the window, drop it
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Tier classification
// ---------------------------------------------------------------------------

function classifyTier(pathname: string): Tier | null {
  // Non-API routes — no rate limiting
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/api')) return null;

  // CRON routes — skip (validated by CRON_SECRET)
  if (pathname.startsWith('/api/cron')) return null;

  // AI-heavy routes
  for (const fragment of AI_PATH_FRAGMENTS) {
    if (pathname.includes(fragment)) return 'ai';
  }

  // Auth routes
  if (pathname.includes('/auth')) return 'auth';

  // Everything else under /api/
  return 'standard';
}

// ---------------------------------------------------------------------------
// Client IP extraction
// ---------------------------------------------------------------------------

function getClientIp(request: NextRequest): string {
  // x-forwarded-for may contain a comma-separated list; take the first
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  // Vercel-specific header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback — should rarely happen behind a proxy
  return '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check rate limit for an incoming request.
 *
 * @returns `null` if rate limiting does not apply to this route, otherwise
 *          a `RateLimitResult` indicating whether the request is allowed.
 */
export function checkRateLimit(request: NextRequest): RateLimitResult | null {
  const pathname = new URL(request.url).pathname;
  const tier = classifyTier(pathname);

  // Route not subject to rate limiting
  if (tier === null) return null;

  // Ensure cleanup is running
  scheduleCleanup();

  const limit = TIER_LIMITS[tier];
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const ip = getClientIp(request);

  // Composite key: IP + tier (so AI and standard limits are independent)
  const key = `${ip}:${tier}`;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Evict timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const reset = Math.ceil((now + WINDOW_MS) / 1000); // next full reset in epoch seconds

  if (entry.timestamps.length >= limit) {
    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset,
  };
}
