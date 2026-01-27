/**
 * CSRF Protection Utility
 * Validates Origin header matches Host for state-changing HTTP methods.
 * Applied in middleware for all /api/ routes (except webhooks).
 */

import type { NextRequest } from 'next/server';

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const EXEMPT_PATHS = [
  '/api/webhooks/',
  '/api/auth/callback',
  '/api/cron/',
  '/api/public/',
];

export function validateCsrf(req: NextRequest): { valid: boolean; reason?: string } {
  // Only check mutating methods
  if (!MUTATING_METHODS.includes(req.method)) {
    return { valid: true };
  }

  // Skip exempt paths (webhooks, auth callbacks, cron, public)
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

    if (originHost === host) {
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
