import { NextRequest, NextResponse } from "next/server";
import { listSimulationRuns } from "@/lib/guardian/remediationSimulatorService";
import {
  mapServiceError,
  requireGuardianRemediationAdmin,
} from "@/app/api/guardian/remediation/_shared";

export async function GET(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const params = req.nextUrl.searchParams;
    const playbookId = params.get("playbookId") || undefined;
    const tenantId = ctxResult.ctx.workspace.id;

    const runs = await listSimulationRuns(tenantId, playbookId, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: runs }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

