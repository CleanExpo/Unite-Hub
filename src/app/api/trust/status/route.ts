/**
 * Trust Status API - Phase 9
 *
 * GET /api/trust/status
 * Return current Trusted Mode status, scopes, and audit summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";

export async function GET(req: NextRequest) {
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

    // Get client_id from query params
    const clientId = req.nextUrl.searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    // Verify user has access to client
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user belongs to org
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get trust status
    const trustService = new TrustModeService();
    const status = await trustService.getStatus(clientId);

    // Get additional details
    const { data: request } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    return NextResponse.json({
      status,
      request: request || null,
      scopes: scopes || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trust status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trust/status
 * Revoke Trusted Mode for a client.
 */
export async function DELETE(req: NextRequest) {
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

    // Get client_id and reason from body
    const body = await req.json();
    const { client_id, reason } = body;

    if (!client_id || !reason) {
      return NextResponse.json(
        { error: "client_id and reason are required" },
        { status: 400 }
      );
    }

    // Verify user has access and is admin
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Revoke Trusted Mode
    const trustService = new TrustModeService();
    const request = await trustService.revokeTrustedMode(
      client_id,
      userId,
      reason
    );

    return NextResponse.json({
      request,
      message: "Trusted Mode revoked",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trust revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
