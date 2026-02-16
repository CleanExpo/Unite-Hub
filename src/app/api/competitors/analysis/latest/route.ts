import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * GET /api/competitors/analysis/latest?clientId=xxx
 * Get the latest competitor analysis for a client
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

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get the latest analysis
    const { data: analysis, error: analysisError } = await supabase
      .from("competitor_analyses")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "No analysis found for this client" },
        { status: 404 }
      );
    }

    // Fetch the competitors that were analyzed
    const competitorIds = analysis.competitors_analyzed || [];

    let competitors: any[] = [];
    if (competitorIds.length > 0) {
      const { data: competitorData, error: competitorError } = await supabase
        .from("competitors")
        .select("*")
        .in("id", competitorIds);

      if (!competitorError && competitorData) {
        competitors = competitorData.map((comp) => ({
          id: comp.id,
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
        }));
      }
    }

    // Transform analysis to camelCase
    const transformedAnalysis = {
      id: analysis.id,
      clientId: analysis.client_id,
      competitorsAnalyzed: analysis.competitors_analyzed,
      marketGaps: analysis.market_gaps,
      differentiationOpportunities: analysis.differentiation_opportunities,
      pricingAnalysis: analysis.pricing_analysis,
      swotAnalysis: analysis.swot_analysis,
      contentGaps: analysis.content_gaps,
      actionableInsights: analysis.actionable_insights,
      aiSummary: analysis.ai_summary,
      createdAt: analysis.created_at,
    };

    return NextResponse.json({
      success: true,
      analysis: transformedAnalysis,
      competitors,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching latest analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
