/**
 * Synthex Market Radar Recommendations API
 *
 * Phase: D45 - Market Radar
 *
 * GET - List recommendations
 * POST - Create recommendation or generate AI recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createRecommendation,
  listRecommendations,
  updateRecommendationStatus,
  aiGenerateRecommendations,
  listSignals,
  listCompetitors,
  type MKTRecStatus,
  type MKTPriority,
} from "@/lib/synthex/marketRadarService";

/**
 * GET /api/synthex/market-radar/recommendations
 * List recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const category = searchParams.get("category");
    const status = searchParams.get("status") as MKTRecStatus | null;
    const priority = searchParams.get("priority") as MKTPriority | null;
    const limit = searchParams.get("limit");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const recommendations = await listRecommendations(tenantId, {
      businessId: businessId || undefined,
      category: category || undefined,
      status: status || undefined,
      priority: priority || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/market-radar/recommendations
 * Create recommendation or perform actions
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, businessId, action } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Update recommendation status
    if (action === "update_status") {
      if (!body.recommendationId || !body.status) {
        return NextResponse.json(
          { error: "recommendationId and status are required" },
          { status: 400 }
        );
      }
      const recommendation = await updateRecommendationStatus(
        body.recommendationId,
        body.status,
        body.reason
      );
      return NextResponse.json({ success: true, recommendation });
    }

    // Generate AI recommendations
    if (action === "generate") {
      const [signals, competitors] = await Promise.all([
        listSignals(tenantId, { businessId, limit: 20 }),
        listCompetitors(tenantId, { businessId, limit: 10 }),
      ]);

      const recommendations = await aiGenerateRecommendations(tenantId, businessId, {
        signals,
        competitors,
        business_context: body.business_context,
      });

      return NextResponse.json({ success: true, recommendations });
    }

    // Create new recommendation
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }
    if (!body.recommendation) {
      return NextResponse.json({ error: "recommendation is required" }, { status: 400 });
    }

    const recommendation = await createRecommendation(tenantId, businessId, {
      category: body.category,
      subcategory: body.subcategory,
      priority: body.priority,
      title: body.title,
      recommendation: body.recommendation,
      detailed_analysis: body.detailed_analysis,
      expected_impact: body.expected_impact,
      estimated_effort: body.estimated_effort,
      time_horizon: body.time_horizon,
      supporting_signals: body.supporting_signals,
      related_competitors: body.related_competitors,
      implementation_steps: body.implementation_steps,
      success_metrics: body.success_metrics,
      assigned_to: body.assigned_to,
      due_date: body.due_date,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, recommendation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating recommendation:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
