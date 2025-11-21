import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const query = searchParams.get("query");

    if (!clientId || !query) {
      return NextResponse.json(
        { error: "Missing clientId or query" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Search in template_name, copy_text, and tags
    const { data: templates, error } = await supabase
      .from("social_templates")
      .select("*")
      .eq("client_id", clientId)
      .or(`template_name.ilike.%${query}%,copy_text.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching templates:", error);
      return NextResponse.json(
        { error: "Failed to search templates" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedTemplates = (templates || []).map((t) => ({
      id: t.id,
      clientId: t.client_id,
      platform: t.platform,
      category: t.category,
      templateName: t.template_name,
      copyText: t.copy_text,
      hashtags: t.hashtags || [],
      emojiSuggestions: t.emoji_suggestions || [],
      callToAction: t.call_to_action,
      variations: t.variations || [],
      performancePrediction: t.performance_prediction,
      aiGenerated: t.ai_generated,
      tags: t.tags || [],
      isFavorite: t.is_favorite,
      usageCount: t.usage_count,
      characterCount: t.character_count,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return NextResponse.json({ templates: transformedTemplates });
  } catch (error) {
    console.error("Error searching templates:", error);
    return NextResponse.json(
      { error: "Failed to search templates" },
      { status: 500 }
    );
  }
}
