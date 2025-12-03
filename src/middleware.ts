/**
 * Unite-Hub Middleware - PKCE Flow
 *
 * This middleware handles:
 * 1. Session validation (PKCE sessions are in cookies, accessible server-side)
 * 2. Role-based access control (RBAC)
 * 3. Security headers
 *
 * With PKCE, we can now properly protect routes server-side.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "./lib/auth/userTypes";
import { generateNonce, getEnvironmentCSP, NONCE_HEADER } from "./lib/security/csp";

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
  // Generate cryptographically secure nonce for CSP
  const nonce = generateNonce();

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Store nonce in custom header for Server Components to access
  response.headers.set(NONCE_HEADER, nonce);

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

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Public routes (no auth required) - includes marketing pages
  const publicPaths = ["/", "/pricing", "/landing", "/privacy", "/terms", "/security", "/support", "/api/auth", "/api/cron", "/api/webhooks", "/api/public"];
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // Marketing paths that logged-in founders/staff should bypass
  const marketingPaths = ["/", "/pricing", "/landing"];
  const isMarketingPath = marketingPaths.includes(pathname);

  // Protected route prefixes
  const protectedPrefixes = ["/dashboard", "/founder", "/staff", "/client", "/crm", "/synthex"];
  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  // Allow public paths for guests
  if (isPublicPath && !isAuthenticated) {
    return addSecurityHeaders(response, nonce);
  }

  // Allow auth paths for guests (prevent redirect loop)
  if (isAuthPath && !isAuthenticated) {
    return addSecurityHeaders(response, nonce);
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

        // Redirect from synthex (client dashboard) to founder
        if (pathname.startsWith('/synthex')) {
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
      // SECURITY FIX: Fail closed - redirect to error page instead of continuing
      // This prevents unauthenticated access during database outages
      const errorUrl = req.nextUrl.clone();
      errorUrl.pathname = '/error';
      errorUrl.searchParams.set('code', 'auth_error');
      errorUrl.searchParams.set('message', 'Authentication service temporarily unavailable');
      return NextResponse.redirect(errorUrl);
    }
  }

  return addSecurityHeaders(response, nonce);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
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

  // Content Security Policy with nonce (removes unsafe-inline)
  const cspHeader = getEnvironmentCSP(nonce);
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
    // Marketing pages (redirect authenticated users)
    "/",
    "/pricing",
    "/landing",
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
    "/synthex/:path*",
  ],
};
