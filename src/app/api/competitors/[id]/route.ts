import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * GET /api/competitors/[id]
 * Get a single competitor
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

    // Validate user authentication
    await validateUserAuth(request);

    const { id } = await params;
    const supabase = await getSupabaseServer();

    const { data: competitor, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    // Transform to camelCase
    const transformedCompetitor = {
      id: competitor.id,
      clientId: competitor.client_id,
      competitorName: competitor.competitor_name,
      website: competitor.website,
      description: competitor.description,
      category: competitor.category,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      pricing: competitor.pricing,
      targetAudience: competitor.target_audience,
      marketingChannels: competitor.marketing_channels,
      contentStrategy: competitor.content_strategy,
      socialPresence: competitor.social_presence,
      logoUrl: competitor.logo_url,
      screenshots: competitor.screenshots,
      createdAt: competitor.created_at,
      updatedAt: competitor.updated_at,
    };

    return NextResponse.json({ success: true, competitor: transformedCompetitor });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch competitor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/competitors/[id]
 * Update a competitor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const body = await request.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const supabase = await getSupabaseServer();

    // Transform camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.competitorName) {
dbUpdates.competitor_name = updates.competitorName;
}
    if (updates.website) {
dbUpdates.website = updates.website;
}
    if (updates.description) {
dbUpdates.description = updates.description;
}
    if (updates.category) {
dbUpdates.category = updates.category;
}
    if (updates.strengths) {
dbUpdates.strengths = updates.strengths;
}
    if (updates.weaknesses) {
dbUpdates.weaknesses = updates.weaknesses;
}
    if (updates.pricing) {
dbUpdates.pricing = updates.pricing;
}
    if (updates.targetAudience) {
dbUpdates.target_audience = updates.targetAudience;
}
    if (updates.marketingChannels) {
dbUpdates.marketing_channels = updates.marketingChannels;
}
    if (updates.contentStrategy) {
dbUpdates.content_strategy = updates.contentStrategy;
}
    if (updates.socialPresence) {
dbUpdates.social_presence = updates.socialPresence;
}
    if (updates.logoUrl) {
dbUpdates.logo_url = updates.logoUrl;
}
    if (updates.screenshots) {
dbUpdates.screenshots = updates.screenshots;
}

    const { error } = await supabase
      .from("competitors")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating competitor:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update competitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Competitor updated successfully",
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
    console.error("Error updating competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update competitor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competitors/[id]
 * Delete a competitor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const { id } = await params;
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("competitors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting competitor:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete competitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Competitor deleted successfully",
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
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
