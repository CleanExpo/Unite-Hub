import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { cache } from "@/lib/cache"

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300

export async function GET(request: NextRequest) {
  try {
    // Get cache-control header from request
    const cacheControl = request.headers.get("cache-control")
    const noCache = cacheControl?.includes("no-cache") || false

    // Generate a cache key
    const cacheKey = "error-statistics"

    // If no-cache is specified, bypass the cache
    if (noCache) {
      return await fetchAndReturnStatistics()
    }

    // Try to get from cache or fetch fresh data
    const data = await cache.getOrSet(
      cacheKey,
      async () => {
        const result = await fetchStatisticsFromDB()
        return result
      },
      CACHE_TTL,
    )

    // Set cache headers
    const headers = new Headers()
    headers.set("Cache-Control", `public, max-age=${CACHE_TTL}`)
    headers.set("X-Cache", "HIT")

    return NextResponse.json(data, { headers })
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

// Helper function to fetch statistics from the database
async function fetchStatisticsFromDB() {
  const supabase = createClient()

  // Use the stored procedure to get all statistics at once
  const { data, error } = await supabase.rpc("get_error_statistics")

  if (error) {
    console.error("Error fetching statistics with stored procedure:", error)
    throw error
  }

  return (
    data || {
      totalCount: 0,
      severityCounts: [],
      categoryCounts: [],
      resolvedCounts: [],
      recentErrors: [],
    }
  )
}

// Helper function to fetch and return statistics
async function fetchAndReturnStatistics() {
  try {
    const data = await fetchStatisticsFromDB()

    // Set cache headers for a fresh response
    const headers = new Headers()
    headers.set("Cache-Control", `public, max-age=${CACHE_TTL}`)
    headers.set("X-Cache", "MISS")

    return NextResponse.json(data, { headers })
  } catch (error) {
    console.error("Error fetching fresh statistics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
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
