import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

/**
 * GET /api/competitors/analysis/latest?clientId=xxx
 * Get the latest competitor analysis for a client
 */
export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const analysis = await fetchQuery(api.competitors.getLatestAnalysis, {
      clientId: clientId as Id<"clients">,
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "No analysis found for this client" },
        { status: 404 }
      );
    }

    // Fetch the competitors that were analyzed
    const competitors = await Promise.all(
      analysis.competitorsAnalyzed.map((id) =>
        fetchQuery(api.competitors.getCompetitor, { competitorId: id })
      )
    );

    return NextResponse.json({
      success: true,
      analysis,
      competitors: competitors.filter((c) => c !== null),
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching latest analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
