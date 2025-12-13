import { NextRequest, NextResponse } from "next/server";
import { recordImpactSnapshot } from "@/lib/guardian/remediationImpactService";
import {
  mapServiceError,
  requireGuardianRemediationAdmin,
} from "@/app/api/guardian/remediation/_shared";

export async function POST(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const workspaceId = ctxResult.ctx.workspace.id;
    const result = await recordImpactSnapshot(workspaceId, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

