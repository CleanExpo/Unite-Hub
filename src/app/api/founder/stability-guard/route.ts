import { NextRequest, NextResponse } from "next/server";
import {
  detectStabilityAnomalies,
  listStabilityAlerts,
  getAlertSummary,
  updateAlertStatus,
  runAutomatedDetection,
  type AlertStatus,
  type AlertSeverity,
} from "@/lib/founder/stabilityGuardService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Detect anomalies
    if (action === "detect") {
      const anomalies = await detectStabilityAnomalies(workspaceId);
      return NextResponse.json({ anomalies });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getAlertSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Run automated detection
    if (action === "autodetect") {
      const alertCount = await runAutomatedDetection(workspaceId);
      return NextResponse.json({ success: true, alertCount });
    }

    // Default: List alerts
    const status = searchParams.get("status") as AlertStatus | null;
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const limit = parseInt(searchParams.get("limit") || "100");

    const alerts = await listStabilityAlerts(workspaceId, {
      status: status || undefined,
      severity: severity || undefined,
      limit,
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Stability guard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const success = await updateAlertStatus(
      body.alertId,
      body.newStatus,
      body.resolutionNotes
    );

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("Update alert status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
