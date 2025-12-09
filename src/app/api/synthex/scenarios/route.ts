/**
 * Synthex Growth Scenarios API
 *
 * Phase: D42 - Growth Scenario Planner + Simulation Engine
 *
 * GET - List scenarios
 * POST - Create scenario (or from template)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listScenarios,
  createScenario,
  createFromTemplate,
  getGrowthPlannerStats,
  type GSPScenarioStatus,
  type GSPScenarioType,
} from "@/lib/synthex/growthScenarioService";

/**
 * GET /api/synthex/scenarios?tenantId=xxx
 * List scenarios with optional filters
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

    // Include stats if requested
    if (searchParams.get("includeStats") === "true") {
      const [scenarios, stats] = await Promise.all([
        listScenarios(tenantId, {
          status: searchParams.get("status") as GSPScenarioStatus | undefined,
          scenario_type: searchParams.get("type") as GSPScenarioType | undefined,
          business_id: searchParams.get("businessId") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
        }),
        getGrowthPlannerStats(tenantId),
      ]);

      return NextResponse.json({ success: true, scenarios, stats });
    }

    const scenarios = await listScenarios(tenantId, {
      status: searchParams.get("status") as GSPScenarioStatus | undefined,
      scenario_type: searchParams.get("type") as GSPScenarioType | undefined,
      business_id: searchParams.get("businessId") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, scenarios });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching scenarios:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/scenarios
 * Create a new scenario or from template
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, templateId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Create from template
    if (templateId) {
      const scenario = await createFromTemplate(tenantId, templateId, {
        scenario_name: body.scenario_name,
        description: body.description,
        business_id: body.business_id,
        start_date: body.start_date,
        end_date: body.end_date,
      });
      return NextResponse.json({ success: true, scenario });
    }

    // Create new scenario
    if (!body.scenario_name) {
      return NextResponse.json({ error: "scenario_name is required" }, { status: 400 });
    }
    if (!body.start_date || !body.end_date) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 });
    }

    const scenario = await createScenario(tenantId, {
      scenario_name: body.scenario_name,
      description: body.description,
      business_id: body.business_id,
      scenario_type: body.scenario_type,
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
    console.error("Error creating scenario:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
