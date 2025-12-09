/**
 * Synthex Experiment Lab by ID API
 *
 * Phase: D44 - Experiment Lab OS
 *
 * GET - Get experiment with variants and results
 * PUT - Update experiment
 * DELETE - Delete experiment
 * POST - Actions (start, pause, complete, analyze, calculate_results, add_variant)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  updateExperiment,
  deleteExperiment,
  listVariants,
  createVariant,
  listResults,
  calculateResults,
  aiAnalyzeExperiment,
} from "@/lib/synthex/experimentLabService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/experiment-lab/[id]
 * Get experiment with variants and results
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const experiment = await getExperiment(id);
    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    const variants = await listVariants(id);
    const results = await listResults(id, { limit: 10 });

    return NextResponse.json({
      success: true,
      experiment,
      variants,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/experiment-lab/[id]
 * Update experiment
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const experiment = await updateExperiment(id, {
      name: body.name,
      description: body.description,
      hypothesis: body.hypothesis,
      status: body.status,
      primary_metric: body.primary_metric,
      metric_type: body.metric_type,
      target_value: body.target_value,
      minimum_detectable_effect: body.minimum_detectable_effect,
      scheduled_start: body.scheduled_start,
      scheduled_end: body.scheduled_end,
      min_sample_size: body.min_sample_size,
      tags: body.tags,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, experiment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/experiment-lab/[id]
 * Delete experiment
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteExperiment(id);

    return NextResponse.json({ success: true, message: "Experiment deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/experiment-lab/[id]
 * Perform actions on experiment
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const experiment = await getExperiment(id);
    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    switch (action) {
      case "start": {
        const updated = await updateExperiment(id, { status: "running" });
        return NextResponse.json({ success: true, experiment: updated });
      }

      case "pause": {
        const updated = await updateExperiment(id, { status: "paused" });
        return NextResponse.json({ success: true, experiment: updated });
      }

      case "complete": {
        const updated = await updateExperiment(id, { status: "completed" });
        return NextResponse.json({ success: true, experiment: updated });
      }

      case "cancel": {
        const updated = await updateExperiment(id, { status: "cancelled" });
        return NextResponse.json({ success: true, experiment: updated });
      }

      case "calculate_results": {
        const results = await calculateResults(id);
        return NextResponse.json({ success: true, results });
      }

      case "analyze": {
        const variants = await listVariants(id);
        const results = await listResults(id);
        const analysis = await aiAnalyzeExperiment(experiment, variants, results);
        return NextResponse.json({ success: true, analysis });
      }

      case "add_variant": {
        if (!body.variant_key || !body.label) {
          return NextResponse.json(
            { error: "variant_key and label are required" },
            { status: 400 }
          );
        }
        const variant = await createVariant(experiment.tenant_id, id, {
          variant_key: body.variant_key,
          label: body.label,
          description: body.description,
          is_control: body.is_control,
          allocation: body.allocation,
          config: body.config,
          metadata: body.metadata,
        });
        return NextResponse.json({ success: true, variant });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing experiment action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
