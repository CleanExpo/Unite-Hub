import { NextRequest, NextResponse } from "next/server";
import { decideRecommendation } from "@/lib/guardian/remediationLifecycleService";
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

    const recommendationId = body?.recommendationId;
    const decisionBody = body?.decision ?? body;

    if (typeof recommendationId !== "string" || recommendationId.length < 10) {
      return jsonError(400, "recommendationId is required");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const row = await decideRecommendation(
      workspaceId,
      recommendationId,
      {
        status: decisionBody?.status,
        reason: decisionBody?.reason,
        notes: decisionBody?.notes,
        decidedBy: ctxResult.ctx.user.id,
      },
      {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
      }
    );

    return NextResponse.json({ success: true, data: row }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}
