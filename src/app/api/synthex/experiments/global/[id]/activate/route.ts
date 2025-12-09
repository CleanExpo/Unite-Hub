/**
 * Synthex Global Experiment Activation API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * POST - Activate, pause, or complete an experiment
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  activateExperiment,
  pauseExperiment,
  completeExperiment,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/experiments/global/[id]/activate
 * Change experiment status
 *
 * Body:
 * - action: "activate" | "pause" | "complete" | "rollback"
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
    const { action } = body;

    if (!action || !["activate", "pause", "complete", "rollback"].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: activate, pause, complete, rollback" },
        { status: 400 }
      );
    }

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["activate"],
      active: ["pause", "complete", "rollback"],
      paused: ["activate", "complete", "rollback"],
      completed: [], // No transitions from completed
      archived: [], // No transitions from archived
      rollback: ["activate"], // Can reactivate after rollback
    };

    const allowedActions = validTransitions[existing.exp_status] || [];
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        {
          error: `Cannot ${action} an experiment in ${existing.exp_status} status. Allowed: ${allowedActions.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // Perform the action
    let experiment;
    switch (action) {
      case "activate":
        experiment = await activateExperiment(id);
        break;
      case "pause":
        experiment = await pauseExperiment(id);
        break;
      case "complete":
        experiment = await completeExperiment(id);
        break;
      case "rollback":
        // Rollback stops experiment and marks for review
        const { updateExperiment } = await import("@/lib/synthex/globalExperimentService");
        experiment = await updateExperiment(id, {
          exp_status: "rollback",
          actual_end: new Date().toISOString(),
        });
        break;
    }

    return NextResponse.json({
      success: true,
      experiment,
      message: `Experiment ${action}d successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error changing experiment status:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
