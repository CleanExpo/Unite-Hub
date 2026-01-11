/**
 * Synthex Global Experiment AI Analysis API
 *
 * Phase: D37 - Global Experiment Orchestrator (GEO)
 *
 * POST - Run AI analysis on experiment
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getExperiment,
  aiAnalyzeExperiment,
} from "@/lib/synthex/globalExperimentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/experiments/global/[id]/analyze
 * Run AI analysis on experiment performance
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;

    const existing = await getExperiment(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Run AI analysis
    const analysis = await aiAnalyzeExperiment(existing.tenant_id, id);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error analyzing experiment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
