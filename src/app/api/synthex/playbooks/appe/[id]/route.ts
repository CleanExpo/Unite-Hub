/**
 * Synthex APPE Playbook by ID API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * GET - Get playbook with steps
 * PUT - Update playbook
 * DELETE - Delete playbook
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getPlaybookWithSteps,
  updatePlaybook,
  deletePlaybook,
} from "@/lib/synthex/playbookEngineService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/playbooks/appe/[id]
 * Get playbook with all steps
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const result = await getPlaybookWithSteps(id);

    if (!result) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      playbook: result.playbook,
      steps: result.steps,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching playbook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/playbooks/appe/[id]
 * Update playbook
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const playbook = await updatePlaybook(id, {
      playbook_name: body.playbook_name,
      playbook_description: body.playbook_description,
      playbook_status: body.playbook_status,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config,
      schedule_cron: body.schedule_cron,
      schedule_timezone: body.schedule_timezone,
      ai_enabled: body.ai_enabled,
      ai_decision_model: body.ai_decision_model,
      ai_confidence_threshold: body.ai_confidence_threshold,
      tags: body.tags,
      category: body.category,
      priority: body.priority,
    });

    return NextResponse.json({ success: true, playbook });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating playbook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/playbooks/appe/[id]
 * Delete playbook
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deletePlaybook(id);

    return NextResponse.json({ success: true, message: "Playbook deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting playbook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
