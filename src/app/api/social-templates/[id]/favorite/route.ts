import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;
    const supabase = await getSupabaseServer();

    // Get current favorite status
    const { data: template, error: fetchError } = await supabase
      .from("social_templates")
      .select("is_favorite")
      .eq("id", id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Toggle favorite status
    const newFavoriteStatus = !template.is_favorite;

    const { error: updateError } = await supabase
      .from("social_templates")
      .update({
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error toggling favorite:", updateError);
      return NextResponse.json(
        { error: "Failed to toggle favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, isFavorite: newFavoriteStatus });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
