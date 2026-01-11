import { NextRequest, NextResponse } from "next/server";
import {
  calculatePerformanceEnvelope,
  listPerformanceEnvelope,
  getPerformanceEnvelopeSummary,
  type EnvelopeState,
} from "@/lib/founder/performanceEnvelopeService";

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
        const envelopeId = await calculatePerformanceEnvelope(workspaceId);
        return NextResponse.json({ envelopeId });
      }

      case "summary": {
        const days = parseInt(searchParams.get("days") || "7");
        const summary = await getPerformanceEnvelopeSummary(workspaceId, days);
        return NextResponse.json({ summary });
      }

      case "list":
      default: {
        const envelopeState = searchParams.get("envelopeState") as EnvelopeState | null;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "100");

        const envelopes = await listPerformanceEnvelope(workspaceId, {
          envelopeState: envelopeState || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit,
        });

        return NextResponse.json({ envelopes });
      }
    }
  } catch (error: any) {
    console.error("Performance envelope API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
