import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes, redirect to login
  const protectedRoutes = ["/dashboard", "/profile", "/onboarding"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL("/auth/signin", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists and user is trying to access auth routes, redirect to dashboard
  const authRoutes = ["/auth/signin", "/auth/signup"]
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is authenticated, check onboarding status for protected routes
  if (session && isProtectedRoute && request.nextUrl.pathname !== "/onboarding") {
    // Get user profile to check onboarding status
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", session.user.id)
      .single()

    // If onboarding is not completed and user is not on onboarding page, redirect to onboarding
    if ((!profile || !profile.onboarding_completed) && request.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/auth/:path*", "/onboarding/:path*"],
}
