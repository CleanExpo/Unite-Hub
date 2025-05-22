import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Step 1: Test registration
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = "password123"

    const { data: registerData, error: registerError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (registerError) {
      return NextResponse.json({ error: `Registration failed: ${registerError.message}` }, { status: 500 })
    }

    // Step 2: Test login with the test credentials
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (loginError) {
      return NextResponse.json({ error: `Login failed: ${loginError.message}` }, { status: 500 })
    }

    // Step 3: Test session data
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: `Session check failed: ${sessionError.message}` }, { status: 500 })
    }

    // Step 4: Test sign out
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      return NextResponse.json({ error: `Sign out failed: ${signOutError.message}` }, { status: 500 })
    }

    // Return test results
    return NextResponse.json({
      success: true,
      message: "Authentication flow test completed successfully",
      results: {
        registration: {
          success: true,
          user: registerData.user,
        },
        login: {
          success: true,
          user: loginData.user,
          session: loginData.session,
        },
        session: {
          success: true,
          session: sessionData.session,
        },
        signOut: {
          success: true,
        },
      },
      testCredentials: {
        email: testEmail,
        password: testPassword,
      },
    })
  } catch (error: any) {
    console.error("Error in auth flow test:", error)
    return NextResponse.json({ error: `Auth flow test failed: ${error.message}` }, { status: 500 })
  }
}
