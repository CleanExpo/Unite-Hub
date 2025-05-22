import { type NextRequest, NextResponse } from "next/server"
import { cache } from "@/lib/cache"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    // This is a simple example - you should implement proper authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the error statistics cache
    cache.delete("error-statistics")

    return NextResponse.json({ success: true, message: "Cache invalidated successfully" })
  } catch (error) {
    console.error("Error invalidating cache:", error)
    return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
  }
}
