/**
 * Synthex Optimizer Actions API
 *
 * Phase: D48 - Auto-Optimizer Engine
 *
 * GET - List actions for a run
 * POST - Update action status
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listActions,
  updateActionStatus,
} from "@/lib/synthex/optimizerEngineService";

/**
 * GET /api/synthex/optimizer/actions
 * List optimizer actions for a run with filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("run_id");

    if (!runId) {
      return NextResponse.json(
        { success: false, error: "run_id is required" },
        { status: 400 }
      );
    }

    const priority = searchParams.get("priority") as any;
    const status = searchParams.get("status") as any;

    const actions = await listActions(tenantId, runId, {
      priority,
      status,
    });

    return NextResponse.json({ success: true, actions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Optimizer Actions GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/optimizer/actions
 * Update action status
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { action_id, status } = body;

    if (!action_id || !status) {
      return NextResponse.json(
        { success: false, error: "action_id and status are required" },
        { status: 400 }
      );
    }

    const action = await updateActionStatus(action_id, status);

    return NextResponse.json({ success: true, action });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Optimizer Actions POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
