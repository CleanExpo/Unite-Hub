import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
    allEnvVars: Object.keys(process.env).filter((key) => key.startsWith("NEXT_") || key.startsWith("SUPABASE_")),
  })
}
