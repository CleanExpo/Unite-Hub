import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "day"
    const days = Number.parseInt(searchParams.get("days") || "30")

    // Validate period
    if (!["hour", "day", "week", "month"].includes(period)) {
      return NextResponse.json({ error: "Invalid period. Must be one of: hour, day, week, month" }, { status: 400 })
    }

    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "Invalid days. Must be between 1 and 365" }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = createClient()

    // Use the get_error_trends_by_time_period function
    const { data, error } = await supabase.rpc("get_error_trends_by_time_period", {
      start_date: startDate.toISOString(),
      end_date: new Date().toISOString(),
      interval_type: period,
    })

    if (error) throw error

    // Format the data for the chart
    const formattedData = data.map((item) => ({
      date: new Date(item.time_period).toISOString(),
      total: item.total_count,
      critical: item.critical_count,
      error: item.error_count,
      warning: item.warning_count,
      info: item.info_count,
      debug: item.debug_count,
      resolved: item.resolved_count,
    }))

    return NextResponse.json(
      { data: formattedData },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching error trends:", error)
    return NextResponse.json({ error: "Failed to fetch error trends" }, { status: 500 })
  }
}
