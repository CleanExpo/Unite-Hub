import { NextRequest, NextResponse } from "next/server";
import { getSimulationRun } from "@/lib/guardian/remediationSimulatorService";
import {
  jsonError,
  mapServiceError,
  requireGuardianRemediationAdmin,
} from "@/app/api/guardian/remediation/_shared";

export async function GET(req: NextRequest, args: { params: { id: string } }) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const runId = args?.params?.id;
    if (!runId || typeof runId !== "string") {
      return jsonError(400, "run id is required");
    }

    const tenantId = ctxResult.ctx.workspace.id;
    const run = await getSimulationRun(tenantId, runId, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    if (!run) {
return jsonError(404, "Run not found");
}

    return NextResponse.json({ success: true, data: run }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

