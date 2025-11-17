import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

/**
 * POST /api/competitors
 * Create a new competitor
 */
export async function POST(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const body = await request.json();
    const {
      clientId,
      competitorName,
      website,
      description,
      category,
      strengths,
      weaknesses,
      pricing,
      targetAudience,
      marketingChannels,
      contentStrategy,
      socialPresence,
      logoUrl,
      screenshots,
    } = body;

    // Validate required fields
    if (!clientId || !competitorName || !website || !description || !category) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: clientId, competitorName, website, description, category",
        },
        { status: 400 }
      );
    }

    // Create competitor
    const competitorId = await fetchMutation(api.competitors.addCompetitor, {
      clientId: clientId as Id<"clients">,
      competitorName,
      website,
      description,
      category,
      strengths,
      weaknesses,
      pricing,
      targetAudience,
      marketingChannels,
      contentStrategy,
      socialPresence,
      logoUrl,
      screenshots,
    });

    return NextResponse.json({
      success: true,
      competitorId,
      message: "Competitor added successfully",
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
    console.error("Error creating competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create competitor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/competitors?clientId=xxx
 * Get all competitors for a client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const category = searchParams.get("category") as
      | "direct"
      | "indirect"
      | "potential"
      | null;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const competitors = await fetchQuery(api.competitors.getCompetitors, {
      clientId: clientId as Id<"clients">,
      category: category || undefined,
    });

    return NextResponse.json({ success: true, competitors });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}
