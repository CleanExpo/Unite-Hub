import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Generate device fingerprint from user agent and IP
 * Uses Web Crypto API for Edge Runtime compatibility
 */
async function generateDeviceFingerprint(userAgent: string, ip: string): Promise<string> {
  const data = new TextEncoder().encode(`${userAgent}:${ip}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuthPath = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Public routes (no auth required)
  const publicPaths = ["/", "/privacy", "/terms", "/security", "/api/auth", "/api/cron", "/api/webhooks"];
  const isPublicPath = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Allow public paths to pass through
  if (isPublicPath) {
    return response;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user profile and role
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || 'customer';

    // RBAC: Route based on role
    if (userRole === 'admin') {
      // Admin user (Phill, Claire, Rana)
      const userAgent = req.headers.get('user-agent') || '';
      const ip = req.headers.get('x-forwarded-for') ||
                 req.headers.get('x-real-ip') ||
                 'unknown';

      const deviceFingerprint = await generateDeviceFingerprint(userAgent, ip);

      // Check if device is trusted
      const { data: trustedDevice } = await supabase
        .from('admin_trusted_devices')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('device_fingerprint', deviceFingerprint)
        .eq('is_trusted', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      // Check if there's a valid approval
      const { data: validApproval } = await supabase
        .from('admin_approvals')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('approved', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      // If no trust and no valid approval, redirect to await approval page
      if (!trustedDevice && !validApproval) {
        if (req.nextUrl.pathname === '/auth/await-approval') {
          return response; // Allow await-approval page
        }
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/auth/await-approval';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect to CRM if trying to access customer dashboard
      if (req.nextUrl.pathname.startsWith('/synthex') ||
          req.nextUrl.pathname === '/synthex/dashboard') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/crm';
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      // Customer user - restrict access to CRM
      if (req.nextUrl.pathname.startsWith('/crm') ||
          req.nextUrl.pathname.startsWith('/api/crm') ||
          req.nextUrl.pathname === '/auth/await-approval') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/synthex/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    console.error('Error in RBAC middleware:', error);
    // On error, continue to destination (fail open)
    return response;
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthPath && isAuthenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/overview";
    return NextResponse.redirect(redirectUrl);
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
    "/dashboard/:path*",
    "/crm/:path*",
    "/auth/:path*",
    "/synthex/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
