/**
 * Synthex APPE Playbook Steps API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * POST - Create step
 * GET - List steps
 * PUT - Reorder steps
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createStep,
  listSteps,
  reorderSteps,
  getPlaybook,
} from "@/lib/synthex/playbookEngineService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/playbooks/appe/[id]/steps
 * Create a new step
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: playbookId } = await context.params;
    const body = await request.json();

    // Get playbook to find tenant_id
    const playbook = await getPlaybook(playbookId);
    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    if (!body.step_key || !body.step_name || !body.step_type) {
      return NextResponse.json(
        { error: "step_key, step_name, and step_type are required" },
        { status: 400 }
      );
    }

    const step = await createStep(playbook.tenant_id, playbookId, {
      step_order: body.step_order ?? 1,
      step_key: body.step_key,
      step_name: body.step_name,
      step_description: body.step_description,
      step_type: body.step_type,
      action_category: body.action_category,
      step_config: body.step_config,
      input_mapping: body.input_mapping,
      output_mapping: body.output_mapping,
      condition_expression: body.condition_expression,
      condition_config: body.condition_config,
      next_step_id: body.next_step_id,
      on_success_step_id: body.on_success_step_id,
      on_failure_step_id: body.on_failure_step_id,
      branch_config: body.branch_config,
      delay_seconds: body.delay_seconds,
      ai_prompt_template: body.ai_prompt_template,
      ai_decision_options: body.ai_decision_options,
      is_required: body.is_required,
      skip_on_error: body.skip_on_error,
    });

    return NextResponse.json({ success: true, step });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating step:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/playbooks/appe/[id]/steps
 * List all steps for a playbook
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: playbookId } = await context.params;

    const steps = await listSteps(playbookId);

    return NextResponse.json({ success: true, steps });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching steps:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/playbooks/appe/[id]/steps
 * Reorder steps
 *
 * Body:
 * - orders: [{ stepId: string, newOrder: number }]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: playbookId } = await context.params;
    const body = await request.json();

    if (!body.orders || !Array.isArray(body.orders)) {
      return NextResponse.json(
        { error: "orders array is required" },
        { status: 400 }
      );
    }

    const steps = await reorderSteps(playbookId, body.orders);

    return NextResponse.json({ success: true, steps });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error reordering steps:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
