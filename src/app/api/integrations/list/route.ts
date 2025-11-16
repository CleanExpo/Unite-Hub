import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;

    // Get user's organization
    const { data: userOrg, error: orgError } = await db.supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
    }

    const integrations = await db.emailIntegrations.getByOrg(userOrg.org_id);

    return NextResponse.json({
      success: true,
      integrations: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        account_email: i.account_email,
        is_active: i.is_active,
        last_sync_at: i.last_sync_at,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to list integrations" },
      { status: 500 }
    );
  }
}
