import { NextRequest, NextResponse } from "next/server";
import {
  createPlaybook,
  listPlaybooks,
} from "@/lib/guardian/remediationSimulatorService";
import {
  mapServiceError,
  requireGuardianRemediationAdmin,
  jsonError,
} from "@/app/api/guardian/remediation/_shared";

export async function GET(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const params = req.nextUrl.searchParams;
    const tenantId = ctxResult.ctx.workspace.id;

    const isActiveRaw = params.get("is_active");
    const is_active =
      isActiveRaw === null
        ? undefined
        : isActiveRaw === "true"
          ? true
          : isActiveRaw === "false"
            ? false
            : undefined;

    const category = params.get("category") || undefined;
    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;
    const offset = params.get("offset") ? Number(params.get("offset")) : undefined;

    const result = await listPlaybooks(
      tenantId,
      { is_active, category, limit, offset },
      { supabase: ctxResult.ctx.supabase, actorId: ctxResult.ctx.user.id }
    );

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

export async function POST(req: NextRequest) {
  const ctxResult = await requireGuardianRemediationAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const tenantId = ctxResult.ctx.workspace.id;
    const playbook = await createPlaybook(tenantId, body, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: playbook }, { status: 201 });
  } catch (error) {
    return mapServiceError(error);
  }
}

