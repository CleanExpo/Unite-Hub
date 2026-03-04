/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens and handles protected routes.
 */

import { NextResponse, type NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

/**
 * Verify JWT token with backend
 */
async function verifyToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Update session and handle authentication
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Get auth token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // Verify token if present
  let user: User | null = null;
  if (token) {
    user = await verifyToken(token);

    // Clear invalid token
    if (!user) {
      response.cookies.delete("auth_token");
    }
  }

  // Protected routes
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Validate redirect target is relative (prevent open redirect)
    const redirectPath = request.nextUrl.pathname;
    if (redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
      url.searchParams.set("redirect", redirectPath);
    }
    return NextResponse.redirect(url);
  }

  // Redirect logged in users away from auth pages
  const authPaths = ["/login", "/register"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    const redirect = request.nextUrl.searchParams.get("redirect");
    // Validate redirect is a safe relative path (prevent open redirect)
    const safePath =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/dashboard";
    url.pathname = safePath;
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return response;
}
