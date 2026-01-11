import { NextRequest, NextResponse } from "next/server";
import {
  calculatePreemptiveRisk,
  listPreemptiveRisk,
  getPreemptiveRiskSummary,
  type RiskDomain,
  type RiskLevel,
} from "@/lib/founder/preemptiveRiskGridService";

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
        const riskDomain = searchParams.get("riskDomain") as RiskDomain | null;
        const riskId = await calculatePreemptiveRisk({
          tenantId: workspaceId,
          riskDomain: riskDomain || 'operational',
        });
        return NextResponse.json({ riskId });
      }

      case "summary": {
        const days = parseInt(searchParams.get("days") || "7");
        const summary = await getPreemptiveRiskSummary(workspaceId, days);
        return NextResponse.json({ summary });
      }

      case "list":
      default: {
        const riskDomain = searchParams.get("riskDomain") as RiskDomain | null;
        const riskLevel = searchParams.get("riskLevel") as RiskLevel | null;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "100");

        const risks = await listPreemptiveRisk(workspaceId, {
          riskDomain: riskDomain || undefined,
          riskLevel: riskLevel || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit,
        });

        return NextResponse.json({ risks });
      }
    }
  } catch (error: any) {
    console.error("Preemptive risk API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
