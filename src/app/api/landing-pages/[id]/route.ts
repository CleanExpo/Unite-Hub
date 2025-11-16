import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/landing-pages/[id]
 * Get a landing page checklist by ID
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

    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;

    const checklist = await fetchQuery(api.landingPages.get, {
      checklistId,
    });

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(checklist);
  } catch (error: any) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/landing-pages/[id]
 * Update a landing page checklist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;
    const body = await request.json();

    await fetchMutation(api.landingPages.update, {
      checklistId,
      ...body,
    });

    return NextResponse.json({
      success: true,
      message: "Checklist updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating checklist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update checklist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/landing-pages/[id]
 * Delete a landing page checklist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;

    await fetchMutation(api.landingPages.remove, {
      checklistId,
    });

    return NextResponse.json({
      success: true,
      message: "Checklist deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting checklist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete checklist" },
      { status: 500 }
    );
  }
}
