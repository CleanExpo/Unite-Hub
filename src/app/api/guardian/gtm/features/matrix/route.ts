import { NextRequest, NextResponse } from "next/server";
import { listWorkspaceFeatureMatrix } from "@/lib/guardian/gtm05PricingService";
import {
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
    const matrix = await listWorkspaceFeatureMatrix(workspaceId, {
      supabase: ctxResult.ctx.supabase,
    });

    return NextResponse.json({ success: true, data: matrix }, { status: 200 });
  } catch (error) {
    return mapServiceError(error);
  }
}

