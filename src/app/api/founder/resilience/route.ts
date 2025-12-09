import { NextRequest, NextResponse } from "next/server";
import {
  calculateResilienceScore,
  listResilienceMetrics,
  getResilienceSummary,
  type ResilienceLevel,
} from "@/lib/founder/resilienceService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current resilience
    if (action === "calculate") {
      const resilience = await calculateResilienceScore(workspaceId);
      return NextResponse.json({ resilience });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getResilienceSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List metrics
    const level = searchParams.get("level") as ResilienceLevel | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const metrics = await listResilienceMetrics(workspaceId, {
      level: level || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("Resilience API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
