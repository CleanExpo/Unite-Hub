/**
 * POST /api/audit/run
 * Phase 7: Full SEO/GEO Audit Execution
 *
 * Runs full SEO/GEO audit based on tier, calls DataForSEO MCP,
 * GSC, Bing, Brave, and generates CSV + MD + HTML reports.
 */

// Route segment config for Vercel
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager, { type ReportFile } from "@/server/clientDataManager";
import { AuditEngine } from "@/server/auditEngine";
import { TierLogic } from "@/server/tierLogic";

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
    const { clientId, domain, tier, geo_radius, force } = body;

    // Validate required fields
    if (!clientId || !domain || !tier || !geo_radius) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, domain, tier, geo_radius" },
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

    // Check if recent audit exists (within last 24 hours) unless force=true
    if (!force) {
      const { data: recentAudit } = await supabase
        .from("seo_audit_history")
        .select("audit_id, created_at")
        .eq("client_id", clientId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentAudit) {
        return NextResponse.json(
          {
            error: "Audit already run in the last 24 hours",
            lastAuditId: recentAudit.audit_id,
            lastAuditDate: recentAudit.created_at,
            hint: "Use force=true to override",
          },
          { status: 429 }
        );
      }
    }

    // Build audit configuration based on tier
    const auditConfig = await TierLogic.buildAuditConfig(
      client.client_id,
      client.organization_id || ""
    );

    if (!auditConfig) {
      return NextResponse.json(
        { error: "Failed to build audit configuration" },
        { status: 500 }
      );
    }

    // Create audit record
    const { data: newAudit, error: auditError } = await supabase
      .from("seo_audit_history")
      .insert({
        client_id: clientId,
        audit_type: "full",
        status: "running",
        triggered_by: userId,
      })
      .select("audit_id")
      .single();

    if (auditError || !newAudit) {
      console.error("[API /audit/run] Failed to create audit record:", auditError);
      return NextResponse.json(
        { error: "Failed to create audit record" },
        { status: 500 }
      );
    }

    // Run audit engine
    const engine = new AuditEngine();
    const auditResult = await engine.runAudit(auditConfig) as any;

    if (auditResult.status === "failed") {
      // Update audit status to failed
      await supabase
        .from("seo_audit_history")
        .update({
          status: "failed",
          error_message: auditResult.error,
          completed_at: new Date().toISOString(),
        })
        .eq("audit_id", newAudit.audit_id);

      return NextResponse.json(
        { error: auditResult.error || "Audit execution failed" },
        { status: 500 }
      );
    }

    // Generate reports
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const reports: string[] = [];

    // 1. Save CSV report
    if (auditResult.csvReport) {
      const csvReport: ReportFile = {
        clientId,
        category: "audits",
        filename: `full_audit_${timestamp}`,
        timestamp,
        type: "csv",
      };

      const csvResult = await ClientDataManager.writeReport(
        csvReport,
        auditResult.csvReport
      );

      if (csvResult.success && csvResult.filePath) {
        reports.push(csvResult.filePath);
      }
    }

    // 2. Save MD summary
    if (auditResult.mdSummary) {
      const mdReport: ReportFile = {
        clientId,
        category: "audits",
        filename: `summary_${timestamp}`,
        timestamp,
        type: "md",
      };

      const mdResult = await ClientDataManager.writeReport(
        mdReport,
        auditResult.mdSummary
      );

      if (mdResult.success && mdResult.filePath) {
        reports.push(mdResult.filePath);
      }
    }

    // 3. Save HTML dashboard
    if (auditResult.htmlDashboard) {
      const htmlReport: ReportFile = {
        clientId,
        category: "reports",
        filename: `dashboard_${timestamp}`,
        timestamp,
        type: "html",
      };

      const htmlResult = await ClientDataManager.writeReport(
        htmlReport,
        auditResult.htmlDashboard
      );

      if (htmlResult.success && htmlResult.filePath) {
        reports.push(htmlResult.filePath);
      }
    }

    // 4. Save JSON data
    const jsonData = JSON.stringify(
      {
        healthScore: auditResult.healthScore,
        recommendations: auditResult.recommendations,
        metrics: auditResult.metrics,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    const jsonReport: ReportFile = {
      clientId,
      category: "audits",
      filename: `data_${timestamp}`,
      timestamp,
      type: "json",
    };

    const jsonResult = await ClientDataManager.writeReport(jsonReport, jsonData);
    if (jsonResult.success && jsonResult.filePath) {
      reports.push(jsonResult.filePath);
    }

    // Update audit status to completed
    await supabase
      .from("seo_audit_history")
      .update({
        status: "completed",
        health_score: auditResult.healthScore,
        report_paths: reports,
        completed_at: new Date().toISOString(),
      })
      .eq("audit_id", newAudit.audit_id);

    // Return success response
    return NextResponse.json({
      auditId: newAudit.audit_id,
      clientId,
      domain,
      healthScore: auditResult.healthScore,
      reports,
      folder: `/app/clients/${clientId}/audits/`,
      message: "Audit completed successfully",
    });
  } catch (error) {
    console.error("[API /audit/run] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
