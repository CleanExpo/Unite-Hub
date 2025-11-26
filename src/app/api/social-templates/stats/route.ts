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

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get all templates for the client
    const { data: templates, error } = await supabase
      .from("social_templates")
      .select("platform, category, is_favorite, usage_count, ai_generated")
      .eq("client_id", clientId);

    if (error) {
      console.error("Error fetching stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: templates.length,
      byPlatform: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      favorites: 0,
      totalUsage: 0,
      aiGenerated: 0,
      manuallyCreated: 0,
    };

    templates.forEach((t) => {
      // Count by platform
      stats.byPlatform[t.platform] = (stats.byPlatform[t.platform] || 0) + 1;

      // Count by category
      stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1;

      // Count favorites
      if (t.is_favorite) {
        stats.favorites++;
      }

      // Sum usage
      stats.totalUsage += t.usage_count || 0;

      // Count AI generated vs manual
      if (t.ai_generated) {
        stats.aiGenerated++;
      } else {
        stats.manuallyCreated++;
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
