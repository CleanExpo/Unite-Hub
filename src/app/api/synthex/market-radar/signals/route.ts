/**
 * Synthex Market Radar Signals API
 *
 * Phase: D45 - Market Radar
 *
 * GET - List signals
 * POST - Create signal or scan for trends
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createSignal,
  listSignals,
  acknowledgeSignal,
  aiScanMarketTrends,
  type MKTSignalType,
  type MKTDirection,
} from "@/lib/synthex/marketRadarService";

/**
 * GET /api/synthex/market-radar/signals
 * List market signals
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const signalType = searchParams.get("signalType") as MKTSignalType | null;
    const direction = searchParams.get("direction") as MKTDirection | null;
    const acknowledged = searchParams.get("acknowledged");
    const minStrength = searchParams.get("minStrength");
    const limit = searchParams.get("limit");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const signals = await listSignals(tenantId, {
      businessId: businessId || undefined,
      signalType: signalType || undefined,
      direction: direction || undefined,
      acknowledged: acknowledged ? acknowledged === "true" : undefined,
      minStrength: minStrength ? parseFloat(minStrength) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, signals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching signals:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/market-radar/signals
 * Create signal or perform actions
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

    // Acknowledge signal
    if (action === "acknowledge") {
      if (!body.signalId) {
        return NextResponse.json({ error: "signalId is required" }, { status: 400 });
      }
      const signal = await acknowledgeSignal(body.signalId, body.userId);
      return NextResponse.json({ success: true, signal });
    }

    // Scan for market trends
    if (action === "scan") {
      if (!body.industry) {
        return NextResponse.json({ error: "industry is required" }, { status: 400 });
      }
      const signals = await aiScanMarketTrends(
        tenantId,
        businessId,
        body.industry,
        body.keywords || []
      );
      return NextResponse.json({ success: true, signals });
    }

    // Create new signal
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.signal_type) {
      return NextResponse.json({ error: "signal_type is required" }, { status: 400 });
    }

    const signal = await createSignal(tenantId, businessId, {
      source_type: body.source_type,
      source_ref: body.source_ref,
      signal_type: body.signal_type,
      title: body.title,
      summary: body.summary,
      full_content: body.full_content,
      strength: body.strength,
      confidence: body.confidence,
      direction: body.direction,
      impact_score: body.impact_score,
      urgency_score: body.urgency_score,
      related_industries: body.related_industries,
      related_keywords: body.related_keywords,
      tags: body.tags,
      expires_at: body.expires_at,
      raw_payload: body.raw_payload,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, signal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating signal:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
