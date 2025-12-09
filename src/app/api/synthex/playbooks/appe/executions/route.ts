/**
 * Synthex APPE Executions API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * GET - List executions
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listExecutions,
  type APPEExecutionStatus,
} from "@/lib/synthex/playbookEngineService";

/**
 * GET /api/synthex/playbooks/appe/executions?tenantId=xxx
 * List executions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const executions = await listExecutions(tenantId, {
      playbook_id: searchParams.get("playbookId") || undefined,
      status: searchParams.get("status") as APPEExecutionStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, executions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching executions:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
