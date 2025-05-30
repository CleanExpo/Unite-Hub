import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname
  const supportedLocales = ['en', 'es', 'fr']
  const defaultLocale = 'en'

  // Check if the pathname starts with a supported locale
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/)
  const locale = localeMatch ? localeMatch[1] : null
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || '/') : pathname

  // Skip middleware for API routes and static files
  const isApiRoute = pathname.startsWith("/api")
  const isStaticRoute = pathname.startsWith("/_next") || 
                       pathname.startsWith("/favicon") || 
                       pathname.startsWith("/images") || 
                       pathname.startsWith("/public") ||
                       pathname.includes(".")

  if (isApiRoute || isStaticRoute) {
    return res
  }

  // If no locale is present and it's not a static file, redirect to default locale
  if (!locale || !supportedLocales.includes(locale)) {
    const newUrl = new URL(`/${defaultLocale}${pathname}`, req.url)
    return NextResponse.redirect(newUrl)
  }

  // Auth condition checks (for paths within locale)
  const isAuthRoute =
    pathWithoutLocale.startsWith("/login") ||
    pathWithoutLocale.startsWith("/register") ||
    pathWithoutLocale.startsWith("/forgot-password") ||
    pathWithoutLocale.startsWith("/reset-password") ||
    pathWithoutLocale.startsWith("/update-password")

  const isRootRoute = pathWithoutLocale === "/"
  
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

  const isPublicRoute = isAuthRoute || isRootRoute || isPublicPageRoute

  // If user is signed in and trying to access auth page, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url))
  }

  // If user is not signed in and trying to access a protected page, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
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
