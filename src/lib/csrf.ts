/**
 * CSRF Protection Utility
 * Validates Origin header matches Host for state-changing HTTP methods.
 * Applied in middleware for all /api/ routes (except webhooks).
 *
 * FIX (UNI-838): Added integration callback paths to exempt list and
 * allowed known deployment origins (NEXT_PUBLIC_URL, VERCEL_URL) so
 * POST requests on Vercel don't get rejected when Origin differs from
 * the Host header (e.g. custom domain vs .vercel.app).
 */

import type { NextRequest } from 'next/server';

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const EXEMPT_PATHS = [
  '/api/webhooks/',
  '/api/auth/callback',
  '/api/cron/',
  '/api/public/',
  '/api/integrations/gmail/callback',
  '/api/integrations/xero/callback',
  '/api/integrations/outlook/callback',
  '/api/integrations/ato/callback',
  '/api/seo/gsc/callback',
  '/api/seo/brave/callback',
];

/**
 * Build the set of allowed origin hostnames from environment variables.
 * Cached at module level so it's computed once per cold start.
 */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const envUrls = [
    process.env.NEXT_PUBLIC_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of envUrls) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).host);
    } catch {
      // skip malformed env values
    }
  }

  return origins;
}

const allowedOrigins = getAllowedOrigins();

export function validateCsrf(req: NextRequest): { valid: boolean; reason?: string } {
  // Only check mutating methods
  if (!MUTATING_METHODS.includes(req.method)) {
    return { valid: true };
  }

  // Skip exempt paths (webhooks, auth callbacks, cron, public, OAuth callbacks)
  const pathname = req.nextUrl.pathname;
  if (EXEMPT_PATHS.some(p => pathname.startsWith(p))) {
    return { valid: true };
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  // No origin header — could be server-to-server or same-origin navigation
  // Allow but log in production
  if (!origin) {
    return { valid: true };
  }

  // Parse origin to get hostname
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host; // includes port

    // Direct match: origin host === request host
    if (originHost === host) {
      return { valid: true };
    }

    // Allow known deployment origins (custom domain vs .vercel.app mismatch)
    if (allowedOrigins.has(originHost)) {
      return { valid: true };
    }

    // Allow localhost variants in development
    if (process.env.NODE_ENV === 'development') {
      const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0'];
      const originIsLocal = localhostVariants.some(h => originUrl.hostname === h);
      const hostIsLocal = host ? localhostVariants.some(h => host.startsWith(h)) : false;
      if (originIsLocal && hostIsLocal) {
        return { valid: true };
      }
    }

    return { valid: false, reason: `Origin ${origin} does not match Host ${host}` };
  } catch {
    return { valid: false, reason: `Invalid origin header: ${origin}` };
  }
}
