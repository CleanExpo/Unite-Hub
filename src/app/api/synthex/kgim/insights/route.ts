/**
 * Synthex KGIM Insights API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * POST - Create insight
 * GET - List insights
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createInsight,
  listInsights,
  aiGenerateInsight,
  type KGIMInsightType,
  type KGIMInsightPriority,
} from "@/lib/synthex/kgimService";

/**
 * POST /api/synthex/kgim/insights
 * Create a new insight or generate one with AI
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // AI generation mode
    if (body.ai_generate) {
      const aiResult = await aiGenerateInsight({
        data_points: body.data_points,
        patterns: body.patterns,
        recent_events: body.recent_events,
        business_context: body.business_context,
      });

      // Auto-save the generated insight
      if (body.auto_save !== false) {
        const insight = await createInsight(tenantId, {
          insight_key: `ai-${Date.now()}`,
          insight_title: aiResult.insight_title,
          insight_type: aiResult.insight_type,
          summary: aiResult.summary,
          priority: aiResult.priority,
          impact_score: aiResult.impact_score,
          confidence: aiResult.confidence,
          recommendations: aiResult.recommendations,
        });

        return NextResponse.json({ success: true, insight, ai_generated: true });
      }

      return NextResponse.json({ success: true, generated: aiResult });
    }

    // Manual creation
    if (!body.insight_key || !body.insight_title || !body.summary) {
      return NextResponse.json(
        { error: "insight_key, insight_title, and summary are required" },
        { status: 400 }
      );
    }

    const insight = await createInsight(tenantId, {
      insight_key: body.insight_key,
      insight_title: body.insight_title,
      insight_type: body.insight_type as KGIMInsightType,
      summary: body.summary,
      details: body.details,
      priority: body.priority as KGIMInsightPriority,
      impact_score: body.impact_score,
      confidence: body.confidence,
      evidence: body.evidence,
      source_nodes: body.source_nodes,
      recommendations: body.recommendations,
    });

    return NextResponse.json({ success: true, insight });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating insight:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/kgim/insights?tenantId=xxx
 * List insights with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Active insights only (not acknowledged or dismissed)
    if (searchParams.get("active") === "true") {
      const insights = await listInsights(tenantId, {
        is_acknowledged: false,
        is_dismissed: false,
        limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
      });
      return NextResponse.json({ success: true, insights });
    }

    const insights = await listInsights(tenantId, {
      insight_type: searchParams.get("type") as KGIMInsightType | undefined,
      priority: searchParams.get("priority") as KGIMInsightPriority | undefined,
      is_acknowledged: searchParams.get("acknowledged") === "true" ? true : undefined,
      is_dismissed: searchParams.get("dismissed") === "true" ? true : undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, insights });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching insights:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
