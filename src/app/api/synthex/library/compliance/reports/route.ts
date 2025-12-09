/**
 * Synthex Compliance Reports API
 * GET - Get or list reports
 * POST - Generate report
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateReport,
  getReport,
  listReports,
  Framework,
} from "@/lib/synthex/complianceService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const reportId = searchParams.get("reportId");

    // Get specific report
    if (reportId) {
      const report = await getReport(reportId);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        report,
      });
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get("limit") || "10");
    const reports = await listReports(tenantId, limit);

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("[Reports API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, type, frameworks, periodStart, periodEnd } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const report = await generateReport(tenantId, {
      type: type || "snapshot",
      frameworks: frameworks as Framework[] | undefined,
      periodStart,
      periodEnd,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("[Reports API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
