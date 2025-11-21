import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * POST /api/competitors/compare
 * Compare multiple competitors side-by-side
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const body = await request.json();
    const { competitorIds } = body;

    if (!competitorIds || !Array.isArray(competitorIds)) {
      return NextResponse.json(
        { error: "competitorIds array is required" },
        { status: 400 }
      );
    }

    if (competitorIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 competitors required for comparison" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Fetch all competitors
    const { data: competitors, error } = await supabase
      .from("competitors")
      .select("*")
      .in("id", competitorIds);

    if (error) {
      console.error("Error fetching competitors for comparison:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch competitors" },
        { status: 500 }
      );
    }

    if (!competitors || competitors.length < 2) {
      return NextResponse.json(
        { error: "Could not find enough competitors to compare" },
        { status: 404 }
      );
    }

    // Build comparison data
    const comparison = {
      competitors: competitors.map((comp) => ({
        id: comp.id,
        competitorName: comp.competitor_name,
        website: comp.website,
        description: comp.description,
        category: comp.category,
        strengths: comp.strengths || [],
        weaknesses: comp.weaknesses || [],
        pricing: comp.pricing,
        targetAudience: comp.target_audience || [],
        marketingChannels: comp.marketing_channels || [],
        contentStrategy: comp.content_strategy,
        socialPresence: comp.social_presence || {},
      })),
      commonStrengths: findCommonItems(competitors.map((c) => c.strengths || [])),
      commonWeaknesses: findCommonItems(competitors.map((c) => c.weaknesses || [])),
      uniqueStrengths: findUniqueItems(competitors.map((c) => ({ name: c.competitor_name, items: c.strengths || [] }))),
      uniqueWeaknesses: findUniqueItems(competitors.map((c) => ({ name: c.competitor_name, items: c.weaknesses || [] }))),
      pricingComparison: competitors.map((c) => ({
        name: c.competitor_name,
        pricing: c.pricing,
      })),
      channelOverlap: findChannelOverlap(competitors.map((c) => c.marketing_channels || [])),
    };

    return NextResponse.json({ success: true, comparison });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error comparing competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compare competitors" },
      { status: 500 }
    );
  }
}

// Helper functions for comparison analysis
function findCommonItems(arrays: string[][]): string[] {
  if (arrays.length === 0) return [];
  return arrays.reduce((common, arr) =>
    common.filter(item => arr.includes(item))
  );
}

function findUniqueItems(competitors: { name: string; items: string[] }[]): Record<string, string[]> {
  const allItems = competitors.flatMap(c => c.items);
  const result: Record<string, string[]> = {};

  competitors.forEach(comp => {
    result[comp.name] = comp.items.filter(item =>
      allItems.filter(i => i === item).length === 1
    );
  });

  return result;
}

function findChannelOverlap(channelArrays: string[][]): { channel: string; count: number }[] {
  const channelCount: Record<string, number> = {};

  channelArrays.forEach(channels => {
    channels.forEach(channel => {
      channelCount[channel] = (channelCount[channel] || 0) + 1;
    });
  });

  return Object.entries(channelCount)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}
