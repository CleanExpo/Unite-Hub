/**
 * Synthex Goals API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * GET - List goals
 * POST - Create goal
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listGoals,
  createGoal,
} from "@/lib/synthex/founderKpiService";

/**
 * GET /api/synthex/goals?tenantId=xxx
 * List goals
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

    const goals = await listGoals(
      tenantId,
      searchParams.get("businessId") || undefined
    );

    return NextResponse.json({ success: true, goals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.goal_name || body.target_value === undefined) {
      return NextResponse.json(
        { error: "goal_name and target_value are required" },
        { status: 400 }
      );
    }

    if (!body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    const goal = await createGoal(tenantId, {
      goal_name: body.goal_name,
      description: body.description,
      business_id: body.business_id,
      kpi_definition_id: body.kpi_definition_id,
      target_value: body.target_value,
      start_date: body.start_date,
      end_date: body.end_date,
      milestones: body.milestones,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, goal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
