import { cache } from "@/lib/cache"

/**
 * Invalidate the error statistics cache
 */
export async function invalidateErrorStatisticsCache() {
  try {
    cache.delete("error-statistics")

    // Optionally, you could also make a request to pre-warm the cache
    // await fetch("/api/errors/statistics")

    return { success: true }
  } catch (error) {
    console.error("Error invalidating error statistics cache:", error)
    return { success: false, error }
  }
}
