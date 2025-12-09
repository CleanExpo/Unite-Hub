/**
 * Pattern Detection API
 * POST /api/ml/pattern-detection/detect
 * Detects behavioral patterns in alert data using K-means clustering
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  PatternDetectionEngine,
  AlertDataPoint,
  DetectedPattern,
} from "@/lib/ml/pattern-detection";

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
    const { dataPoints, k } = body;

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return NextResponse.json(
        { error: "dataPoints array is required" },
        { status: 400 }
      );
    }

    const engine = new PatternDetectionEngine();
    if (k) {
engine.setK(k);
}

    const patterns = engine.detectPatterns(dataPoints, k);

    // Store patterns in database
    const supabase = await getSupabaseServer();
    for (const pattern of patterns) {
      await supabase.from("convex_alert_patterns").insert({
        workspace_id: workspaceId,
        pattern_name: pattern.name,
        centroid: pattern.centroid,
        confidence: pattern.confidence,
        occurrence_count: pattern.occurrenceCount,
        average_severity: pattern.averageSeverity,
        trend: pattern.trend,
        description: pattern.description,
        data_points: pattern.dataPoints,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        patterns: patterns.map((p) => ({
          id: p.id,
          name: p.name,
          centroid: p.centroid,
          confidence: p.confidence,
          occurrenceCount: p.occurrenceCount,
          averageSeverity: p.averageSeverity,
          trend: p.trend,
          description: p.description,
        })),
        summary: {
          totalPatterns: patterns.length,
          avgConfidence:
            patterns.length > 0
              ? (
                  patterns.reduce((sum, p) => sum + p.confidence, 0) /
                  patterns.length
                ).toFixed(3)
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Pattern detection error:", error);
    return NextResponse.json(
      { error: "Pattern detection failed", details: error.message },
      { status: 500 }
    );
  }
}
