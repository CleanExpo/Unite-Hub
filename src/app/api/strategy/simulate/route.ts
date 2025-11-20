/**
 * Strategy Simulate API - Phase 11 Week 3-4
 *
 * Run simulations and forecasts across strategy paths.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { StrategySimulationService } from "@/lib/strategy/strategySimulationService";

const createSimulationSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  simulation_type: z.enum([
    "SINGLE_PATH",
    "MULTI_PATH",
    "MONTE_CARLO",
    "SCENARIO_ANALYSIS",
    "SENSITIVITY_ANALYSIS",
  ]),
  config: z.object({
    numIterations: z.number().optional(),
    confidenceLevel: z.number().optional(),
    timeHorizonDays: z.number().optional(),
    riskMultiplier: z.number().optional(),
    includeOperatorReliability: z.boolean().optional(),
    domainWeights: z.record(z.number()).optional(),
  }).optional(),
  source_proposal_id: z.string().uuid().optional(),
  source_node_ids: z.array(z.string().uuid()).optional(),
});

const requestSchema = z.object({
  action: z.enum([
    "create",
    "run",
    "get_results",
    "list",
    "create_benchmark",
  ]),
  simulation_id: z.string().uuid().optional(),
  simulation: createSimulationSchema.optional(),
  benchmark: z.object({
    name: z.string(),
    metrics: z.record(z.number()),
    description: z.string().optional(),
    snapshot_type: z.string().optional(),
    domain_scores: z.record(z.number()).optional(),
  }).optional(),
  organization_id: z.string().uuid().optional(),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  limit: z.number().optional(),
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

    const { action, simulation_id, simulation, benchmark, organization_id, status, limit } = parsed.data;
    const service = new StrategySimulationService();

    switch (action) {
      case "create": {
        if (!simulation) {
          return NextResponse.json({ error: "Simulation data required" }, { status: 400 });
        }

        const created = await service.createSimulation({
          ...simulation,
          created_by: userId,
        });

        return NextResponse.json({ success: true, simulation: created });
      }

      case "run": {
        if (!simulation_id) {
          return NextResponse.json({ error: "simulation_id required" }, { status: 400 });
        }

        const result = await service.runSimulation(simulation_id);

        return NextResponse.json({ success: true, result });
      }

      case "get_results": {
        if (!simulation_id) {
          return NextResponse.json({ error: "simulation_id required" }, { status: 400 });
        }

        const result = await service.getSimulationResults(simulation_id);

        if (!result) {
          return NextResponse.json({ error: "Simulation not found or not completed" }, { status: 404 });
        }

        return NextResponse.json({ success: true, result });
      }

      case "list": {
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

        const simulations = await service.getSimulations(orgId, { status, limit });

        return NextResponse.json({ success: true, simulations });
      }

      case "create_benchmark": {
        if (!benchmark) {
          return NextResponse.json({ error: "Benchmark data required" }, { status: 400 });
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

        const benchmarkId = await service.createBenchmark(
          orgId,
          benchmark.name,
          benchmark.metrics,
          {
            description: benchmark.description,
            snapshotType: benchmark.snapshot_type,
            domainScores: benchmark.domain_scores,
            createdBy: userId,
          }
        );

        return NextResponse.json({ success: true, benchmark_id: benchmarkId });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Simulation API error:", error);
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
    const organizationId = searchParams.get("organization_id");
    const status = searchParams.get("status") as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    let orgId = organizationId;
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

    const service = new StrategySimulationService();
    const simulations = await service.getSimulations(orgId, {
      status: status || undefined,
      limit,
    });

    return NextResponse.json({ success: true, simulations });
  } catch (error) {
    console.error("Simulation GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
