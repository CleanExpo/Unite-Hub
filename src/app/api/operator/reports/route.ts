/**
 * Operator Reports API - Phase 10 Week 9
 *
 * Endpoints for generating operator mode reports: overview, guardrail usage,
 * playbook impact, and guardrail validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { OperatorReportService } from "@/lib/operator/operatorReportService";

const reportService = new OperatorReportService();

/**
 * GET /api/operator/reports
 *
 * Query params:
 * - type: overview | guardrail-usage | playbook-impact | validate
 * - organization_id: UUID (required)
 * - start_date: ISO date string (defaults to 30 days ago)
 * - end_date: ISO date string (defaults to now)
 */
export async function GET(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
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

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "overview";
    const organizationId = searchParams.get("organization_id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    // Parse dates
    const endDate = searchParams.get("end_date")
      ? new Date(searchParams.get("end_date")!)
      : new Date();

    const startDate = searchParams.get("start_date")
      ? new Date(searchParams.get("start_date")!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (type) {
      case "overview": {
        const report = await reportService.generateOverviewReport(
          organizationId,
          startDate,
          endDate
        );
        return NextResponse.json({ report });
      }

      case "guardrail-usage": {
        const report = await reportService.generateGuardrailUsageReport(
          organizationId,
          startDate,
          endDate
        );
        return NextResponse.json({ report });
      }

      case "playbook-impact": {
        const report = await reportService.generatePlaybookImpactReport(
          organizationId,
          startDate,
          endDate
        );
        return NextResponse.json({ report });
      }

      case "validate": {
        const result = await reportService.validateGuardrails(organizationId);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
