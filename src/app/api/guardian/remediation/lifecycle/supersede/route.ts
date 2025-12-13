import { NextRequest, NextResponse } from "next/server";
import { supersedeRecommendation } from "@/lib/guardian/remediationLifecycleService";
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

    const oldRecId = body?.oldRecId ?? body?.oldRecommendationId;
    const newRecId = body?.newRecId ?? body?.newRecommendationId;

    if (typeof oldRecId !== "string" || oldRecId.length < 10) {
      return jsonError(400, "oldRecId is required");
    }
    if (typeof newRecId !== "string" || newRecId.length < 10) {
      return jsonError(400, "newRecId is required");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const row = await supersedeRecommendation(workspaceId, oldRecId, newRecId, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: row }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}
