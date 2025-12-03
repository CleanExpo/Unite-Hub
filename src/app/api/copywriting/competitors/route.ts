/**
 * Competitor Analysis API Routes
 * GET: Get competitor analyses
 * POST: Analyze a competitor
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeCompetitor,
  getCompetitorAnalyses,
  getCompetitorAnalysis,
  runGapAnalysis,
  getSectionPatterns,
  type CompetitorAnalysisInput,
} from "@/lib/agents/competitor-analyzer";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const clientId = searchParams.get("clientId") || undefined;
    const analysisId = searchParams.get("analysisId");
    const gapAnalysis = searchParams.get("gapAnalysis") === "true";
    const pageType = searchParams.get("pageType");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Run gap analysis
    if (gapAnalysis) {
      const ourSiteUrl = searchParams.get("ourSiteUrl") || undefined;
      const result = await runGapAnalysis(workspaceId, clientId, ourSiteUrl);
      return NextResponse.json({ success: true, data: result });
    }

    // Get section patterns for a page type
    if (pageType) {
      const patterns = await getSectionPatterns(workspaceId, pageType);
      return NextResponse.json({ success: true, data: patterns });
    }

    // Get specific analysis
    if (analysisId) {
      const analysis = await getCompetitorAnalysis(analysisId, workspaceId);
      if (!analysis) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: analysis });
    }

    // Get all analyses
    const analyses = await getCompetitorAnalyses(workspaceId, clientId);
    return NextResponse.json({ success: true, data: analyses });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Competitor Analysis GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId,
      clientId,
      competitorName,
      competitorUrl,
      competitorRank,
      pagesToAnalyze,
    } = body;

    if (!workspaceId || !competitorName || !competitorUrl) {
      return NextResponse.json(
        { error: "workspaceId, competitorName, and competitorUrl are required" },
        { status: 400 }
      );
    }

    const input: CompetitorAnalysisInput = {
      workspaceId,
      clientId,
      competitorName,
      competitorUrl,
      competitorRank,
      pagesToAnalyze,
    };

    const result = await analyzeCompetitor(input);

    return NextResponse.json({
      success: result.success,
      data: result,
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Competitor Analysis POST error:", error);
    return NextResponse.json(
      { error: "Failed to analyze competitor" },
      { status: 500 }
    );
  }
}
