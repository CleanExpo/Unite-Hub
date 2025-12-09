/**
 * Synthex APPE Playbook Execute API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * POST - Start playbook execution
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  startExecution,
  getPlaybook,
  listExecutions,
} from "@/lib/synthex/playbookEngineService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/playbooks/appe/[id]/execute
 * Start a new playbook execution
 *
 * Body:
 * - triggered_by: trigger type (default: "manual")
 * - trigger_data: additional trigger data
 * - target_entity_type: type of target entity
 * - target_entity_id: ID of target entity
 * - target_context: additional context
 * - input_data: input variables for the playbook
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: playbookId } = await context.params;
    const body = await request.json();

    // Get playbook to verify it exists and is active
    const playbook = await getPlaybook(playbookId);
    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    if (playbook.playbook_status !== "active") {
      return NextResponse.json(
        { error: `Cannot execute playbook with status: ${playbook.playbook_status}` },
        { status: 400 }
      );
    }

    // Check concurrent execution limit
    const runningExecutions = await listExecutions(playbook.tenant_id, {
      playbook_id: playbookId,
      status: "running",
    });

    if (runningExecutions.length >= playbook.max_concurrent_executions) {
      return NextResponse.json(
        { error: `Max concurrent executions (${playbook.max_concurrent_executions}) reached` },
        { status: 429 }
      );
    }

    const execution = await startExecution(playbook.tenant_id, playbookId, {
      triggered_by: body.triggered_by || "manual",
      trigger_data: body.trigger_data,
      target_entity_type: body.target_entity_type,
      target_entity_id: body.target_entity_id,
      target_context: body.target_context,
      input_data: body.input_data,
    });

    return NextResponse.json({
      success: true,
      execution,
      message: "Playbook execution started",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error starting execution:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
