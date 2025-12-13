import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/guardian/remediationRecommendationsService";
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

    const hoursRaw = body?.hours;
    const hours =
      hoursRaw === undefined || hoursRaw === null
        ? 24
        : typeof hoursRaw === "number"
          ? hoursRaw
          : Number(hoursRaw);

    if (!Number.isFinite(hours) || hours <= 0) {
      return jsonError(400, "hours must be a positive number");
    }

    const workspaceId = ctxResult.ctx.workspace.id;
    const result = await generateRecommendations(workspaceId, hours, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

