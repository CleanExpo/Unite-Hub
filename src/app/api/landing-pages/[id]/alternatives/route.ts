import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAction } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

/**
 * POST /api/landing-pages/[id]/alternatives
 * Generate alternative copy variations for A/B testing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const checklistId = id as Id<"landingPageChecklists">;
    const body = await request.json();
    const { sectionName, count } = body;

    if (!sectionName) {
      return NextResponse.json(
        { error: "Missing sectionName" },
        { status: 400 }
      );
    }

    const alternatives = await fetchAction(api.landingPages.generateAlternatives, {
      checklistId,
      sectionName,
      count: count || 3,
    });

    return NextResponse.json({
      success: true,
      alternatives,
      message: "Alternatives generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating alternatives:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate alternatives" },
      { status: 500 }
    );
  }
}
