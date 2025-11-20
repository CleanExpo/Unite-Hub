/**
 * Trust Report API - Phase 9 Week 9
 *
 * GET /api/trust/report
 * Generate trust mode report.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { trustModeReportGenerator } from "@/lib/reports/trustModeReportGenerator";

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

    // Get query params
    const clientId = req.nextUrl.searchParams.get("client_id");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const format = req.nextUrl.searchParams.get("format") || "json";

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    // Get client org
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("org_id")
      .eq("client_id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Generate report
    const report = await trustModeReportGenerator.generateReport(
      clientId,
      client.org_id,
      from || undefined,
      to || undefined
    );

    // Return formatted
    if (format === "text") {
      const text = trustModeReportGenerator.formatReportAsText(report);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="trust-report-${clientId}.txt"`,
        },
      });
    }

    return NextResponse.json({
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
