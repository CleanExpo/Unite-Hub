import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateCompetitorAnalysisPrompt,
  type CompetitorData,
  type ClientBusinessContext,
} from "@/lib/claude/competitor-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * POST /api/competitors/analyze
 * Run AI-powered competitor analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Fetch client details
    const client = await fetchQuery(api.clients.getClient, {
      clientId: clientId as Id<"clients">,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch all competitors
    const competitors = await fetchQuery(api.competitors.getCompetitors, {
      clientId: clientId as Id<"clients">,
    });

    if (competitors.length === 0) {
      return NextResponse.json(
        {
          error:
            "No competitors found. Please add competitors before running analysis.",
        },
        { status: 400 }
      );
    }

    // Fetch client's marketing strategy (if exists) for context
    const strategies = await fetchQuery(api.strategies.getStrategies, {
      clientId: clientId as Id<"clients">,
      activeOnly: true,
    });

    const activeStrategy = strategies.find((s: any) => s.isActive);

    // Build client context
    const clientContext: ClientBusinessContext = {
      businessName: client.businessName,
      businessDescription: client.businessDescription,
      targetAudience: activeStrategy?.targetAudience
        ? [activeStrategy.targetAudience]
        : undefined,
      marketingChannels: activeStrategy?.marketingChannels?.map(
        (c: any) => c.channel
      ),
    };

    // Build competitor data
    const competitorData: CompetitorData[] = competitors.map((comp: any) => ({
      competitorName: comp.competitorName,
      website: comp.website,
      description: comp.description,
      category: comp.category,
      strengths: comp.strengths || [],
      weaknesses: comp.weaknesses || [],
      pricing: comp.pricing,
      targetAudience: comp.targetAudience || [],
      marketingChannels: comp.marketingChannels || [],
      contentStrategy: comp.contentStrategy,
      socialPresence: comp.socialPresence || {},
    }));

    // Generate AI analysis prompt
    const prompt = generateCompetitorAnalysisPrompt(
      clientContext,
      competitorData
    );

    // Call Claude AI
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

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
    const analysisId = await fetchMutation(api.competitors.createAnalysis, {
      clientId: clientId as Id<"clients">,
      competitorsAnalyzed: competitors.map((c: any) => c._id),
      marketGaps: analysisResult.marketGaps,
      differentiationOpportunities: analysisResult.differentiationOpportunities,
      pricingAnalysis: analysisResult.pricingAnalysis,
      swotAnalysis: analysisResult.swotAnalysis,
      contentGaps: analysisResult.contentGaps,
      actionableInsights: analysisResult.actionableInsights,
      aiSummary: analysisResult.aiSummary,
    });

    return NextResponse.json({
      success: true,
      analysisId,
      analysis: analysisResult,
      message: "Competitor analysis completed successfully",
    });
  } catch (error: any) {
    console.error("Error analyzing competitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze competitors" },
      { status: 500 }
    );
  }
}
