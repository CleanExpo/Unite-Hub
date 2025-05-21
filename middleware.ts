import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Required environment variables:
// - NEXTAUTH_SECRET: Secret for NextAuth

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify",
    "/services",
    "/about",
    "/contact",
    "/blog",
    "/podcast",
  ]

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))

  // Special case for static files and API routes
  if (path.startsWith("/_next") || path.startsWith("/api/") || path.includes(".") || path.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect unauthenticated users to the login page for protected routes
  if (!token && !isPublicPath) {
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (token && (path.startsWith("/auth/signin") || path.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
