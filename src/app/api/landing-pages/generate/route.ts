import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchAction } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

/**
 * POST /api/landing-pages/generate
 * Generate a new landing page checklist with AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, pageType, title, personaId } = body;

    if (!clientId || !pageType || !title) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, pageType, title" },
        { status: 400 }
      );
    }

    // Validate page type
    const validPageTypes = [
      "homepage",
      "product",
      "service",
      "lead_capture",
      "sales",
      "event",
    ];
    if (!validPageTypes.includes(pageType)) {
      return NextResponse.json(
        { error: "Invalid page type" },
        { status: 400 }
      );
    }

    // Generate checklist with AI
    const checklistId = await fetchAction(api.landingPages.generateChecklist, {
      clientId: clientId as Id<"clients">,
      pageType,
      title,
      personaId: personaId as Id<"personas"> | undefined,
    });

    return NextResponse.json({
      success: true,
      checklistId,
      message: "Landing page checklist generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating landing page checklist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate checklist" },
      { status: 500 }
    );
  }
}
