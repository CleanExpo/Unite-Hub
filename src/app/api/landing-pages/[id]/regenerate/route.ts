import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAction } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

/**
 * POST /api/landing-pages/[id]/regenerate
 * Regenerate AI copy for a specific section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;
    const body = await request.json();
    const { sectionName } = body;

    if (!sectionName) {
      return NextResponse.json(
        { error: "Missing sectionName" },
        { status: 400 }
      );
    }

    await fetchAction(api.landingPages.regenerateSection, {
      checklistId,
      sectionName,
    });

    return NextResponse.json({
      success: true,
      message: "Section copy regenerated successfully",
    });
  } catch (error: any) {
    console.error("Error regenerating section:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate section" },
      { status: 500 }
    );
  }
}
