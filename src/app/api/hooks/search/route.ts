import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/hooks/search - Search hooks across all clients
export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const minScore = parseFloat(searchParams.get("min_score") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // In production, search hooks from database
    // For now, return mock search results
    const searchResults = [
      {
        id: crypto.randomUUID(),
        hook_text: "What if you could double your results?",
        category: "question",
        platform: "facebook",
        performance_score: 0.85,
        match_score: 0.9,
        client_name: "Sample Client",
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        hook_text: "The secret to explosive growth revealed",
        category: "curiosity",
        platform: "instagram",
        performance_score: 0.78,
        match_score: 0.75,
        client_name: "Another Client",
        created_at: new Date(),
      },
    ];

    // Filter by category if provided
    let filteredResults = category
      ? searchResults.filter((h: any) => h.category === category)
      : searchResults;

    // Filter by platform if provided
    filteredResults = platform
      ? filteredResults.filter((h: any) => h.platform === platform)
      : filteredResults;

    // Filter by minimum score
    filteredResults = filteredResults.filter(
      (h: any) => h.performance_score >= minScore
    );

    // Apply limit
    filteredResults = filteredResults.slice(0, limit);

    return NextResponse.json({
      results: filteredResults,
      total: filteredResults.length,
      query,
    });
  } catch (error) {
    console.error("Error searching hooks:", error);
    return NextResponse.json(
      { error: "Failed to search hooks" },
      { status: 500 }
    );
  }
}
