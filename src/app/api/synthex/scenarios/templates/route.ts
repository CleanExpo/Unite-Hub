/**
 * Synthex Scenario Templates API
 *
 * Phase: D42 - Growth Scenario Planner + Simulation Engine
 *
 * GET - List templates
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { listTemplates } from "@/lib/synthex/growthScenarioService";

/**
 * GET /api/synthex/scenarios/templates
 * List available templates
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const publicOnly = searchParams.get("publicOnly") === "true";

    const templates = await listTemplates(tenantId || undefined, publicOnly);

    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
