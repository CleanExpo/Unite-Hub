import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

/**
 * GET /api/competitors/[id]
 * Get a single competitor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id } = await params;
    const competitor = await fetchQuery(api.competitors.getCompetitor, {
      competitorId: id as Id<"competitors">,
    });

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, competitor });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch competitor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/competitors/[id]
 * Update a competitor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }
    const { id } = await params;

    await fetchMutation(api.competitors.updateCompetitor, {
      competitorId: id as Id<"competitors">,
      updates,
    });

    return NextResponse.json({
      success: true,
      message: "Competitor updated successfully",
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
    console.error("Error updating competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update competitor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competitors/[id]
 * Delete a competitor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await fetchMutation(api.competitors.deleteCompetitor, {
      competitorId: id as Id<"competitors">,
    });

    return NextResponse.json({
      success: true,
      message: "Competitor deleted successfully",
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
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
