/**
 * Synthex APPE Execution by ID API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * GET - Get execution with logs
 * POST - Control execution (pause/resume/cancel)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExecutionWithLogs,
  pauseExecution,
  resumeExecution,
  cancelExecution,
  getExecution,
} from "@/lib/synthex/playbookEngineService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/playbooks/appe/executions/[id]
 * Get execution with all logs
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const result = await getExecutionWithLogs(id);

    if (!result) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      execution: result.execution,
      logs: result.logs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching execution:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/playbooks/appe/executions/[id]
 * Control execution (pause/resume/cancel)
 *
 * Body:
 * - action: "pause" | "resume" | "cancel"
 * - reason: (for cancel) cancellation reason
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["pause", "resume", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'pause', 'resume', or 'cancel'" },
        { status: 400 }
      );
    }

    const existing = await getExecution(id);
    if (!existing) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    // Validate action based on current status
    if (action === "pause" && existing.execution_status !== "running") {
      return NextResponse.json(
        { error: "Can only pause running executions" },
        { status: 400 }
      );
    }
    if (action === "resume" && existing.execution_status !== "paused") {
      return NextResponse.json(
        { error: "Can only resume paused executions" },
        { status: 400 }
      );
    }
    if (action === "cancel" && !["queued", "running", "paused"].includes(existing.execution_status)) {
      return NextResponse.json(
        { error: "Can only cancel queued, running, or paused executions" },
        { status: 400 }
      );
    }

    let execution;
    switch (action) {
      case "pause":
        execution = await pauseExecution(id);
        break;
      case "resume":
        execution = await resumeExecution(id);
        break;
      case "cancel":
        execution = await cancelExecution(id, user?.id || "system", reason);
        break;
    }

    return NextResponse.json({
      success: true,
      execution,
      message: `Execution ${action}d successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error controlling execution:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
