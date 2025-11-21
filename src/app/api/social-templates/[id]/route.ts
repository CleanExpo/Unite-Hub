import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

// GET single template
export async function GET(
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

    const { data: template, error } = await supabase
      .from("social_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Transform to camelCase
    const transformedTemplate = {
      id: template.id,
      clientId: template.client_id,
      platform: template.platform,
      category: template.category,
      templateName: template.template_name,
      copyText: template.copy_text,
      hashtags: template.hashtags || [],
      emojiSuggestions: template.emoji_suggestions || [],
      callToAction: template.call_to_action,
      variations: template.variations || [],
      performancePrediction: template.performance_prediction,
      aiGenerated: template.ai_generated,
      tags: template.tags || [],
      isFavorite: template.is_favorite,
      usageCount: template.usage_count,
      characterCount: template.character_count,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };

    return NextResponse.json({ template: transformedTemplate });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// UPDATE template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { updates } = body;
    const { id } = await params;

    const supabase = await getSupabaseServer();

    // Transform camelCase to snake_case
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.templateName) dbUpdates.template_name = updates.templateName;
    if (updates.copyText) dbUpdates.copy_text = updates.copyText;
    if (updates.hashtags) dbUpdates.hashtags = updates.hashtags;
    if (updates.emojiSuggestions) dbUpdates.emoji_suggestions = updates.emojiSuggestions;
    if (updates.callToAction) dbUpdates.call_to_action = updates.callToAction;
    if (updates.variations) dbUpdates.variations = updates.variations;
    if (updates.performancePrediction) dbUpdates.performance_prediction = updates.performancePrediction;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (typeof updates.isFavorite === 'boolean') dbUpdates.is_favorite = updates.isFavorite;

    const { error } = await supabase
      .from("social_templates")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("social_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
