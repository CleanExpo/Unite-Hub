import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get("groupBy") || "severity" // severity or category
    const days = Number.parseInt(searchParams.get("days") || "90")

    // Validate groupBy
    if (!["severity", "category"].includes(groupBy)) {
      return NextResponse.json({ error: "Invalid groupBy. Must be one of: severity, category" }, { status: 400 })
    }

    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "Invalid days. Must be between 1 and 365" }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = createClient()

    const query = `
      WITH resolved_errors AS (
        SELECT 
          ${groupBy},
          EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as resolution_hours
        FROM 
          error_logs
        WHERE 
          resolved = true 
          AND resolved_at IS NOT NULL
          AND created_at >= $1
      )
      SELECT 
        ${groupBy},
        COUNT(*) as count,
        AVG(resolution_hours) as avg_resolution_time,
        MIN(resolution_hours) as min_resolution_time,
        MAX(resolution_hours) as max_resolution_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolution_hours) as median_resolution_time
      FROM 
        resolved_errors
      GROUP BY 
        ${groupBy}
      ORDER BY 
        avg_resolution_time DESC
    `

    const { data, error } = await supabase.rpc("get_error_resolution_times_by_type", {
      group_by_field: groupBy,
      start_date: startDate.toISOString(),
    })

    if (error) {
      console.error("Error fetching resolution times with RPC:", error)

      // Fallback to raw SQL if RPC fails
      const { data: rawData, error: rawError } = await supabase.query(query, [startDate.toISOString()])

      if (rawError) {
        throw rawError
      }

      return NextResponse.json({ data: rawData || [] })
    }

    return NextResponse.json(
      { data: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching error resolution times:", error)
    return NextResponse.json({ error: "Failed to fetch error resolution times", data: [] }, { status: 500 })
  }
}
