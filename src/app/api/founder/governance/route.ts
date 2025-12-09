/**
 * E36: Governance Scorecard API
 * GET: Get latest scorecard or metric history
 * POST: Compute or record governance metrics
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getLatestScorecard,
  getMetricHistory,
  computeGovernanceScorecard,
  recordGovernanceMetric,
  listGovernanceMetrics,
} from "@/src/lib/founder/governanceScoreService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "history") {
      const metric = searchParams.get("metric");
      const days = parseInt(searchParams.get("days") || "30");
      if (!metric) {
        return NextResponse.json({ error: "metric required" }, { status: 400 });
      }
      const history = await getMetricHistory(workspaceId, metric, days);
      return NextResponse.json({ history });
    }

    if (action === "list") {
      const metrics = await listGovernanceMetrics(workspaceId);
      return NextResponse.json({ metrics });
    }

    const scorecard = await getLatestScorecard(workspaceId);
    return NextResponse.json({ scorecard });
  } catch (error: any) {
    console.error("[governance] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "compute") {
      const scorecard = await computeGovernanceScorecard(workspaceId);
      return NextResponse.json({ scorecard });
    }

    const body = await req.json().catch(() => ({}));
    const { metric, value, metadata } = body;

    if (!metric || value === undefined) {
      return NextResponse.json({ error: "metric and value required" }, { status: 400 });
    }

    const metricId = await recordGovernanceMetric(workspaceId, metric, value, metadata);
    return NextResponse.json({ metricId });
  } catch (error: any) {
    console.error("[governance] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
