import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth condition
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password")

  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  const isRootRoute = req.nextUrl.pathname === "/"
  const isTestRoute = req.nextUrl.pathname.startsWith("/auth-test")
  const isPublicPageRoute = 
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/features" ||
    req.nextUrl.pathname === "/pricing" ||
    req.nextUrl.pathname === "/contact" ||
    req.nextUrl.pathname === "/about"
  const isPublicRoute =
    isAuthRoute || isApiRoute || isRootRoute || isTestRoute || isPublicPageRoute || req.nextUrl.pathname.startsWith("/_next")

  // If user is signed in and trying to access auth page, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If user is not signed in and trying to access a protected page, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
