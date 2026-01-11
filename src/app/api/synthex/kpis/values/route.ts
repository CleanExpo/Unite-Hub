/**
 * Synthex KPI Values API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * GET - Get latest KPI values
 * POST - Record KPI value
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getLatestKpiValues,
  recordKpiValue,
} from "@/lib/synthex/founderKpiService";

/**
 * GET /api/synthex/kpis/values?tenantId=xxx
 * Get latest KPI values
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

    const values = await getLatestKpiValues(tenantId, businessId || undefined);

    return NextResponse.json({ success: true, values });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching KPI values:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/kpis/values
 * Record a KPI value
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.kpi_definition_id || body.value === undefined) {
      return NextResponse.json(
        { error: "kpi_definition_id and value are required" },
        { status: 400 }
      );
    }

    if (!body.period_start || !body.period_end) {
      return NextResponse.json(
        { error: "period_start and period_end are required" },
        { status: 400 }
      );
    }

    const value = await recordKpiValue(tenantId, {
      business_id: body.business_id,
      kpi_definition_id: body.kpi_definition_id,
      value: body.value,
      period_start: body.period_start,
      period_end: body.period_end,
      source_type: body.source_type,
      source_reference: body.source_reference,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, value });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error recording KPI value:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
