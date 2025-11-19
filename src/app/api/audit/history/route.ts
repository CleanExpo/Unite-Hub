/**
 * GET /api/audit/history
 * Phase 7: Audit History Listing
 *
 * Lists all audits performed for the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { error: "Missing required query parameter: clientId" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify client exists
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, domain")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get audit history
    const { data: history, error: historyError } = await supabase
      .from("seo_audit_history")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("[API /audit/history] Error fetching history:", historyError);
      return NextResponse.json(
        { error: "Failed to fetch audit history" },
        { status: 500 }
      );
    }

    // Format history for response
    const formattedHistory = (history || []).map((audit) => ({
      auditId: audit.audit_id,
      type: audit.audit_type,
      status: audit.status,
      healthScore: audit.health_score,
      date: audit.created_at,
      completedAt: audit.completed_at,
      paths: audit.report_paths || [],
      error: audit.error_message,
    }));

    return NextResponse.json({
      clientId,
      domain: client.domain,
      history: formattedHistory,
      count: formattedHistory.length,
    });
  } catch (error) {
    console.error("[API /audit/history] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
