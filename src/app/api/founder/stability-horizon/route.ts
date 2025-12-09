import { NextRequest, NextResponse } from "next/server";
import {
  calculateStabilityHorizon,
  listStabilityHorizon,
  getStabilityHorizonSummary,
  type HorizonWindow,
  type PredictedRisk,
} from "@/lib/founder/stabilityHorizonService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action") || "list";

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "calculate": {
        const horizonWindow = searchParams.get("horizonWindow") as HorizonWindow | null;
        const horizonId = await calculateStabilityHorizon({
          tenantId: workspaceId,
          horizonWindow: horizonWindow || '7d',
        });
        return NextResponse.json({ horizonId });
      }

      case "summary": {
        const days = parseInt(searchParams.get("days") || "7");
        const summary = await getStabilityHorizonSummary(workspaceId, days);
        return NextResponse.json({ summary });
      }

      case "list":
      default: {
        const horizonWindow = searchParams.get("horizonWindow") as HorizonWindow | null;
        const riskLevel = searchParams.get("riskLevel") as PredictedRisk | null;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "100");

        const horizons = await listStabilityHorizon(workspaceId, {
          horizonWindow: horizonWindow || undefined,
          riskLevel: riskLevel || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit,
        });

        return NextResponse.json({ horizons });
      }
    }
  } catch (error: any) {
    console.error("Stability horizon API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
