/**
 * Synthex Experiment Lab API
 *
 * Phase: D44 - Experiment Lab OS (Growth Experiments & A/B Engine)
 *
 * GET - List experiments
 * POST - Create experiment (or from template, or get suggestions)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createExperiment,
  listExperiments,
  createFromTemplate,
  getExperimentStats,
  aiSuggestExperiments,
  type EXPStatus,
  type EXPType,
} from "@/lib/synthex/experimentLabService";

/**
 * GET /api/synthex/experiment-lab
 * List experiments with optional stats
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status") as EXPStatus | null;
    const type = searchParams.get("type") as EXPType | null;
    const includeStats = searchParams.get("includeStats") === "true";

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const experiments = await listExperiments(tenantId, {
      businessId: businessId || undefined,
      status: status || undefined,
      type: type || undefined,
    });

    if (includeStats) {
      const stats = await getExperimentStats(tenantId);
      return NextResponse.json({ success: true, experiments, stats });
    }

    return NextResponse.json({ success: true, experiments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching experiments:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/experiment-lab
 * Create experiment or get AI suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, businessId, action, templateId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // AI suggestions
    if (action === "suggest") {
      const suggestions = await aiSuggestExperiments(tenantId, {
        business_type: body.business_type,
        current_metrics: body.current_metrics,
        recent_experiments: body.recent_experiments,
      });
      return NextResponse.json({ success: true, suggestions });
    }

    // Create from template
    if (templateId) {
      const result = await createFromTemplate(tenantId, businessId, templateId, {
        name: body.name,
        description: body.description,
        hypothesis: body.hypothesis,
        primary_metric: body.primary_metric,
      });
      return NextResponse.json({
        success: true,
        experiment: result.experiment,
        variants: result.variants,
      });
    }

    // Create new experiment
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.hypothesis) {
      return NextResponse.json({ error: "hypothesis is required" }, { status: 400 });
    }
    if (!body.primary_metric) {
      return NextResponse.json({ error: "primary_metric is required" }, { status: 400 });
    }

    const experiment = await createExperiment(tenantId, businessId, {
      name: body.name,
      description: body.description,
      hypothesis: body.hypothesis,
      experiment_type: body.experiment_type,
      primary_metric: body.primary_metric,
      metric_type: body.metric_type,
      target_value: body.target_value,
      minimum_detectable_effect: body.minimum_detectable_effect,
      secondary_metrics: body.secondary_metrics,
      target_audience: body.target_audience,
      traffic_allocation: body.traffic_allocation,
      scheduled_start: body.scheduled_start,
      scheduled_end: body.scheduled_end,
      min_sample_size: body.min_sample_size,
      confidence_level: body.confidence_level,
      allow_early_stopping: body.allow_early_stopping,
      owner_user_id: body.owner_user_id,
      tags: body.tags,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, experiment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
