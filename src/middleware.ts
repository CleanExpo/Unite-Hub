import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  // This ensures the session stays fresh across browser restarts
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthenticated = !!session?.user;

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuthPath = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // IMPORTANT: With implicit OAuth flow, sessions are stored in localStorage (client-side only)
  // Middleware cannot see these sessions, so we CANNOT rely on server-side protection
  // Instead, we let all requests through and rely on client-side AuthContext to handle redirects

  // Only redirect to login if there's NO server-side session AND no existing redirectTo param
  // (to avoid redirect loops)
  const hasRedirectToParam = req.nextUrl.searchParams.has('redirectTo');

  // TEMPORARY: Disable dashboard protection entirely for implicit OAuth flow
  // Implicit flow stores sessions in localStorage only, not accessible to middleware
  // Dashboard pages will handle authentication client-side via AuthContext
  // This allows users coming from OAuth to land on dashboard successfully

  // Only protect dashboard if user is directly accessing (not from OAuth redirect)
  // if (isProtectedPath && !isAuthenticated && !hasRedirectToParam) {
  //   const redirectUrl = req.nextUrl.clone();
  //   redirectUrl.pathname = "/login";
  //   redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  // Redirect to dashboard if accessing auth pages while authenticated (PKCE flow only)
  // Don't redirect for implicit flow (no server-side session)
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
    "/login",
    "/register",
    "/forgot-password",
  ],
};
