/**
 * Synthex KPIs API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * GET - List KPI definitions
 * POST - Create KPI definition
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listKpiDefinitions,
  createKpiDefinition,
  getControlTowerStats,
  seedDefaultKpis,
  type FCTKpiCategory,
} from "@/lib/synthex/founderKpiService";

/**
 * GET /api/synthex/kpis?tenantId=xxx
 * List KPI definitions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Include stats if requested
    if (searchParams.get("includeStats") === "true") {
      const [kpis, stats] = await Promise.all([
        listKpiDefinitions(tenantId, {
          category: searchParams.get("category") as FCTKpiCategory | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : undefined,
          show_on_dashboard: searchParams.get("show_on_dashboard") === "true" ? true : undefined,
        }),
        getControlTowerStats(tenantId),
      ]);

      return NextResponse.json({ success: true, kpis, stats });
    }

    const kpis = await listKpiDefinitions(tenantId, {
      category: searchParams.get("category") as FCTKpiCategory | undefined,
      is_active: searchParams.get("is_active") === "true" ? true : undefined,
      show_on_dashboard: searchParams.get("show_on_dashboard") === "true" ? true : undefined,
    });

    return NextResponse.json({ success: true, kpis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching KPIs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/kpis
 * Create a new KPI definition or seed defaults
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, action } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Seed defaults action
    if (action === "seed-defaults") {
      await seedDefaultKpis(tenantId);
      return NextResponse.json({ success: true, message: "Default KPIs seeded" });
    }

    // Create new KPI
    if (!body.kpi_name || !body.kpi_code) {
      return NextResponse.json(
        { error: "kpi_name and kpi_code are required" },
        { status: 400 }
      );
    }

    const kpi = await createKpiDefinition(tenantId, {
      kpi_name: body.kpi_name,
      kpi_code: body.kpi_code,
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
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, kpi });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating KPI:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
