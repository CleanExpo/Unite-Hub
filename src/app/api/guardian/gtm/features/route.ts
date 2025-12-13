import { NextRequest, NextResponse } from "next/server";
import { listFeatureCatalog } from "@/lib/guardian/gtm05PricingService";
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
    const features = await listFeatureCatalog({ supabase: ctxResult.ctx.supabase });
    return NextResponse.json(
      { success: true, data: { features, total: features.length } },
      { status: 200 }
    );
  } catch (error) {
    return mapServiceError(error);
  }
}

