/**
 * CSRF Protection
 * 
 * Cross-Site Request Forgery protection using double-submit cookie pattern.
 * Validates Origin header and CSRF tokens for all state-changing requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Methods that require CSRF protection
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Routes that should be excluded from CSRF checks
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/callback', // OAuth callbacks
  '/api/webhooks/', // External webhooks
  '/api/health', // Health checks
];

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for comparison
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Check if route is exempt from CSRF protection
 */
function isExemptRoute(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Validate Origin header matches Host
 * First line of defense against CSRF attacks
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    // If no origin header, check referer as fallback
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }
    // No origin or referer - might be same-origin request
    // Allow for GET/HEAD/OPTIONS
    return !STATE_CHANGING_METHODS.includes(request.method);
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Validate CSRF token from header matches cookie
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  // Constant-time comparison using hashes
  const hashedHeader = hashToken(tokenFromHeader);
  const hashedCookie = hashToken(tokenFromCookie);

  return hashedHeader === hashedCookie;
}

/**
 * CSRF protection middleware
 * Call this from your main middleware to protect API routes
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  const { pathname, method } = request.nextUrl;

  // Skip CSRF for exempt routes
  if (isExemptRoute(pathname)) {
    return null;
  }

  // Only protect state-changing methods
  if (!STATE_CHANGING_METHODS.includes(method)) {
    return null;
  }

  // Only protect API routes (adjust pattern as needed)
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // Step 1: Validate Origin header
  if (!validateOrigin(request)) {
    console.warn('CSRF: Origin validation failed', {
      pathname,
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Invalid origin',
        code: 'CSRF_ORIGIN_MISMATCH',
      },
      { status: 403 }
    );
  }

  // Step 2: Validate CSRF token (for API routes)
  if (!validateCsrfToken(request)) {
    console.warn('CSRF: Token validation failed', {
      pathname,
      hasHeader: !!request.headers.get(CSRF_HEADER_NAME),
      hasCookie: !!request.cookies.get(CSRF_COOKIE_NAME),
    });

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      },
      { status: 403 }
    );
  }

  // CSRF validation passed
  return null;
}

/**
 * Set CSRF token cookie in response
 * Call this to establish CSRF token for the session
 */
export function setCsrfTokenCookie(response: NextResponse): void {
  const token = generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request (for use in forms/AJAX)
 */
export function getCsrfToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * API route helper to get CSRF token
 * Use this in a GET /api/csrf-token endpoint
 */
export function createCsrfTokenResponse(): NextResponse {
  const token = generateCsrfToken();

  const response = NextResponse.json({
    token,
    headerName: CSRF_HEADER_NAME,
  });

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
