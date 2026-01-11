/**
 * Synthex Global Experiment Rollouts API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * GET - List rollouts for experiment
 * POST - Create new rollout
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  createRollout,
  listRollouts,
  updateRollout,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/experiments/global/[id]/rollouts
 * List rollouts for an experiment
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

    const rollouts = await listRollouts(id, {
      is_active: searchParams.get("active") === "true" ? true : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      rollouts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching rollouts:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/experiments/global/[id]/rollouts
 * Create a new rollout for an experiment
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

    if (!body.segment_key) {
      return NextResponse.json(
        { error: "segment_key is required" },
        { status: 400 }
      );
    }

    const rollout = await createRollout(existing.tenant_id, id, {
      segment_key: body.segment_key,
      segment_name: body.segment_name,
      segment_filter: body.segment_filter,
      allocation: body.allocation,
      variant_allocations: body.variant_allocations,
      metadata: body.metadata,
    });

    return NextResponse.json({
      success: true,
      rollout,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating rollout:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/experiments/global/[id]/rollouts
 * Update an existing rollout
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

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    if (!body.rollout_id) {
      return NextResponse.json(
        { error: "rollout_id is required" },
        { status: 400 }
      );
    }

    const rollout = await updateRollout(body.rollout_id, {
      segment_name: body.segment_name,
      segment_filter: body.segment_filter,
      allocation: body.allocation,
      variant_allocations: body.variant_allocations,
      is_active: body.is_active,
      metadata: body.metadata,
    });

    return NextResponse.json({
      success: true,
      rollout,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating rollout:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
