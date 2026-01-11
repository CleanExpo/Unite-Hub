/**
 * Synthex Alerts API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * GET - List alerts
 * POST - Create alert
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listAlerts,
  createAlert,
  type FCTAlertSeverity,
  type FCTAlertStatus,
} from "@/lib/synthex/founderKpiService";

/**
 * GET /api/synthex/alerts?tenantId=xxx
 * List alerts with optional filters
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

    const alerts = await listAlerts(tenantId, {
      status: searchParams.get("status") as FCTAlertStatus | undefined,
      severity: searchParams.get("severity") as FCTAlertSeverity | undefined,
      business_id: searchParams.get("businessId") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, alerts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/alerts
 * Create a new alert
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

    if (!body.alert_type || !body.title) {
      return NextResponse.json(
        { error: "alert_type and title are required" },
        { status: 400 }
      );
    }

    const alert = await createAlert(tenantId, {
      alert_type: body.alert_type,
      title: body.title,
      message: body.message,
      severity: body.severity,
      business_id: body.business_id,
      kpi_definition_id: body.kpi_definition_id,
      kpi_value: body.kpi_value,
      threshold_value: body.threshold_value,
      action_url: body.action_url,
      action_label: body.action_label,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
