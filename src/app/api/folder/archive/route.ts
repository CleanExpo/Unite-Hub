/**
 * POST /api/folder/archive
 * Phase 7: Archive Old Reports
 *
 * Moves files older than X days (default 365) into /archive/.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager from "@/server/clientDataManager";

export async function POST(req: NextRequest) {
  try {
    // Authentication
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

    // Parse request body
    const body = await req.json();
    const { clientId, days } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { error: "Missing required field: clientId" },
        { status: 400 }
      );
    }

    // Validate days parameter
    const retentionDays = days || 365;
    if (typeof retentionDays !== "number" || retentionDays < 1) {
      return NextResponse.json(
        { error: "days must be a positive number" },
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

    // Archive old reports
    const result = await ClientDataManager.archiveOldReports(clientId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to archive reports" },
        { status: 500 }
      );
    }

    // Log the archiving operation
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "archive_old_reports",
      metadata: {
        archived_count: result.archivedCount || 0,
        retention_days: retentionDays,
        triggered_by: userId,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      clientId,
      domain: client.domain,
      archived: result.archivedCount || 0,
      retentionDays,
      message: `Archived ${result.archivedCount || 0} old reports`,
    });
  } catch (error) {
    console.error("[API /folder/archive] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
