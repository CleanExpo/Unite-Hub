/**
 * Strategy Evaluate API - Phase 11 Week 3-4
 *
 * Compute expected-value scores, confidence intervals, and path comparisons.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { StrategyEvaluationService } from "@/lib/strategy/strategyEvaluationService";
import { StrategySimulationService } from "@/lib/strategy/strategySimulationService";

const configSchema = z.object({
  riskTolerance: z.number().min(0).max(1).optional(),
  timePreference: z.number().min(0).max(1).optional(),
  valueWeight: z.number().min(0).max(1).optional(),
  probabilityWeight: z.number().min(0).max(1).optional(),
});

const requestSchema = z.object({
  action: z.enum([
    "evaluate_paths",
    "compare_paths",
    "sensitivity_analysis",
    "get_metrics",
    "rank_topsis",
  ]),
  simulation_run_id: z.string().uuid().optional(),
  simulation_run_ids: z.array(z.string().uuid()).optional(),
  path_ids: z.array(z.string().uuid()).optional(),
  organization_id: z.string().uuid().optional(),
  config: configSchema.optional(),
  parameters: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      action,
      simulation_run_id,
      simulation_run_ids,
      path_ids,
      organization_id,
      config,
      parameters,
    } = parsed.data;

    const evaluationService = new StrategyEvaluationService();
    const simulationService = new StrategySimulationService();

    switch (action) {
      case "evaluate_paths": {
        if (!simulation_run_id) {
          return NextResponse.json({ error: "simulation_run_id required" }, { status: 400 });
        }

        const result = await simulationService.getSimulationResults(simulation_run_id);

        if (!result) {
          return NextResponse.json({ error: "Simulation not found or not completed" }, { status: 404 });
        }

        const evaluations = evaluationService.evaluatePaths(result, config);

        return NextResponse.json({ success: true, evaluations });
      }

      case "compare_paths": {
        if (!path_ids || path_ids.length < 2) {
          return NextResponse.json({ error: "At least 2 path_ids required" }, { status: 400 });
        }

        let orgId = organization_id;
        if (!orgId) {
          const supabase = await getSupabaseServer();
          const { data: userOrg } = await supabase
            .from("user_organizations")
            .select("org_id")
            .eq("user_id", userId)
            .single();

          if (!userOrg) {
            return NextResponse.json({ error: "No organization found" }, { status: 400 });
          }
          orgId = userOrg.org_id;
        }

        const comparison = await evaluationService.comparePaths(
          orgId,
          simulation_run_ids || [],
          path_ids,
          config
        );

        return NextResponse.json({ success: true, comparison });
      }

      case "sensitivity_analysis": {
        if (!simulation_run_id) {
          return NextResponse.json({ error: "simulation_run_id required" }, { status: 400 });
        }

        const result = await simulationService.getSimulationResults(simulation_run_id);

        if (!result || result.paths.length === 0) {
          return NextResponse.json({ error: "No paths found for analysis" }, { status: 404 });
        }

        // Analyze the best path
        const bestPath = result.paths.find(p => p.pathId === result.bestPathId) || result.paths[0];
        const sensitivity = evaluationService.performSensitivityAnalysis(
          bestPath,
          parameters || ["success_probability", "expected_value", "duration"]
        );

        return NextResponse.json({ success: true, sensitivity });
      }

      case "get_metrics": {
        if (!simulation_run_id) {
          return NextResponse.json({ error: "simulation_run_id required" }, { status: 400 });
        }

        const metrics = await evaluationService.getEvaluationMetrics(simulation_run_id);

        return NextResponse.json({ success: true, metrics });
      }

      case "rank_topsis": {
        if (!simulation_run_id) {
          return NextResponse.json({ error: "simulation_run_id required" }, { status: 400 });
        }

        const result = await simulationService.getSimulationResults(simulation_run_id);

        if (!result) {
          return NextResponse.json({ error: "Simulation not found or not completed" }, { status: 404 });
        }

        const rankings = evaluationService.rankPathsTOPSIS(result.paths);

        return NextResponse.json({ success: true, rankings });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Evaluate API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const searchParams = req.nextUrl.searchParams;
    const simulationRunId = searchParams.get("simulation_run_id");

    if (!simulationRunId) {
      return NextResponse.json({ error: "simulation_run_id required" }, { status: 400 });
    }

    const evaluationService = new StrategyEvaluationService();
    const metrics = await evaluationService.getEvaluationMetrics(simulationRunId);

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error("Evaluate GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
