import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspacePlanTier,
  setWorkspacePlanTier,
} from "@/lib/guardian/gtm05PricingService";
import {
  jsonError,
  mapServiceError,
  requireGuardianGtmAdmin,
} from "@/app/api/guardian/gtm/_shared";

export async function GET(req: NextRequest) {
  const ctxResult = await requireGuardianGtmAdmin(req);
  if (!ctxResult.ok) {
return ctxResult.response;
}

  try {
    const workspaceId = ctxResult.ctx.workspace.id;
    const row = await getWorkspacePlanTier(workspaceId, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          is_set: !!row,
          tier: row?.tier ?? "internal",
          record: row,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return mapServiceError(error);
  }
}

export async function POST(req: NextRequest) {
  const ctxResult = await requireGuardianGtmAdmin(req);
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

    const tier = body?.tier;
    const notes = body?.notes;

    const workspaceId = ctxResult.ctx.workspace.id;
    const updated = await setWorkspacePlanTier(workspaceId, tier, notes, {
      supabase: ctxResult.ctx.supabase,
      actorId: ctxResult.ctx.user.id,
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

