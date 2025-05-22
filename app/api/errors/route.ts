// Update the import path to the correct location
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const severity = searchParams.get("severity")
    const category = searchParams.get("category")
    const resolved = searchParams.get("resolved")
    const assigned = searchParams.get("assigned")
    const search = searchParams.get("search")

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabase
      .from("error_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    // Apply filters
    if (severity) {
      query = query.eq("severity", severity)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (resolved !== null && resolved !== undefined) {
      query = query.eq("resolved", resolved === "true")
    }
    
    if (assigned !== null && assigned !== undefined) {
      if (assigned === "true") {
        query = query.not("assigned_to", "is", null)
      } else if (assigned === "false") {
        query = query.is("assigned_to", null)
      } else if (assigned === "pending" || assigned === "accepted" || assigned === "completed") {
        query = query.eq("assignment_status", assigned)
      }
    }

    if (search) {
      query = query.or(`message.ilike.%${search}%,stack_trace.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching error logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("error_logs")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error creating error log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
