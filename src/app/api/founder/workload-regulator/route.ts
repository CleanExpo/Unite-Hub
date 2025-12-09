import { NextRequest, NextResponse } from "next/server";
import {
  calculateWorkloadRecommendation,
  listWorkloadRecommendations,
  getWorkloadSummary,
  type WorkloadRecommendation,
} from "@/lib/founder/workloadRegulatorService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current recommendation
    if (action === "calculate") {
      const recommendation = await calculateWorkloadRecommendation(workspaceId);
      return NextResponse.json({ recommendation });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getWorkloadSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List recommendations
    const recommendation = searchParams.get("recommendation") as WorkloadRecommendation | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const recommendations = await listWorkloadRecommendations(workspaceId, {
      recommendation: recommendation || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("Workload regulator API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
