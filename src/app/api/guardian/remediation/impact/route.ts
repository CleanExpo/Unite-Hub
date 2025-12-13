import { NextRequest, NextResponse } from "next/server";
import { listImpacts } from "@/lib/guardian/remediationImpactService";
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
    const recommendationId = req.nextUrl.searchParams.get("recommendationId");
    if (!recommendationId) {
      return jsonError(400, "recommendationId is required");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const impacts = await listImpacts(workspaceId, recommendationId, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json({ success: true, data: { impacts } }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

