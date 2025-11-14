import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Get the session token from cookies
  // Supabase stores the token with project-specific cookie name
  const token = req.cookies.get("sb-lksfwktwtmyznckodsau-auth-token")?.value;

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));

  // Auth pages that should redirect if already logged in
  const authPaths = ["/login", "/register", "/forgot-password"];
  const isAuthPath = authPaths.some((path) => req.nextUrl.pathname.startsWith(path));

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !token) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (isAuthPath && token) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
