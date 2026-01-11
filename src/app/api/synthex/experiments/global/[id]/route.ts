/**
 * Synthex Global Experiment by ID API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * GET - Get single experiment
 * PUT - Update experiment
 * DELETE - Delete experiment (soft archive)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  updateExperiment,
  listRollouts,
  listMetrics,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/experiments/global/[id]
 * Get a single experiment with rollouts and metrics
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;

    const experiment = await getExperiment(id);

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Optionally include rollouts and metrics
    const { searchParams } = new URL(request.url);
    const includeRollouts = searchParams.get("rollouts") === "true";
    const includeMetrics = searchParams.get("metrics") === "true";

    let rollouts = null;
    let metrics = null;

    if (includeRollouts) {
      rollouts = await listRollouts(id);
    }

    if (includeMetrics) {
      metrics = await listMetrics(id, { limit: 30 });
    }

    return NextResponse.json({
      success: true,
      experiment,
      ...(rollouts && { rollouts }),
      ...(metrics && { metrics }),
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
 * PUT /api/synthex/experiments/global/[id]
 * Update an experiment
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    // Check experiment exists
    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Prevent certain updates on active experiments
    if (existing.exp_status === "active") {
      const protectedFields = ["experiment_key", "variants", "default_variant"];
      for (const field of protectedFields) {
        if (body[field] !== undefined && body[field] !== existing[field as keyof typeof existing]) {
          return NextResponse.json(
            { error: `Cannot change ${field} on an active experiment` },
            { status: 400 }
          );
        }
      }
    }

    const experiment = await updateExperiment(id, body);

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
 * DELETE /api/synthex/experiments/global/[id]
 * Archive an experiment (soft delete)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Soft delete by archiving
    await updateExperiment(id, { exp_status: "archived" });

    return NextResponse.json({
      success: true,
      message: "Experiment archived",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error archiving experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
