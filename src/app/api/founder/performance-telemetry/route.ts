/**
 * @fileoverview F08 Founder Performance Telemetry API
 * GET: List performance metrics, get summary, get metric history
 * POST: Record performance metric
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordPerformanceMetric,
  listPerformanceMetrics,
  getPerformanceSummary,
  getMetricHistory,
} from "@/lib/founder/performanceTelemetryService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Summary action
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getPerformanceSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Metric history action
    if (action === "metric-history") {
      const metricCode = searchParams.get("metricCode");
      if (!metricCode) {
        return NextResponse.json({ error: "metricCode required for metric-history" }, { status: 400 });
      }
      const days = parseInt(searchParams.get("days") || "30");
      const history = await getMetricHistory(workspaceId, metricCode as any, days);
      return NextResponse.json({ history });
    }

    // Default: List metrics
    const metricCode = searchParams.get("metricCode") as any;
    const limit = parseInt(searchParams.get("limit") || "200");

    const metrics = await listPerformanceMetrics(workspaceId, {
      metricCode,
      limit,
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("[performance-telemetry] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    const metricId = await recordPerformanceMetric({
      tenantId: workspaceId,
      metricCode: body.metricCode,
      value: body.value,
      trend: body.trend,
      rationale: body.rationale,
      confidence: body.confidence,
      signalsUsed: body.signalsUsed,
      periodStart: body.periodStart ? new Date(body.periodStart) : undefined,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined,
      metadata: body.metadata,
    });

    return NextResponse.json({ metricId });
  } catch (error: any) {
    console.error("[performance-telemetry] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
