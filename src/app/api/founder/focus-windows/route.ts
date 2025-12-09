import { NextRequest, NextResponse } from "next/server";
import {
  calculateFocusWindows,
  listFocusWindows,
  getFocusWindowsSummary,
  type FocusWindowLabel,
} from "@/lib/founder/focusWindowService";

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
        const predictionHours = parseInt(searchParams.get("predictionHours") || "48");
        const windowIds = await calculateFocusWindows({
          tenantId: workspaceId,
          predictionHours,
        });
        return NextResponse.json({ windowIds });
      }

      case "summary": {
        const hours = parseInt(searchParams.get("hours") || "48");
        const summary = await getFocusWindowsSummary(workspaceId, hours);
        return NextResponse.json({ summary });
      }

      case "list":
      default: {
        const windowLabel = searchParams.get("windowLabel") as FocusWindowLabel | null;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "100");

        const windows = await listFocusWindows(workspaceId, {
          windowLabel: windowLabel || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit,
        });

        return NextResponse.json({ windows });
      }
    }
  } catch (error: any) {
    console.error("Focus windows API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
