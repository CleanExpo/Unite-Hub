import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * POST /api/competitors
 * Create a new competitor
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const body = await request.json();
    const {
      clientId,
      competitorName,
      website,
      description,
      category,
      strengths,
      weaknesses,
      pricing,
      targetAudience,
      marketingChannels,
      contentStrategy,
      socialPresence,
      logoUrl,
      screenshots,
    } = body;

    // Validate required fields
    if (!clientId || !competitorName || !website || !description || !category) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: clientId, competitorName, website, description, category",
        },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Create competitor
    const { data: competitor, error } = await supabase
      .from("competitors")
      .insert({
        client_id: clientId,
        competitor_name: competitorName,
        website,
        description,
        category,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        pricing,
        target_audience: targetAudience || [],
        marketing_channels: marketingChannels || [],
        content_strategy: contentStrategy,
        social_presence: socialPresence || {},
        logo_url: logoUrl,
        screenshots: screenshots || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating competitor:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create competitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      competitorId: competitor.id,
      message: "Competitor added successfully",
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error creating competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create competitor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/competitors?clientId=xxx
 * Get all competitors for a client
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const category = searchParams.get("category") as
      | "direct"
      | "indirect"
      | "potential"
      | null;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from("competitors")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: competitors, error } = await query;

    if (error) {
      console.error("Error fetching competitors:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch competitors" },
        { status: 500 }
      );
    }

    // Transform to camelCase for API consistency
    const transformedCompetitors = competitors.map((comp) => ({
      id: comp.id,
      clientId: comp.client_id,
      competitorName: comp.competitor_name,
      website: comp.website,
      description: comp.description,
      category: comp.category,
      strengths: comp.strengths,
      weaknesses: comp.weaknesses,
      pricing: comp.pricing,
      targetAudience: comp.target_audience,
      marketingChannels: comp.marketing_channels,
      contentStrategy: comp.content_strategy,
      socialPresence: comp.social_presence,
      logoUrl: comp.logo_url,
      screenshots: comp.screenshots,
      createdAt: comp.created_at,
      updatedAt: comp.updated_at,
    }));

    return NextResponse.json({ success: true, competitors: transformedCompetitors });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}
