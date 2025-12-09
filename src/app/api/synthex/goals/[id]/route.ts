/**
 * Synthex Goal by ID API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * POST - Update goal progress
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { updateGoalProgress } from "@/lib/synthex/founderKpiService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/goals/[id]
 * Update goal progress
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { currentValue } = body;

    if (currentValue === undefined) {
      return NextResponse.json({ error: "currentValue is required" }, { status: 400 });
    }

    const goal = await updateGoalProgress(id, currentValue);

    return NextResponse.json({ success: true, goal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating goal progress:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
