import { NextRequest, NextResponse } from "next/server";
import {
  calculateMomentum,
  listMomentumIndex,
  getMomentumSummary,
  type MomentumDirection,
} from "@/lib/founder/momentumService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current momentum
    if (action === "calculate") {
      const momentum = await calculateMomentum(workspaceId);
      return NextResponse.json({ momentum });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getMomentumSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List momentum index
    const direction = searchParams.get("direction") as MomentumDirection | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const momentumIndex = await listMomentumIndex(workspaceId, {
      direction: direction || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ momentumIndex });
  } catch (error: any) {
    console.error("Momentum API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
