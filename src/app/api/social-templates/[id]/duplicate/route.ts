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

    // Get the original template
    const { data: original, error: fetchError } = await supabase
      .from("social_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create a duplicate
    const { data: newTemplate, error: insertError } = await supabase
      .from("social_templates")
      .insert({
        client_id: original.client_id,
        platform: original.platform,
        category: original.category,
        template_name: `${original.template_name} (Copy)`,
        copy_text: original.copy_text,
        hashtags: original.hashtags,
        emoji_suggestions: original.emoji_suggestions,
        call_to_action: original.call_to_action,
        variations: original.variations,
        performance_prediction: original.performance_prediction,
        tags: original.tags,
        ai_generated: original.ai_generated,
        is_favorite: false,
        usage_count: 0,
        character_count: original.character_count,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error duplicating template:", insertError);
      return NextResponse.json(
        { error: "Failed to duplicate template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, templateId: newTemplate.id });
  } catch (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
