/**
 * Next.js Middleware — Rate Limiting + Supabase PKCE Auth
 *
 * Execution order:
 *   1. Rate limiting (returns 429 if exceeded)
 *   2. Supabase session refresh (PKCE token rotation)
 *   3. Auth redirect (unauthenticated users → /auth/login)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

const isDev = process.env.NODE_ENV === 'development';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    // nonce replaces unsafe-inline; strict-dynamic trusts scripts loaded by trusted scripts.
    // unsafe-eval kept in dev only (Turbopack source maps).
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      isDev ? "'unsafe-eval'" : null,
      'https://accounts.google.com',
      'https://va.vercel-scripts.com',  // Vercel Analytics
    ].filter(Boolean).join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    // wss: required for Supabase Realtime; *.ingest.sentry.io for error reporting (o* prefix is not valid CSP wildcard syntax)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://accounts.google.com https://*.ingest.sentry.io https://va.vercel-scripts.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].filter(Boolean).join('; ');
}

// ---------------------------------------------------------------------------
// Routes that do NOT require authentication
// ---------------------------------------------------------------------------
const PUBLIC_PATHS = [
  '/auth',
  '/api/health',
  '/api/cron',
  '/monitoring',  // Sentry tunnel
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // 1. Rate limiting — runs BEFORE auth to reject abusive traffic early
  // ------------------------------------------------------------------
  const rateLimitResult = checkRateLimit(request);

  if (rateLimitResult !== null && !rateLimitResult.success) {
    const retryAfter = Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000));

    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.reset),
          'Retry-After': String(retryAfter),
        },
      },
    );
  }

  // ------------------------------------------------------------------
  // 2. Supabase session refresh (PKCE token rotation)
  //    Nonce is threaded via forwarded request headers so Server Components
  //    can read it via headers() from next/headers.
  // ------------------------------------------------------------------
  const nonce = generateNonce();
  const { response, user } = await updateSession(request, { 'x-nonce': nonce });

  // Attach rate-limit headers to successful responses so clients can
  // monitor their remaining budget.
  if (rateLimitResult !== null) {
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));
  }

  // Set CSP with per-request nonce on the response (enforced by browser)
  response.headers.set('Content-Security-Policy', buildCSP(nonce));

  // ------------------------------------------------------------------
  // 3. Auth guard — redirect unauthenticated users to login
  // ------------------------------------------------------------------
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — skip static assets, images, and favicon
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico (browser icon)
     * - public folder assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
