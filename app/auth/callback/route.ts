import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Check if this is a new user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single()

      // If this is a new user or they haven't completed onboarding, redirect to onboarding
      if (!profile || !profile.onboarding_completed) {
        // Create a basic profile record if it doesn't exist
        if (!profile) {
          await supabase.from("user_profiles").insert({
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
        }

        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin))
      }

      // Otherwise, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
    }
  }

  // Fallback to homepage
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
