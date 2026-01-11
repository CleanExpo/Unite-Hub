/**
 * Synthex Market Radar Summary API
 *
 * Phase: D45 - Market Radar
 *
 * GET - Get market radar summary
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { getMarketRadarSummary } from "@/lib/synthex/marketRadarService";

/**
 * GET /api/synthex/market-radar
 * Get market radar summary
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const summary = await getMarketRadarSummary(tenantId, businessId || undefined);

    return NextResponse.json({ success: true, summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching market radar summary:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
