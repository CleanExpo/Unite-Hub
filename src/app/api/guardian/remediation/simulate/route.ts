import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/guardian/remediationSimulatorService";
import {
  jsonError,
  mapServiceError,
  requireGuardianRemediationAdmin,
} from "@/app/api/guardian/remediation/_shared";

export async function POST(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const playbookId = body?.playbookId;
    const baselineMetrics = body?.baseline_metrics;

    if (typeof playbookId !== "string" || playbookId.length < 10) {
      return jsonError(400, "playbookId is required");
    }

    if (baselineMetrics === undefined) {
      return jsonError(400, "baseline_metrics is required");
    }

    const tenantId = ctxResult.ctx.workspace.id;
    const run = await runSimulation(tenantId, playbookId, baselineMetrics, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: run }, { status: 201 });
  } catch (error) {
    return mapServiceError(error);
  }
}

