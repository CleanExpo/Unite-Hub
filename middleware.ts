import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Extract locale from path (if present)
  const pathname = req.nextUrl.pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/)
  const locale = localeMatch ? localeMatch[1] : null
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || '/') : pathname

  // Check auth condition - handle both locale and non-locale paths
  const isAuthRoute =
    pathWithoutLocale.startsWith("/login") ||
    pathWithoutLocale.startsWith("/register") ||
    pathWithoutLocale.startsWith("/forgot-password") ||
    pathWithoutLocale.startsWith("/reset-password") ||
    pathWithoutLocale.startsWith("/update-password")

  const isApiRoute = pathname.startsWith("/api")
  const isRootRoute = pathWithoutLocale === "/"
  const isTestRoute = pathWithoutLocale.startsWith("/auth-test")
  const isStaticRoute = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/images") || pathname.startsWith("/public")
  
  const isPublicPageRoute = 
    pathWithoutLocale === "/" ||
    pathWithoutLocale === "/features" ||
    pathWithoutLocale === "/pricing" ||
    pathWithoutLocale === "/contact" ||
    pathWithoutLocale === "/about" ||
    pathWithoutLocale === "/privacy" ||
    pathWithoutLocale === "/terms" ||
    pathWithoutLocale === "/blog" ||
    pathWithoutLocale === "/case-studies" ||
    pathWithoutLocale === "/book-consultation"

  const isPublicRoute =
    isAuthRoute || isApiRoute || isRootRoute || isTestRoute || isPublicPageRoute || isStaticRoute

  // If user is signed in and trying to access auth page, redirect to dashboard
  if (session && isAuthRoute) {
    const dashboardUrl = locale ? `/${locale}/dashboard` : "/dashboard"
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // If user is not signed in and trying to access a protected page, redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = locale ? `/${locale}/login` : "/login"
    return NextResponse.redirect(new URL(loginUrl, req.url))
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
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
