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

  // Use getClaims() instead of getSession() - this is the secure way per Supabase docs
  // getClaims() validates the JWT locally without making API calls
  const { data: claims } = await supabase.auth.getClaims();

  const isAuthenticated = !!claims?.sub; // sub is the user ID from JWT

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
