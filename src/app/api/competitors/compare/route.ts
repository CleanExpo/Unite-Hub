import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * POST /api/competitors/compare
 * Compare multiple competitors side-by-side
 */
export async function POST(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const body = await request.json();
    const { competitorIds } = body;

    if (!competitorIds || !Array.isArray(competitorIds)) {
      return NextResponse.json(
        { error: "competitorIds array is required" },
        { status: 400 }
      );
    }

    if (competitorIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 competitors required for comparison" },
        { status: 400 }
      );
    }

    const comparison = await fetchQuery(api.competitors.compareCompetitors, {
      competitorIds: competitorIds as Id<"competitors">[],
    });

    return NextResponse.json({ success: true, comparison });
  } catch (error: any) {
    console.error("Error comparing competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compare competitors" },
      { status: 500 }
    );
  }
}
