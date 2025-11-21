import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { clientId, format = "json", templateIds } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get templates
    let templates;
    if (templateIds && templateIds.length > 0) {
      // Get specific templates
      const { data, error } = await supabase
        .from("social_templates")
        .select("*")
        .in("id", templateIds);

      if (error) {
        throw error;
      }
      templates = data;
    } else {
      // Get all templates
      const { data, error } = await supabase
        .from("social_templates")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      templates = data;
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

    if (format === "csv") {
      const csv = convertToCSV(transformedTemplates);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="social-templates-${Date.now()}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      templates: transformedTemplates,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error exporting templates:", error);
    return NextResponse.json(
      { error: "Failed to export templates" },
      { status: 500 }
    );
  }
}

function convertToCSV(templates: any[]) {
  const headers = [
    "Template Name",
    "Platform",
    "Category",
    "Copy Text",
    "Hashtags",
    "Emojis",
    "CTA",
    "Character Count",
    "Usage Count",
    "Favorite",
    "Created At",
  ];

  const rows = templates.map((t) => [
    t.templateName,
    t.platform,
    t.category,
    t.copyText.replace(/"/g, '""'), // Escape quotes
    (t.hashtags || []).join(" "),
    (t.emojiSuggestions || []).join(" "),
    t.callToAction || "",
    t.characterCount || 0,
    t.usageCount || 0,
    t.isFavorite ? "Yes" : "No",
    new Date(t.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
