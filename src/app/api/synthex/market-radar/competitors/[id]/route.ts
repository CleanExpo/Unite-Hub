/**
 * Synthex Market Radar Competitor by ID API
 *
 * Phase: D45 - Market Radar
 *
 * GET - Get competitor details
 * PUT - Update competitor
 * DELETE - Delete competitor
 * POST - Analyze competitor
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getCompetitor,
  updateCompetitor,
  deleteCompetitor,
  aiAnalyzeCompetitor,
} from "@/lib/synthex/marketRadarService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/market-radar/competitors/[id]
 * Get competitor details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const competitor = await getCompetitor(id);
    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, competitor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching competitor:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/market-radar/competitors/[id]
 * Update competitor
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const competitor = await updateCompetitor(id, {
      name: body.name,
      website_url: body.website_url,
      description: body.description,
      region: body.region,
      positioning: body.positioning,
      value_proposition: body.value_proposition,
      target_market: body.target_market,
      pricing_model: body.pricing_model,
      pricing_tier: body.pricing_tier,
      threat_level: body.threat_level,
      watch_priority: body.watch_priority,
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      products: body.products,
      features: body.features,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, competitor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating competitor:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/market-radar/competitors/[id]
 * Delete competitor
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteCompetitor(id);

    return NextResponse.json({ success: true, message: "Competitor deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting competitor:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/market-radar/competitors/[id]
 * Analyze competitor
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const competitor = await getCompetitor(id);
    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    switch (action) {
      case "analyze": {
        const analysis = await aiAnalyzeCompetitor(competitor, body.businessContext);

        // Optionally update competitor with SWOT analysis
        if (body.saveAnalysis) {
          await updateCompetitor(id, {
            strengths: analysis.swot.strengths,
            weaknesses: analysis.swot.weaknesses,
          });
        }

        return NextResponse.json({ success: true, analysis });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error analyzing competitor:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
