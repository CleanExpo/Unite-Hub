import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define paths that require authentication
const authRequiredPaths = ["/dashboard", "/profile", "/architecture", "/admin"]

// Define paths that require specific roles
const roleRequiredPaths = {
  "/admin": ["admin", "superadmin"],
  "/dashboard/architecture/branding": ["admin", "superadmin", "designer"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if path requires authentication
  const requiresAuth = authRequiredPaths.some((path) => pathname.startsWith(path))

  if (requiresAuth) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token, redirect to login
    if (!token) {
      const url = new URL(`/auth/signin`, request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    // Check role requirements
    for (const [path, roles] of Object.entries(roleRequiredPaths)) {
      if (pathname.startsWith(path)) {
        const userRole = token.role as string
        if (!roles.includes(userRole)) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/architecture/:path*", "/admin/:path*"],
}
