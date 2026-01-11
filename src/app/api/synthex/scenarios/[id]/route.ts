/**
 * Synthex Scenario by ID API
 *
 * Phase: D42 - Growth Scenario Planner + Simulation Engine
 *
 * GET - Get scenario with details
 * PUT - Update scenario
 * DELETE - Delete scenario
 * POST - Actions (simulate, analyze)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getScenarioWithDetails,
  updateScenario,
  deleteScenario,
  runSimulation,
  aiAnalyzeScenario,
} from "@/lib/synthex/growthScenarioService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/scenarios/[id]
 * Get scenario with all details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const result = await getScenarioWithDetails(id);

    if (!result) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scenario: result.scenario,
      variables: result.variables,
      assumptions: result.assumptions,
      milestones: result.milestones,
      simulations: result.simulations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching scenario:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/scenarios/[id]
 * Update scenario
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const scenario = await updateScenario(id, {
      scenario_name: body.scenario_name,
      description: body.description,
      scenario_type: body.scenario_type,
      status: body.status,
      start_date: body.start_date,
      end_date: body.end_date,
      time_granularity: body.time_granularity,
      base_values: body.base_values,
      target_values: body.target_values,
      monte_carlo_runs: body.monte_carlo_runs,
      tags: body.tags,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, scenario });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating scenario:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/scenarios/[id]
 * Delete scenario
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteScenario(id);

    return NextResponse.json({ success: true, message: "Scenario deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting scenario:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/scenarios/[id]
 * Perform actions (simulate, analyze)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action, tenantId } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const details = await getScenarioWithDetails(id);
    if (!details) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    switch (action) {
      case "simulate": {
        if (!tenantId) {
          return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
        }
        const simulation = await runSimulation(tenantId, id, {
          num_runs: body.num_runs,
          variable_overrides: body.variable_overrides,
          simulation_name: body.simulation_name,
        });
        return NextResponse.json({ success: true, simulation });
      }

      case "analyze": {
        const analysis = await aiAnalyzeScenario(
          details.scenario,
          details.variables,
          details.assumptions
        );
        return NextResponse.json({ success: true, analysis });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing scenario action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
