import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * PUT /api/landing-pages/[id]/section
 * Update a specific section of a landing page checklist
 */
export async function PUT(
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
    const body = await request.json();
    const { sectionName, ...updates } = body;

    if (!sectionName) {
      return NextResponse.json(
        { error: "Missing sectionName" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get the current checklist
    const { data: checklist, error: fetchError } = await supabase
      .from("landing_page_checklists")
      .select("sections")
      .eq("id", id)
      .single();

    if (fetchError || !checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    // Update the specific section
    const updatedSections = checklist.sections.map((section: any) => {
      if (section.name === sectionName) {
        return {
          ...section,
          ...updates,
        };
      }
      return section;
    });

    // Save the updated sections
    const { error: updateError } = await supabase
      .from("landing_page_checklists")
      .update({
        sections: updatedSections,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating section:", updateError);
      return NextResponse.json(
        { error: "Failed to update section" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update section" },
      { status: 500 }
    );
  }
}
