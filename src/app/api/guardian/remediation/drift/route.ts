import { NextRequest, NextResponse } from "next/server";
import { listDriftEvents } from "@/lib/guardian/remediationImpactService";
import {
  jsonError,
  mapServiceError,
  requireGuardianRemediationAdmin,
} from "@/app/api/guardian/remediation/_shared";

export async function GET(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const hoursRaw = req.nextUrl.searchParams.get("hours");
    const hours =
      hoursRaw === null ? 168 : Number.isFinite(Number(hoursRaw)) ? Number(hoursRaw) : NaN;

    if (!Number.isFinite(hours) || hours <= 0) {
      return jsonError(400, "hours must be a positive number");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const events = await listDriftEvents(workspaceId, hours, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json({ success: true, data: { events } }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

