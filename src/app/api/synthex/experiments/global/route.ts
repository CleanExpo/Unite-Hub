/**
 * Synthex Global Experiments API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * POST - Create experiment
 * GET - List experiments
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createExperiment,
  listExperiments,
  getStats,
  aiSuggestExperiments,
  type ExperimentScope,
  type ExperimentStatus,
  type RolloutStrategy,
} from "@/lib/synthex/globalExperimentService";

/**
 * POST /api/synthex/experiments/global
 * Create a new global experiment
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    const user = await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!body.experiment_key || !body.experiment_name) {
      return NextResponse.json(
        { error: "experiment_key and experiment_name are required" },
        { status: 400 }
      );
    }

    const experiment = await createExperiment(
      tenantId,
      {
        experiment_key: body.experiment_key,
        experiment_name: body.experiment_name,
        description: body.description,
        exp_scope: body.exp_scope as ExperimentScope,
        scope_config: body.scope_config,
        config: body.config,
        variants: body.variants,
        default_variant: body.default_variant,
        rollout_strategy: body.rollout_strategy as RolloutStrategy,
        rollout_config: body.rollout_config,
        rollout_percentage: body.rollout_percentage,
        scheduled_start: body.scheduled_start,
        scheduled_end: body.scheduled_end,
        primary_metric: body.primary_metric,
        success_criteria: body.success_criteria,
        tags: body.tags,
        metadata: body.metadata,
      },
      user?.id
    );

    return NextResponse.json({
      success: true,
      experiment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/experiments/global?tenantId=xxx
 * List experiments with optional filters
 *
 * Query params:
 * - tenantId (required)
 * - status (optional): draft, active, paused, completed, archived, rollback
 * - scope (optional): global, tenant, segment, cohort, channel, region, custom
 * - search (optional): search by name/key
 * - limit (optional): max results
 * - stats (optional): include stats summary
 * - suggest (optional): get AI suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Check for stats request
    if (searchParams.get("stats") === "true") {
      const stats = await getStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }

    // Check for AI suggestions
    if (searchParams.get("suggest") === "true") {
      const goalsParam = searchParams.get("goals");
      const goals = goalsParam ? goalsParam.split(",") : [];
      const suggestions = await aiSuggestExperiments(tenantId, { goals });
      return NextResponse.json({ success: true, suggestions: suggestions.suggestions });
    }

    // List experiments with filters
    const experiments = await listExperiments(tenantId, {
      exp_status: searchParams.get("status") as ExperimentStatus | undefined,
      exp_scope: searchParams.get("scope") as ExperimentScope | undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
    });

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
