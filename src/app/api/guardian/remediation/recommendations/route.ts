import { NextRequest, NextResponse } from "next/server";
import { listRecommendations } from "@/lib/guardian/remediationRecommendationsService";
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
    const workspaceId = ctxResult.ctx.workspace.id;
    const recommendations = await listRecommendations(workspaceId, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json(
      { success: true, data: { recommendations } },
      { status: 200 }
    );
  } catch (error) {
    return mapServiceError(error);
  }
}

