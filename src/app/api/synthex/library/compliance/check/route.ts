/**
 * Synthex Compliance Check API
 * GET - Get check results
 * POST - Run compliance check
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkContent,
  getCheck,
  listChecks,
  Framework,
  RiskLevel,
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
    const checkId = searchParams.get("checkId");

    // Get specific check
    if (checkId) {
      const check = await getCheck(checkId);
      if (!check) {
        return NextResponse.json({ error: "Check not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        check,
      });
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // List checks
    const filters = {
      is_compliant: searchParams.get("is_compliant") === "true" ? true :
                    searchParams.get("is_compliant") === "false" ? false : undefined,
      risk_level: searchParams.get("risk_level") as RiskLevel | undefined,
      content_type: searchParams.get("content_type") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
    };

    const checks = await listChecks(tenantId, filters);

    return NextResponse.json({
      success: true,
      checks,
    });
  } catch (error) {
    console.error("[Compliance Check API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get checks" },
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
    const { tenantId, content, contentType, contentId, subject, fromName, fromEmail, frameworks, jurisdictions } = body;

    if (!tenantId || !content || !contentType) {
      return NextResponse.json(
        { error: "tenantId, content, and contentType are required" },
        { status: 400 }
      );
    }

    const check = await checkContent(tenantId, {
      content,
      contentType,
      contentId,
      subject,
      fromName,
      fromEmail,
      frameworks: frameworks as Framework[] | undefined,
      jurisdictions,
    });

    return NextResponse.json({
      success: true,
      check,
      isCompliant: check.is_compliant,
      riskLevel: check.risk_level,
      score: check.compliance_score,
      issueCount: check.issues.length,
    });
  } catch (error) {
    console.error("[Compliance Check API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run check" },
      { status: 500 }
    );
  }
}
