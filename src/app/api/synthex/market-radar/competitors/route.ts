/**
 * Synthex Market Radar Competitors API
 *
 * Phase: D45 - Market Radar
 *
 * GET - List competitors
 * POST - Create competitor
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createCompetitor,
  listCompetitors,
  type MKTPriority,
} from "@/lib/synthex/marketRadarService";

/**
 * GET /api/synthex/market-radar/competitors
 * List competitors
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const watchPriority = searchParams.get("watchPriority") as MKTPriority | null;
    const minThreatLevel = searchParams.get("minThreatLevel");
    const limit = searchParams.get("limit");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const competitors = await listCompetitors(tenantId, {
      businessId: businessId || undefined,
      watchPriority: watchPriority || undefined,
      minThreatLevel: minThreatLevel ? parseFloat(minThreatLevel) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, competitors });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching competitors:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/market-radar/competitors
 * Create competitor
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, businessId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const competitor = await createCompetitor(tenantId, businessId, {
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
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, competitor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating competitor:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
