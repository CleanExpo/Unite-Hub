import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Use a single SQL query to get all statistics
    const { data, error } = await supabase.rpc("get_error_statistics")

    if (error) {
      console.error("Error fetching statistics with RPC:", error)

      // Fallback to individual queries
      return await getStatisticsWithIndividualQueries(supabase)
    }

    if (!data) {
      console.error("No data returned from RPC")
      return await getStatisticsWithIndividualQueries(supabase)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in statistics endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        totalCount: 0,
        severityCounts: [],
        categoryCounts: [],
        resolvedCounts: [],
        recentErrors: [],
      },
      { status: 500 },
    )
  }
}

async function getStatisticsWithIndividualQueries(supabase: any) {
  try {
    // Get total count with raw SQL
    const { data: totalCountData, error: totalCountError } = await supabase
      .from("error_logs")
      .select("count(*)", { count: "exact" })

    const totalCount = totalCountData ? totalCountData.length : 0

    // Get severity counts with raw SQL
    const { data: severityCountsData, error: severityCountsError } = await supabase
      .from("error_logs")
      .select("severity")

    const severityCounts = []
    if (severityCountsData) {
      // Count occurrences of each severity
      const severityMap = new Map()
      severityCountsData.forEach((item) => {
        const count = severityMap.get(item.severity) || 0
        severityMap.set(item.severity, count + 1)
      })

      // Convert map to array
      severityMap.forEach((count, severity) => {
        severityCounts.push({ severity, count })
      })
    }

    // Get category counts with raw SQL
    const { data: categoryCountsData, error: categoryCountsError } = await supabase
      .from("error_logs")
      .select("category")

    const categoryCounts = []
    if (categoryCountsData) {
      // Count occurrences of each category
      const categoryMap = new Map()
      categoryCountsData.forEach((item) => {
        const count = categoryMap.get(item.category) || 0
        categoryMap.set(item.category, count + 1)
      })

      // Convert map to array
      categoryMap.forEach((count, category) => {
        categoryCounts.push({ category, count })
      })
    }

    // Get resolved counts with raw SQL
    const { data: resolvedCountsData, error: resolvedCountsError } = await supabase
      .from("error_logs")
      .select("resolved")

    const resolvedCounts = []
    if (resolvedCountsData) {
      // Count occurrences of each resolved status
      const resolvedMap = new Map()
      resolvedCountsData.forEach((item) => {
        const count = resolvedMap.get(item.resolved) || 0
        resolvedMap.set(item.resolved, count + 1)
      })

      // Convert map to array
      resolvedMap.forEach((count, resolved) => {
        resolvedCounts.push({ resolved, count })
      })
    }

    // Get recent errors (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentErrors, error: recentError } = await supabase
      .from("error_logs")
      .select("created_at, severity")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    return NextResponse.json({
      totalCount,
      severityCounts,
      categoryCounts,
      resolvedCounts,
      recentErrors: recentErrors || [],
    })
  } catch (error) {
    console.error("Error in getStatisticsWithIndividualQueries:", error)
    return NextResponse.json({
      totalCount: 0,
      severityCounts: [],
      categoryCounts: [],
      resolvedCounts: [],
      recentErrors: [],
    })
  }
}
