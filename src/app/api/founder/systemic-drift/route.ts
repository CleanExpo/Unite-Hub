import { NextRequest, NextResponse } from "next/server";
import {
  calculateSystemicDrift,
  recordDriftCorrection,
  listSystemicDrift,
  getDriftSummary,
  type DriftCategory,
  type DriftSeverity,
} from "@/lib/founder/systemicDriftService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current drift
    if (action === "calculate") {
      const intentVector = searchParams.get("intentVector");
      const executionVector = searchParams.get("executionVector");

      const drift = await calculateSystemicDrift({
        tenantId: workspaceId,
        intentVector: intentVector ? JSON.parse(intentVector) : undefined,
        executionVector: executionVector ? JSON.parse(executionVector) : undefined,
      });
      return NextResponse.json({ drift });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getDriftSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List drift records
    const category = searchParams.get("category") as DriftCategory | null;
    const severity = searchParams.get("severity") as DriftSeverity | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const drifts = await listSystemicDrift(workspaceId, {
      category: category || undefined,
      severity: severity || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ drifts });
  } catch (error: any) {
    console.error("Systemic drift API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Record drift correction
    if (body.action === "correction") {
      const correctionId = await recordDriftCorrection({
        driftId: body.driftId,
        tenantId: workspaceId,
        correctionType: body.correctionType,
        actionTaken: body.actionTaken,
        impactScore: body.impactScore,
      });

      return NextResponse.json({ success: true, correctionId });
    }

    // Calculate drift (POST version with body data)
    const drift = await calculateSystemicDrift({
      tenantId: workspaceId,
      intentVector: body.intentVector,
      executionVector: body.executionVector,
    });

    return NextResponse.json({ success: true, drift });
  } catch (error: any) {
    console.error("Systemic drift API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
