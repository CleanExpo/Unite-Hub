import { NextRequest, NextResponse } from "next/server";
import {
  calculateUnifiedState,
  recordUnifiedState,
  listUnifiedState,
  getUnifiedStateSummary,
  type FounderStateCategory,
} from "@/lib/founder/unifiedStateService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Calculate current state
    if (action === "calculate") {
      const state = await calculateUnifiedState(workspaceId);
      return NextResponse.json({ state });
    }

    // Get summary
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getUnifiedStateSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List snapshots
    const category = searchParams.get("category") as FounderStateCategory | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const states = await listUnifiedState(workspaceId, {
      category: category || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ states });
  } catch (error: any) {
    console.error("Unified state API error:", error);
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

    const stateId = await recordUnifiedState({
      tenantId: workspaceId,
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, stateId });
  } catch (error: any) {
    console.error("Record unified state error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
