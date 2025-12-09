import { NextRequest, NextResponse } from "next/server";
import {
  generateTrendForecast,
  recordTrendForecast,
  listTrendForecasts,
  getForecastSummary,
  type ForecastWindow,
} from "@/lib/founder/trendForecasterService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const action = searchParams.get("action");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    // Generate forecast
    if (action === "generate") {
      const window = (searchParams.get("window") || "7d") as ForecastWindow;
      const forecast = await generateTrendForecast(workspaceId, window);
      return NextResponse.json({ forecast });
    }

    // Get summary
    if (action === "summary") {
      const summary = await getForecastSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Default: List forecasts
    const window = searchParams.get("window") as ForecastWindow | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const forecasts = await listTrendForecasts(workspaceId, {
      window: window || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
    });

    return NextResponse.json({ forecasts });
  } catch (error: any) {
    console.error("Trend forecast API error:", error);
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

    const forecastId = await recordTrendForecast({
      tenantId: workspaceId,
      window: body.window || "7d",
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, forecastId });
  } catch (error: any) {
    console.error("Record trend forecast error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
