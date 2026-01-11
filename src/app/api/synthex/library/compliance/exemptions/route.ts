/**
 * Synthex Compliance Exemptions API
 * GET - List exemptions
 * POST - Create exemption
 * DELETE - Revoke exemption
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listExemptions,
  createExemption,
  revokeExemption,
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
    const frameworkCode = searchParams.get("framework") as Framework | undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const exemptions = await listExemptions(tenantId, frameworkCode);

    return NextResponse.json({
      success: true,
      exemptions,
    });
  } catch (error) {
    console.error("[Exemptions API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get exemptions" },
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
    const { tenantId, ...exemptionData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!exemptionData.framework_code || !exemptionData.requirement_code || !exemptionData.reason) {
      return NextResponse.json(
        { error: "framework_code, requirement_code, and reason are required" },
        { status: 400 }
      );
    }

    const exemption = await createExemption(tenantId, exemptionData, user.id);

    return NextResponse.json({
      success: true,
      exemption,
    });
  } catch (error) {
    console.error("[Exemptions API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create exemption" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exemptionId = searchParams.get("exemptionId");

    if (!exemptionId) {
      return NextResponse.json(
        { error: "exemptionId is required" },
        { status: 400 }
      );
    }

    await revokeExemption(exemptionId);

    return NextResponse.json({
      success: true,
      revoked: true,
    });
  } catch (error) {
    console.error("[Exemptions API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke exemption" },
      { status: 500 }
    );
  }
}
