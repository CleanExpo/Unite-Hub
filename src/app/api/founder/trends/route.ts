/**
 * @fileoverview E49 Longitudinal Founder Trend Engine API
 * GET: List metrics, get summary, get metric trend
 * POST: Record metric
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listTrendMetrics,
  recordTrendMetric,
  getTrendSummary,
  getMetricTrend,
} from "@/lib/founder/trendService";

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
      const days = parseInt(searchParams.get("days") || "30");
      const summary = await getTrendSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Metric trend action
    if (action === "metric-trend") {
      const metricCode = searchParams.get("metricCode");
      if (!metricCode) {
        return NextResponse.json({ error: "metricCode required for metric-trend" }, { status: 400 });
      }
      const days = parseInt(searchParams.get("days") || "30");
      const trend = await getMetricTrend(workspaceId, metricCode, days);
      return NextResponse.json({ trend });
    }

    // Default: List metrics
    const metricCode = searchParams.get("metricCode") || undefined;
    const window = searchParams.get("window") as any;
    const limit = parseInt(searchParams.get("limit") || "500");

    const metrics = await listTrendMetrics(workspaceId, {
      metricCode,
      window,
      limit,
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("[trends] GET error:", error);
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

    const metricId = await recordTrendMetric({
      tenantId: workspaceId,
      metricCode: body.metricCode,
      metricName: body.metricName,
      value: body.value,
      window: body.window,
      metadata: body.metadata,
    });

    return NextResponse.json({ metricId });
  } catch (error: any) {
    console.error("[trends] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
