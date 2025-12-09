/**
 * Anomaly Detection API
 * POST /api/ml/anomaly-detection/detect
 * Detects anomalies in alert data using statistical and contextual methods
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  AnomalyDetectionEngine,
  AnomalyDataPoint,
  DetectedAnomaly,
} from "@/lib/ml/anomaly-detection";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string;

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

    workspaceId = req.nextUrl.searchParams.get("workspaceId") || "";
    if (!workspaceId) {
return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
}

    const body = await req.json();
    const {
      dataPoints,
      minSeverity = "low",
      minConfidence = 0.3,
    } = body;

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return NextResponse.json(
        { error: "dataPoints array is required" },
        { status: 400 }
      );
    }

    const engine = new AnomalyDetectionEngine();
    let anomalies = engine.detectAnomalies(dataPoints);

    // Apply filters
    anomalies = engine.filterBySeverity(
      anomalies,
      minSeverity as "low" | "medium" | "high" | "critical"
    );
    anomalies = engine.filterByConfidence(anomalies, minConfidence);

    // Store anomalies in database
    const supabase = await getSupabaseServer();
    for (const anomaly of anomalies) {
      await supabase.from("alert_anomalies").insert({
        workspace_id: workspaceId,
        timestamp: new Date(anomaly.timestamp).toISOString(),
        value: anomaly.value,
        type: anomaly.type,
        statistical_score: anomaly.statisticalScore,
        contextual_score: anomaly.contextualScore,
        composite_score: anomaly.compositeScore,
        confidence: anomaly.confidence,
        anomaly_type: anomaly.anomalyType,
        severity: anomaly.severity,
        explanation: anomaly.explanation,
        created_at: new Date().toISOString(),
      });
    }

    // Group by type for summary
    const grouped = engine.groupByType(anomalies);
    const typeBreakdown: Record<string, number> = {};
    Object.entries(grouped).forEach(([type, anoms]) => {
      typeBreakdown[type] = anoms.length;
    });

    // Calculate metrics
    const severity_breakdown: Record<string, number> = {
      low: anomalies.filter((a) => a.severity === "low").length,
      medium: anomalies.filter((a) => a.severity === "medium").length,
      high: anomalies.filter((a) => a.severity === "high").length,
      critical: anomalies.filter((a) => a.severity === "critical").length,
    };

    const anomaly_density = engine.calculateAnomalyDensity(
      dataPoints,
      anomalies
    );

    return NextResponse.json(
      {
        success: true,
        anomalies: anomalies.map((a) => ({
          id: a.id,
          timestamp: a.timestamp,
          value: a.value,
          type: a.type,
          compositeScore: a.compositeScore,
          confidence: a.confidence,
          anomalyType: a.anomalyType,
          severity: a.severity,
          explanation: a.explanation,
        })),
        summary: {
          totalAnomalies: anomalies.length,
          avgConfidence:
            anomalies.length > 0
              ? (
                  anomalies.reduce((sum, a) => sum + a.confidence, 0) /
                  anomalies.length
                ).toFixed(3)
              : 0,
          anomalyDensity: anomaly_density.toFixed(3),
          typeBreakdown,
          severityBreakdown: severity_breakdown,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Anomaly detection error:", error);
    return NextResponse.json(
      { error: "Anomaly detection failed", details: error.message },
      { status: 500 }
    );
  }
}
