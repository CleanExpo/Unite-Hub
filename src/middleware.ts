import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "./lib/auth/userTypes";

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

  // Try to refresh the session on every request to maintain auth state
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthenticated = !!session?.user;
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

  // Allow public paths for guests
  if (isPublicPath && !isAuthenticated) {
    return response;
  }

  // If not authenticated and not on public path, redirect to login
  if (!isAuthenticated && !isPublicPath) {
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
        .eq('id', session.user.id)
        .single();

      const userRole = normalizeRole(profile?.role);

      // FOUNDER/ADMIN: Bypass marketing pages, go to founder dashboard
      if (userRole === 'FOUNDER' || userRole === 'ADMIN') {
        // Redirect from marketing/pricing to founder dashboard
        if (isMarketingPath) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/founder';
          return NextResponse.redirect(redirectUrl);
        }

        // Device trust check disabled for now - tables may not be set up
        // TODO: Re-enable when admin_trusted_devices and admin_approvals tables are populated
        // For MVP, founders have full access without device verification

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
      // On error, continue to destination (fail open)
      return response;
    }
  }

  // Add security headers to all responses
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
  matcher: [
    "/",
    "/pricing",
    "/landing",
    "/dashboard/:path*",
    "/founder/:path*",
    "/staff/:path*",
    "/client/:path*",
    "/crm/:path*",
    "/auth/:path*",
    "/synthex/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
