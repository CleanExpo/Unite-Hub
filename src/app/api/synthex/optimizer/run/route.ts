/**
 * Synthex Optimizer Runs API
 *
 * Phase: D48 - Auto-Optimizer Engine
 *
 * GET - List optimizer runs or get summary
 * POST - Create run, execute run
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createRun,
  listRuns,
  executeOptimizerRun,
  getOptimizerSummary,
} from "@/lib/synthex/optimizerEngineService";

/**
 * GET /api/synthex/optimizer/run
 * List optimizer runs or get summary statistics
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "summary") {
      const days = searchParams.get("days");
      const summary = await getOptimizerSummary(tenantId, days ? parseInt(days, 10) : 30);
      return NextResponse.json({ success: true, summary });
    }

    // List runs
    const businessId = searchParams.get("business_id") || undefined;
    const status = searchParams.get("status") as any;
    const limit = searchParams.get("limit");

    const runs = await listRuns(tenantId, {
      businessId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, runs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Optimizer Runs GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/optimizer/run
 * Actions: create, execute
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { scope, business_id } = body;

        if (!scope) {
          return NextResponse.json(
            { success: false, error: "scope is required" },
            { status: 400 }
          );
        }

        const run = await createRun(tenantId, {
          scope,
          business_id,
        });

        return NextResponse.json({ success: true, run });
      }

      case "execute": {
        const { run_id } = body;

        if (!run_id) {
          return NextResponse.json(
            { success: false, error: "run_id is required" },
            { status: 400 }
          );
        }

        const result = await executeOptimizerRun(tenantId, run_id);

        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: create, execute" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Optimizer Runs POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
