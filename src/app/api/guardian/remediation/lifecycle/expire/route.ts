import { NextRequest, NextResponse } from "next/server";
import { expireStaleRecommendations } from "@/lib/guardian/remediationLifecycleService";
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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const daysRaw = body?.days;
    const days =
      daysRaw === undefined || daysRaw === null
        ? 90
        : typeof daysRaw === "number"
          ? daysRaw
          : Number(daysRaw);

    if (!Number.isFinite(days) || days <= 0) {
      return jsonError(400, "days must be a positive number");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const result = await expireStaleRecommendations(workspaceId, days, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}
