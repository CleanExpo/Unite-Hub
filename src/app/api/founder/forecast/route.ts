import { NextRequest, NextResponse } from "next/server";
import {
  listForecasts,
  getLatestForecasts,
  recordForecast,
  getForecastAccuracy,
} from "@/lib/founder/governanceForecastService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "accuracy") {
      const accuracy = await getForecastAccuracy(workspaceId);
      return NextResponse.json({ accuracy });
    }

    if (action === "latest") {
      const forecastType = searchParams.get("forecastType") as any;
      const forecasts = await getLatestForecasts(workspaceId, forecastType);
      return NextResponse.json({ forecasts });
    }

    const includeExpired = searchParams.get("includeExpired") === "true";
    const items = await listForecasts(workspaceId, includeExpired);

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[forecast] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      forecastType,
      forecastHorizon,
      forecastMethod,
      forecastValue,
      confidence,
      lowerBound,
      upperBound,
      metadata,
    } = body;

    if (!forecastType || !forecastHorizon || !forecastMethod || forecastValue === undefined) {
      return NextResponse.json(
        { error: "forecastType, forecastHorizon, forecastMethod, and forecastValue required" },
        { status: 400 }
      );
    }

    const forecastId = await recordForecast({
      tenantId: workspaceId,
      forecastType,
      forecastHorizon,
      forecastMethod,
      forecastValue,
      confidence,
      lowerBound,
      upperBound,
      metadata,
    });

    return NextResponse.json({ forecastId });
  } catch (error: any) {
    console.error("[forecast] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
