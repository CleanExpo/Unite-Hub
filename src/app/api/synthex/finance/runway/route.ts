/**
 * Synthex Finance Runway API
 *
 * Phase: D43 - Capital & Runway Dashboard
 *
 * GET - Get finance summary or runway snapshots
 * POST - Calculate and store runway snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  calculateRunway,
  getFinanceSummary,
  getLatestRunwaySnapshot,
  listRunwaySnapshots,
  aiAnalyzeFinances,
  aiGenerateForecast,
} from "@/lib/synthex/financeRunwayService";

/**
 * GET /api/synthex/finance/runway
 * Get finance summary or runway snapshots
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const mode = searchParams.get("mode"); // 'summary', 'snapshots', 'latest'

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    switch (mode) {
      case "snapshots": {
        const limit = searchParams.get("limit");
        const snapshots = await listRunwaySnapshots(tenantId, {
          businessId: businessId || undefined,
          limit: limit ? parseInt(limit, 10) : 12,
        });
        return NextResponse.json({ success: true, snapshots });
      }

      case "latest": {
        const snapshot = await getLatestRunwaySnapshot(tenantId, businessId || undefined);
        return NextResponse.json({ success: true, snapshot });
      }

      case "summary":
      default: {
        const summary = await getFinanceSummary(tenantId, businessId || undefined);
        return NextResponse.json({ success: true, summary });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching runway data:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/finance/runway
 * Actions: calculate, analyze, forecast
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

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "calculate": {
        const snapshot = await calculateRunway(tenantId, businessId, {
          scenario_type: body.scenario_type,
          revenue_growth_rate: body.revenue_growth_rate,
          expense_growth_rate: body.expense_growth_rate,
          include_receivables: body.include_receivables,
          include_payables: body.include_payables,
          additional_inputs: body.additional_inputs,
        });
        return NextResponse.json({ success: true, snapshot });
      }

      case "analyze": {
        const summary = await getFinanceSummary(tenantId, businessId);
        const analysis = await aiAnalyzeFinances(summary, {
          includeRecommendations: body.includeRecommendations,
          focusAreas: body.focusAreas,
        });
        return NextResponse.json({ success: true, analysis });
      }

      case "forecast": {
        if (!body.forecast_months) {
          return NextResponse.json(
            { error: "forecast_months is required" },
            { status: 400 }
          );
        }
        const summary = await getFinanceSummary(tenantId, businessId);
        const forecast = await aiGenerateForecast(summary, {
          forecast_months: body.forecast_months,
          scenario_type: body.scenario_type || "moderate",
          assumptions: body.assumptions,
        });
        return NextResponse.json({ success: true, forecast });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing runway action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
