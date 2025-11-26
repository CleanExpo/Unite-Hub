import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
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
    const supabase = await getSupabaseServer();

    const { data: checklist, error } = await supabase
      .from("landing_page_checklists")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    // Transform to camelCase
    const transformedChecklist = {
      id: checklist.id,
      clientId: checklist.client_id,
      pageType: checklist.page_type,
      title: checklist.title,
      personaId: checklist.persona_id,
      sections: checklist.sections,
      createdAt: checklist.created_at,
      updatedAt: checklist.updated_at,
    };

    return NextResponse.json(transformedChecklist);
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
    const body = await request.json();

    const supabase = await getSupabaseServer();

    // Transform camelCase to snake_case
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title) dbUpdates.title = body.title;
    if (body.pageType) dbUpdates.page_type = body.pageType;
    if (body.sections) dbUpdates.sections = body.sections;
    if (body.personaId) dbUpdates.persona_id = body.personaId;

    const { error } = await supabase
      .from("landing_page_checklists")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating checklist:", error);
      return NextResponse.json(
        { error: "Failed to update checklist" },
        { status: 500 }
      );
    }

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
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("landing_page_checklists")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting checklist:", error);
      return NextResponse.json(
        { error: "Failed to delete checklist" },
        { status: 500 }
      );
    }

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
