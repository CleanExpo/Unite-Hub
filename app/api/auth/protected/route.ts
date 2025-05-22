import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No active session" }, { status: 401 })
    }

    // User is authenticated, return protected data
    return NextResponse.json({
      message: "You have access to this protected endpoint",
      user: {
        id: session.user.id,
        email: session.user.email,
        lastSignIn: session.user.last_sign_in_at,
      },
      session: {
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error in protected API route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
