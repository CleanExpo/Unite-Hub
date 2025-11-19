/**
 * POST /api/audit/snapshot
 * Phase 7: Weekly Snapshot Generation
 *
 * Generates weekly snapshot (Starter+) or monthly (Free).
 * Saves HTML + CSV into snapshots folder.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager, { type ReportFile } from "@/server/clientDataManager";

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
    const { clientId } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { error: "Missing required field: clientId" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get client profile
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine snapshot frequency based on tier
    const snapshotFrequency: Record<string, number> = {
      Free: 30, // Monthly
      Starter: 7, // Weekly
      Pro: 7, // Weekly
      Enterprise: 7, // Weekly
    };

    const frequency = snapshotFrequency[client.subscription_tier] || 30;

    // Check if recent snapshot exists
    const { data: recentSnapshot } = await supabase
      .from("seo_audit_history")
      .select("audit_id, created_at")
      .eq("client_id", clientId)
      .eq("audit_type", "snapshot")
      .gte("created_at", new Date(Date.now() - frequency * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentSnapshot) {
      return NextResponse.json(
        {
          error: `Snapshot already generated in the last ${frequency} days`,
          lastSnapshotId: recentSnapshot.audit_id,
          lastSnapshotDate: recentSnapshot.created_at,
        },
        { status: 429 }
      );
    }

    // Get latest full audit for comparison
    const { data: latestAudit } = await supabase
      .from("seo_audit_history")
      .select("*")
      .eq("client_id", clientId)
      .eq("audit_type", "full")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!latestAudit) {
      return NextResponse.json(
        { error: "No completed audit found. Run a full audit first." },
        { status: 400 }
      );
    }

    // Create snapshot record
    const { data: newSnapshot, error: snapshotError } = await supabase
      .from("seo_audit_history")
      .insert({
        client_id: clientId,
        audit_type: "snapshot",
        status: "running",
        triggered_by: userId,
      })
      .select("audit_id")
      .single();

    if (snapshotError || !newSnapshot) {
      console.error("[API /audit/snapshot] Failed to create snapshot:", snapshotError);
      return NextResponse.json(
        { error: "Failed to create snapshot record" },
        { status: 500 }
      );
    }

    // Generate snapshot content
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");

    // Generate HTML snapshot
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Snapshot - ${client.domain}</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; border-radius: 8px; }
    .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .score { font-size: 48px; font-weight: bold; color: #10b981; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Weekly SEO Snapshot</h1>
    <p>${client.domain} | ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="metric">
    <h2>Health Score</h2>
    <div class="score">${latestAudit.health_score || 0}/100</div>
  </div>
  <div class="metric">
    <h3>Latest Audit</h3>
    <p>Date: ${new Date(latestAudit.created_at).toLocaleDateString()}</p>
    <p>Type: ${latestAudit.audit_type}</p>
    <p>Status: ${latestAudit.status}</p>
  </div>
</body>
</html>`;

    const htmlReport: ReportFile = {
      clientId,
      category: "snapshots",
      filename: `snapshot_${timestamp}`,
      timestamp,
      type: "html",
    };

    const htmlResult = await ClientDataManager.writeReport(htmlReport, htmlContent);

    if (!htmlResult.success) {
      await supabase
        .from("seo_audit_history")
        .update({
          status: "failed",
          error_message: "Failed to save snapshot",
          completed_at: new Date().toISOString(),
        })
        .eq("audit_id", newSnapshot.audit_id);

      return NextResponse.json(
        { error: "Failed to save snapshot" },
        { status: 500 }
      );
    }

    // Generate CSV data
    const csvContent = `Date,Health Score,Audit Type,Status
${new Date().toISOString()},${latestAudit.health_score || 0},${latestAudit.audit_type},${latestAudit.status}`;

    const csvReport: ReportFile = {
      clientId,
      category: "snapshots",
      filename: `data_${timestamp}`,
      timestamp,
      type: "csv",
    };

    await ClientDataManager.writeReport(csvReport, csvContent);

    // Update snapshot status
    await supabase
      .from("seo_audit_history")
      .update({
        status: "completed",
        health_score: latestAudit.health_score,
        report_paths: [htmlResult.filePath!],
        completed_at: new Date().toISOString(),
      })
      .eq("audit_id", newSnapshot.audit_id);

    return NextResponse.json({
      snapshotId: newSnapshot.audit_id,
      clientId,
      path: htmlResult.filePath,
      healthScore: latestAudit.health_score,
      message: "Snapshot generated successfully",
    });
  } catch (error) {
    console.error("[API /audit/snapshot] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
