import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "Invalid days. Must be between 1 and 365" }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = createClient()

    // Query to get error distribution by day of week and hour of day
    const { data, error } = await supabase.rpc("get_error_heatmap_data", {
      start_date: startDate.toISOString(),
    })

    if (error) {
      console.error("Error fetching heatmap data with RPC:", error)

      // Fallback to raw SQL if RPC fails
      const query = `
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          EXTRACT(HOUR FROM created_at) as hour_of_day,
          COUNT(*) as count
        FROM 
          error_logs
        WHERE 
          created_at >= $1
        GROUP BY 
          day_of_week, hour_of_day
        ORDER BY 
          day_of_week, hour_of_day
      `

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
    console.error("Error fetching error heatmap data:", error)
    return NextResponse.json({ error: "Failed to fetch error heatmap data", data: [] }, { status: 500 })
  }
}
