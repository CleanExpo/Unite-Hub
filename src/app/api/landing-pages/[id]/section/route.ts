import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchAction } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

/**
 * PUT /api/landing-pages/[id]/section
 * Update a specific section of a landing page checklist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;
    const body = await request.json();
    const { sectionName, ...updates } = body;

    if (!sectionName) {
      return NextResponse.json(
        { error: "Missing sectionName" },
        { status: 400 }
      );
    }

    await fetchMutation(api.landingPages.updateSection, {
      checklistId,
      sectionName,
      ...updates,
    });

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update section" },
      { status: 500 }
    );
  }
}
