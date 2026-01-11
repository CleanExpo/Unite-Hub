/**
 * Synthex KPI by ID API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * GET - Get KPI definition with history
 * PUT - Update KPI definition
 * DELETE - Delete KPI definition
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getKpiDefinition,
  updateKpiDefinition,
  deleteKpiDefinition,
  getKpiHistory,
  aiAnalyzeKpiTrends,
} from "@/lib/synthex/founderKpiService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/kpis/[id]
 * Get KPI definition with optional history
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("includeHistory") === "true";
    const includeAnalysis = searchParams.get("includeAnalysis") === "true";
    const businessId = searchParams.get("businessId");

    const kpi = await getKpiDefinition(id);
    if (!kpi) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    const result: Record<string, unknown> = { success: true, kpi };

    if (includeHistory) {
      result.history = await getKpiHistory(id, businessId || undefined, 30);
    }

    if (includeAnalysis && result.history) {
      result.analysis = await aiAnalyzeKpiTrends(
        kpi,
        result.history as Awaited<ReturnType<typeof getKpiHistory>>
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching KPI:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/kpis/[id]
 * Update KPI definition
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const kpi = await updateKpiDefinition(id, {
      kpi_name: body.kpi_name,
      description: body.description,
      category: body.category,
      calculation_formula: body.calculation_formula,
      data_source: body.data_source,
      unit: body.unit,
      decimals: body.decimals,
      display_format: body.display_format,
      target_value: body.target_value,
      target_comparison: body.target_comparison,
      aggregation_type: body.aggregation_type,
      time_granularity: body.time_granularity,
      is_global: body.is_global,
      show_on_dashboard: body.show_on_dashboard,
      icon_name: body.icon_name,
      is_active: body.is_active,
      sort_order: body.sort_order,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, kpi });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating KPI:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/kpis/[id]
 * Delete KPI definition
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteKpiDefinition(id);

    return NextResponse.json({ success: true, message: "KPI deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting KPI:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
