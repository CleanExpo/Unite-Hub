import { NextRequest, NextResponse } from "next/server";
import {
  calculateHealthIndex,
  recordHealthIndex,
  listHealthIndex,
  getHealthSummary,
  type FounderHealthCategory,
} from "@/lib/founder/healthIndexService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current health index
    if (action === "calculate") {
      const health = await calculateHealthIndex(workspaceId);
      return NextResponse.json({ health });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "30");
      const summary = await getHealthSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List snapshots
    const category = searchParams.get("category") as FounderHealthCategory | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const indices = await listHealthIndex(workspaceId, {
      category: category || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ indices });
  } catch (error: any) {
    console.error("Health index API error:", error);
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

    const healthId = await recordHealthIndex({
      tenantId: workspaceId,
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, healthId });
  } catch (error: any) {
    console.error("Record health index error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
