/**
 * Synthex Global Experiment Metrics API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * GET - List metrics for experiment
 * POST - Record new metric
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  recordMetric,
  listMetrics,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/experiments/global/[id]/metrics
 * List metrics for an experiment
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    const metrics = await listMetrics(id, {
      metric_name: searchParams.get("metric") || undefined,
      period_type: searchParams.get("period") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/experiments/global/[id]/metrics
 * Record a new metric for an experiment
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.metric_name || !body.period_start || !body.period_end || !body.metric_values) {
      return NextResponse.json(
        { error: "metric_name, period_start, period_end, and metric_values are required" },
        { status: 400 }
      );
    }

    const metric = await recordMetric(existing.tenant_id, {
      experiment_id: id,
      metric_name: body.metric_name,
      metric_type: body.metric_type,
      period_start: body.period_start,
      period_end: body.period_end,
      period_type: body.period_type,
      metric_values: body.metric_values,
      sample_sizes: body.sample_sizes,
      confidence_intervals: body.confidence_intervals,
      p_values: body.p_values,
      statistical_significance: body.statistical_significance,
    });

    return NextResponse.json({
      success: true,
      metric,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error recording metric:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
