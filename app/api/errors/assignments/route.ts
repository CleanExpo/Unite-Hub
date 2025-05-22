import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const errorId = searchParams.get("errorId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Build query
    let query = supabase
      .from("error_assignments_view")
      .select("*")
      .order("assigned_at", { ascending: false })
      .limit(limit)

    // Apply filters
    if (userId) {
      query = query.eq("assigned_to", userId)
    }

    if (status) {
      query = query.eq("assignment_status", status)
    }

    if (errorId) {
      query = query.eq("error_id", errorId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching assignments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in assignments endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
