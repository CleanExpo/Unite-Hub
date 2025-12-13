import { NextRequest, NextResponse } from "next/server";
import { listLifecycle } from "@/lib/guardian/remediationLifecycleService";
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
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const workspaceId = ctxResult.ctx.workspace.id;

    const rows = await listLifecycle(workspaceId, status, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: { lifecycle: rows } }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

