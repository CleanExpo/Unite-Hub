/**
 * Synthex APPE AI Generate API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * POST - AI-generate playbook from description
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  aiGeneratePlaybook,
  createPlaybook,
  createStep,
} from "@/lib/synthex/playbookEngineService";

/**
 * POST /api/synthex/playbooks/appe/generate
 * AI-generate a playbook from natural language description
 *
 * Body:
 * - tenantId: tenant ID
 * - description: natural language description of the playbook
 * - auto_create: if true, automatically create the playbook (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, description, auto_create } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    // Generate playbook structure using AI
    const generated = await aiGeneratePlaybook(description);

    // If auto_create is false, just return the generated structure
    if (!auto_create) {
      return NextResponse.json({
        success: true,
        generated,
        message: "Playbook structure generated. Set auto_create=true to create it.",
      });
    }

    // Create the playbook
    const playbookKey = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const playbook = await createPlaybook(tenantId, {
      playbook_key: playbookKey,
      playbook_name: generated.playbook_name,
      playbook_description: generated.playbook_description,
      trigger_type: generated.trigger_type,
      category: generated.category,
      ai_enabled: true,
    });

    // Create steps
    const createdSteps = [];
    for (let i = 0; i < generated.steps.length; i++) {
      const stepDef = generated.steps[i];
      const step = await createStep(tenantId, playbook.id, {
        step_order: i + 1,
        step_key: `step-${i + 1}`,
        step_name: stepDef.step_name,
        step_type: stepDef.step_type,
        action_category: stepDef.action_category,
        step_config: stepDef.step_config,
        delay_seconds: stepDef.delay_seconds,
      });
      createdSteps.push(step);
    }

    return NextResponse.json({
      success: true,
      playbook,
      steps: createdSteps,
      generated,
      message: "Playbook created from AI generation",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error generating playbook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
