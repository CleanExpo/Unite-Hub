/**
 * Trust Mode Initialization API - Phase 9
 *
 * POST /api/trust/init
 * Begin Trusted Mode onboarding for a client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";
import { InitTrustedModeRequestSchema } from "@/lib/validation/trustSchemas";

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse and validate request
    const body = await req.json();
    const parsed = InitTrustedModeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, restore_email, emergency_phone, nightly_backup_enabled } =
      parsed.data;

    // Get client and verify access
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user is org admin
    const { data: membership, error: membershipError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only organization admins can initialize Trusted Mode" },
        { status: 403 }
      );
    }

    // Initialize Trusted Mode
    const trustService = new TrustModeService();
    const request = await trustService.initializeTrustedMode(
      client_id,
      client.org_id,
      userId,
      {
        restore_email,
        emergency_phone,
        nightly_backup_enabled,
      }
    );

    return NextResponse.json({
      request,
      message: "Trusted Mode initialization started",
      next_step: "verify-identity",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trust init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
