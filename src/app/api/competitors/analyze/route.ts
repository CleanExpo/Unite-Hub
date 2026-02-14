import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { anthropic } from "@/lib/anthropic/client";
import { ANTHROPIC_MODELS } from "@/lib/anthropic/models";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import {
  generateCompetitorAnalysisPrompt,
  type CompetitorData,
  type ClientBusinessContext,
} from "@/lib/claude/competitor-prompts";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * POST /api/competitors/analyze
 * Run AI-powered competitor analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch all competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from("competitors")
      .select("*")
      .eq("client_id", clientId);

    if (competitorsError) {
      console.error("Error fetching competitors:", competitorsError);
      return NextResponse.json(
        { error: "Failed to fetch competitors" },
        { status: 500 }
      );
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json(
        {
          error:
            "No competitors found. Please add competitors before running analysis.",
        },
        { status: 400 }
      );
    }

    // Fetch client's marketing strategy (if exists) for context
    const { data: strategies } = await supabase
      .from("strategies")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true);

    const activeStrategy = strategies?.find((s: any) => s.is_active);

    // Build client context
    const clientContext: ClientBusinessContext = {
      businessName: client.business_name,
      businessDescription: client.business_description,
      targetAudience: activeStrategy?.target_audience
        ? [activeStrategy.target_audience]
        : undefined,
      marketingChannels: activeStrategy?.marketing_channels?.map(
        (c: any) => c.channel
      ),
    };

    // Build competitor data
    const competitorData: CompetitorData[] = competitors.map((comp: any) => ({
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
    }));

    // Generate AI analysis prompt
    const prompt = generateCompetitorAnalysisPrompt(
      clientContext,
      competitorData
    );

    // Call Claude AI
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })
    });

    const message = result.data;;

    // Extract JSON response
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Claude response");
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from("competitor_analyses")
      .insert({
        client_id: clientId,
        competitors_analyzed: competitors.map((c: any) => c.id),
        market_gaps: analysisResult.marketGaps,
        differentiation_opportunities: analysisResult.differentiationOpportunities,
        pricing_analysis: analysisResult.pricingAnalysis,
        swot_analysis: analysisResult.swotAnalysis,
        content_gaps: analysisResult.contentGaps,
        actionable_insights: analysisResult.actionableInsights,
        ai_summary: analysisResult.aiSummary,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (analysisError) {
      console.error("Error saving analysis:", analysisError);
      // Still return the analysis even if save fails
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis?.id,
      analysis: analysisResult,
      message: "Competitor analysis completed successfully",
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
    console.error("Error analyzing competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze competitors" },
      { status: 500 }
    );
  }
}
