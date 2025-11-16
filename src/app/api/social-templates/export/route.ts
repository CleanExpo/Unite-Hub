import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
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

    // Get templates
    let templates;
    if (templateIds && templateIds.length > 0) {
      // Get specific templates
      templates = await Promise.all(
        templateIds.map((id: string) =>
          fetchQuery(api.socialTemplates.getTemplate, { templateId: id as any })
        )
      );
    } else {
      // Get all templates
      templates = await fetchQuery(api.socialTemplates.getTemplates, {
        clientId: clientId as any,
      });
    }

    if (format === "csv") {
      const csv = convertToCSV(templates);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="social-templates-${Date.now()}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      templates,
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
    t.hashtags.join(" "),
    t.emojiSuggestions.join(" "),
    t.callToAction || "",
    t.characterCount,
    t.usageCount,
    t.isFavorite ? "Yes" : "No",
    new Date(t.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
