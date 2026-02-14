/**
 * Unite-Hub Middleware - PKCE Flow
 *
 * This middleware handles:
 * 1. Session validation (PKCE sessions are in cookies, accessible server-side)
 * 2. Role-based access control (RBAC)
 * 3. Security headers
 *
 * With PKCE, we can now properly protect routes server-side.
 *
 * Next.js 16 Middleware Pattern:
 * This file follows the standard Next.js middleware convention.
 * See: https://nextjs.org/docs/app/building-your-application/routing/middleware
 * The middleware.ts file pattern is the recommended approach for route protection.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "./lib/auth/userTypes";
import { validateCsrf } from "./lib/csrf";

/**
 * Normalize legacy role names to new UserRole enum
 */
function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return 'CLIENT';
  const upperRole = role.toUpperCase();
  if (upperRole === 'FOUNDER' || upperRole === 'ADMIN' || role === 'admin') return 'FOUNDER';
  if (upperRole === 'STAFF') return 'STAFF';
  if (upperRole === 'CLIENT' || upperRole === 'CUSTOMER' || role === 'customer') return 'CLIENT';
  return 'CLIENT';
}

/**
 * Get the default dashboard for a role
 */
function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case 'FOUNDER': return '/founder';
    case 'STAFF': return '/staff/dashboard';
    case 'ADMIN': return '/founder'; // Admin gets founder access
    case 'CLIENT':
    default: return '/client';
  }
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // ===== CSRF PROTECTION FOR API ROUTES =====
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const csrf = validateCsrf(req);
    if (!csrf.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', message: csrf.reason },
        { status: 403 }
      );
    }
    // API routes don't need RBAC middleware — return with security headers
    return addSecurityHeaders(response);
  }

  // ===== PLAYWRIGHT TEST MODE BYPASS =====
  // Allow E2E tests to bypass real Supabase auth
  // Tests set playwright-test-mode cookie to enable this
  const isTestMode = process.env.PLAYWRIGHT_TEST_MODE === 'true' ||
                     req.cookies.get('playwright-test-mode')?.value === 'true';

  if (isTestMode) {
    const testRole = req.cookies.get('playwright-test-role')?.value as UserRole | undefined;
    const pathname = req.nextUrl.pathname;

    // Debug logging for E2E tests
    console.log(`[MIDDLEWARE TEST MODE] Path: ${pathname}, Role: ${testRole || 'NONE'}`);

    // Public routes and auth pages - allow access
    const publicPaths = ["/", "/privacy", "/terms", "/security", "/support", "/api/auth", "/api/cron", "/api/webhooks", "/api/public"];
    const authPaths = ["/login", "/forgot-password", "/auth/signin"];
    const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

    if (isPublicPath || isAuthPath) {
      return addSecurityHeaders(response);
    }

    // Protected routes - require test role cookie
    const protectedPrefixes = ["/dashboard", "/founder", "/staff", "/client", "/crm"];
    const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isProtectedPath) {
      if (!testRole) {
        // No test role - redirect to login
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/login";
        return NextResponse.redirect(redirectUrl);
      }

      // Test role present - validate access
      if (testRole === 'STAFF' && pathname.startsWith('/founder')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/staff/dashboard';
        return NextResponse.redirect(redirectUrl);
      }

      if (testRole === 'CLIENT' && (pathname.startsWith('/founder') || pathname.startsWith('/staff'))) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/client';
        return NextResponse.redirect(redirectUrl);
      }

      // Access granted - continue
      return addSecurityHeaders(response);
    }

    // Not protected, not public - allow
    return addSecurityHeaders(response);
  }
  // ===== END TEST MODE BYPASS =====

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Use getUser() instead of getSession() for better security
  // getUser() validates the JWT with Supabase, getSession() only reads from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const isAuthenticated = !!user && !userError;
  const pathname = req.nextUrl.pathname;

  // Redirect /register to /login (no public signups — invite-only)
  if (pathname === '/register' || pathname.startsWith('/register/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/forgot-password"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Public routes (no auth required) - business showcase pages only
  const publicPaths = ["/", "/privacy", "/terms", "/security", "/support", "/api/auth", "/api/cron", "/api/webhooks", "/api/public"];
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // Marketing paths that logged-in founders/staff should bypass
  const marketingPaths = ["/", "/pricing", "/landing"];
  const isMarketingPath = marketingPaths.includes(pathname);

  // Protected route prefixes
  const protectedPrefixes = ["/dashboard", "/founder", "/staff", "/client", "/crm"];
  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  // Allow public paths for guests
  if (isPublicPath && !isAuthenticated) {
    return addSecurityHeaders(response);
  }

  // Allow auth paths for guests (prevent redirect loop)
  if (isAuthPath && !isAuthenticated) {
    return addSecurityHeaders(response);
  }

  // If not authenticated and trying to access protected path, redirect to login
  if (!isAuthenticated && isProtectedPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user profile and role for authenticated users
  if (isAuthenticated) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to gracefully handle missing profiles

      const userRole = normalizeRole(profile?.role); // Defaults to 'CLIENT' if no profile

      // FOUNDER/ADMIN: Bypass marketing pages, go to founder dashboard
      if (userRole === 'FOUNDER' || userRole === 'ADMIN') {
        // Redirect from marketing/pricing to founder dashboard
        if (isMarketingPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/founder';
          return NextResponse.redirect(redirectUrl);
        }

      }

      // STAFF: Bypass marketing pages, go to staff dashboard
      if (userRole === 'STAFF') {
        if (isMarketingPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/staff/dashboard';
          return NextResponse.redirect(redirectUrl);
        }

        // Block staff from founder-only areas
        if (pathname.startsWith('/founder')) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/staff/dashboard';
          return NextResponse.redirect(redirectUrl);
        }
      }

      // CLIENT: Restrict from founder/staff areas
      if (userRole === 'CLIENT') {
        if (pathname.startsWith('/founder') || pathname.startsWith('/staff') ||
            pathname.startsWith('/crm') || pathname === '/auth/await-approval') {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/client';
          return NextResponse.redirect(redirectUrl);
        }

        // Redirect from marketing to client dashboard
        if (isMarketingPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/client';
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Redirect to role-appropriate dashboard if accessing auth pages while authenticated
      if (isAuthPath) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = getDefaultDashboard(userRole);
        return NextResponse.redirect(redirectUrl);
      }

    } catch (error) {
      console.error('Error in RBAC middleware:', error);
      // On error, continue to destination (fail open)
      return addSecurityHeaders(response);
    }
  }

  return addSecurityHeaders(response);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Strict Transport Security (HTTPS only) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://api.anthropic.com https://apis.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  // With PKCE, sessions are in cookies and accessible server-side
  // We can now properly protect all routes
  matcher: [
    // Business showcase (redirect authenticated users to dashboard)
    "/",
    // Auth pages (redirect if already authenticated)
    "/login",
    "/register",
    "/forgot-password",
    // Protected routes (require authentication)
    "/dashboard/:path*",
    "/founder/:path*",
    "/staff/:path*",
    "/client/:path*",
    "/crm/:path*",
    // API routes (CSRF protection)
    "/api/:path*",
  ],
};
