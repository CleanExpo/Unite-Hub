/**
 * Synthex Scenario Variables API
 *
 * Phase: D42 - Growth Scenario Planner + Simulation Engine
 *
 * GET - List variables
 * POST - Add variable
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listVariables,
  addVariable,
  getScenario,
  type GSPVariableType,
  type GSPConfidence,
} from "@/lib/synthex/growthScenarioService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/scenarios/[id]/variables
 * List variables for a scenario
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: scenarioId } = await context.params;

    const variables = await listVariables(scenarioId);

    return NextResponse.json({ success: true, variables });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching variables:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/scenarios/[id]/variables
 * Add a variable to a scenario
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: scenarioId } = await context.params;
    const body = await request.json();

    // Get scenario to verify it exists and get tenant_id
    const scenario = await getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    if (!body.variable_name || !body.variable_code) {
      return NextResponse.json(
        { error: "variable_name and variable_code are required" },
        { status: 400 }
      );
    }

    if (body.base_value === undefined) {
      return NextResponse.json(
        { error: "base_value is required" },
        { status: 400 }
      );
    }

    const variable = await addVariable(scenario.tenant_id, scenarioId, {
      variable_name: body.variable_name,
      variable_code: body.variable_code,
      variable_type: body.variable_type as GSPVariableType,
      description: body.description,
      base_value: body.base_value,
      min_value: body.min_value,
      max_value: body.max_value,
      growth_type: body.growth_type,
      growth_rate: body.growth_rate,
      distribution_type: body.distribution_type,
      distribution_params: body.distribution_params,
      confidence: body.confidence as GSPConfidence,
      data_source: body.data_source,
      depends_on: body.depends_on,
      dependency_formula: body.dependency_formula,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, variable });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding variable:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
