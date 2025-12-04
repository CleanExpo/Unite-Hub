/**
 * Unite-Hub Middleware - Dual Portal Access Control
 *
 * This middleware handles:
 * 1. Session validation (PKCE sessions are in cookies, accessible server-side)
 * 2. Staff vs Client routing (Unite-Hub CRM vs Synthex Client Portal)
 * 3. Security headers
 *
 * Access Control:
 * - Staff (owner/admin/developer) → /crm/* (Unite-Hub CRM)
 * - Clients → /synthex/* or /client/* (Synthex Client Portal)
 * - Pending staff → /auth/await-approval
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "./lib/auth/userTypes";
import { generateNonce, getEnvironmentCSP, NONCE_HEADER } from "./lib/security/csp";

// Staff role type from staff_users table
type StaffRole = 'owner' | 'admin' | 'developer';
// StaffStatus type reserved for future staff status checking: 'active' | 'pending' | 'disabled'

/**
 * Normalize legacy role names to new UserRole enum
 */
function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) {
return 'CLIENT';
}
  const upperRole = role.toUpperCase();
  if (upperRole === 'FOUNDER' || upperRole === 'ADMIN' || role === 'admin') {
return 'FOUNDER';
}
  if (upperRole === 'STAFF') {
return 'STAFF';
}
  if (upperRole === 'CLIENT' || upperRole === 'CUSTOMER' || role === 'customer') {
return 'CLIENT';
}
  return 'CLIENT';
}

/**
 * Map staff role to UserRole for backwards compatibility
 */
function staffRoleToUserRole(staffRole: StaffRole | null): UserRole {
  if (!staffRole) {
return 'CLIENT';
}
  switch (staffRole) {
    case 'owner': return 'FOUNDER';
    case 'admin': return 'ADMIN';
    case 'developer': return 'STAFF';
    default: return 'CLIENT';
  }
}

/**
 * Get the default dashboard for a role
 */
function getDefaultDashboard(role: UserRole, isStaff: boolean): string {
  if (isStaff) {
    return '/crm/dashboard';
  }
  switch (role) {
    case 'FOUNDER': return '/crm/dashboard';
    case 'STAFF': return '/crm/dashboard';
    case 'ADMIN': return '/crm/dashboard';
    case 'CLIENT':
    default: return '/synthex/dashboard';
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

  // Get user role for authenticated users - check staff_users first, then profiles
  if (isAuthenticated) {
    try {
      // 1. Check if user is in staff_users table (Unite-Hub CRM access)
      const { data: staffUser } = await supabase
        .from('staff_users')
        .select('role, status')
        .eq('user_id', user.id)
        .maybeSingle();

      const isActiveStaff = staffUser?.status === 'active';
      const isPendingStaff = staffUser?.status === 'pending';
      const isDisabledStaff = staffUser?.status === 'disabled';

      // 2. Handle pending staff - redirect to await-approval page
      if (isPendingStaff) {
        if (pathname !== '/auth/await-approval') {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/auth/await-approval';
          return NextResponse.redirect(redirectUrl);
        }
        return addSecurityHeaders(response, nonce);
      }

      // 3. Handle disabled staff - treat as client
      if (isDisabledStaff) {
        // Fall through to client handling
      }

      // 4. Active staff - route to CRM
      if (isActiveStaff) {
        const userRole = staffRoleToUserRole(staffUser.role as StaffRole);

        // Redirect from marketing pages to CRM dashboard
        if (isMarketingPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/crm/dashboard';
          return NextResponse.redirect(redirectUrl);
        }

        // Redirect from Synthex (client portal) to CRM
        if (pathname.startsWith('/synthex') || pathname.startsWith('/client')) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/crm/dashboard';
          return NextResponse.redirect(redirectUrl);
        }

        // Redirect from old routes to CRM
        if (pathname.startsWith('/founder') || pathname.startsWith('/staff')) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/crm/dashboard';
          return NextResponse.redirect(redirectUrl);
        }

        // Allow CRM access
        if (pathname.startsWith('/crm')) {
          // Owner-only routes
          if (pathname.startsWith('/crm/staff') && staffUser.role !== 'owner') {
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = '/crm/dashboard';
            return NextResponse.redirect(redirectUrl);
          }
          return addSecurityHeaders(response, nonce);
        }

        // Redirect to CRM dashboard if accessing auth pages while authenticated
        if (isAuthPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = getDefaultDashboard(userRole, true);
          return NextResponse.redirect(redirectUrl);
        }

        return addSecurityHeaders(response, nonce);
      }

      // 5. Not staff - check profiles table for legacy role support
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = normalizeRole(profile?.role);

      // 6. CLIENT routing - block from CRM, route to Synthex
      // Block from CRM and staff areas
      if (pathname.startsWith('/crm') || pathname.startsWith('/founder') ||
          pathname.startsWith('/staff') || pathname === '/auth/await-approval') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/synthex/dashboard';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect from marketing to Synthex client dashboard
      if (isMarketingPath) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/synthex/dashboard';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect old /client routes to /synthex
      if (pathname.startsWith('/client')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = pathname.replace('/client', '/synthex');
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect to Synthex dashboard if accessing auth pages while authenticated
      if (isAuthPath) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = getDefaultDashboard(userRole, false);
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
