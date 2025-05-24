import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Test that our Supabase client is properly exported and working
    const supabase = await createClient()

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are not properly set",
          supabaseUrl: supabaseUrl ? "Set" : "Not set",
          supabaseAnonKey: supabaseAnonKey ? "Set" : "Not set",
        },
        { status: 500 },
      )
    }

    // Try a simple query to test connection
    // This will fail gracefully if the table doesn't exist yet
    const { data, error } = await supabase.from("profiles").select("count")

    return NextResponse.json({
      message: "Supabase client is working correctly",
      environmentVariables: {
        supabaseUrl: supabaseUrl.substring(0, 15) + "...",
        supabaseAnonKey: supabaseAnonKey.substring(0, 15) + "...",
      },
      queryResult: {
        data,
        error: error ? error.message : null,
      },
    })
  } catch (error: any) {
    console.error("Error testing Supabase client:", error)
    return NextResponse.json(
      {
        error: "Failed to test Supabase client",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
