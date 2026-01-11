/**
 * @fileoverview F10 Energy Mapping Engine API
 * GET: List energy readings, get summary, detect patterns, get optimal windows
 * POST: Record energy reading
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordEnergyReading,
  listEnergyReadings,
  getEnergySummary,
  detectEnergyPatterns,
  getOptimalWorkWindows,
} from "@/lib/founder/energyMappingService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Summary action
    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getEnergySummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Detect patterns action
    if (action === "detect-patterns") {
      const minConfidence = parseFloat(searchParams.get("minConfidence") || "70");
      const patterns = await detectEnergyPatterns(workspaceId, minConfidence);
      return NextResponse.json({ patterns });
    }

    // Optimal windows action
    if (action === "optimal-windows") {
      const windows = await getOptimalWorkWindows(workspaceId);
      return NextResponse.json({ windows });
    }

    // Default: List readings
    const category = searchParams.get("category") as any;
    const measurementType = searchParams.get("measurementType") as any;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "200");

    const readings = await listEnergyReadings(workspaceId, {
      category,
      measurementType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ readings });
  } catch (error: any) {
    console.error("[energy-mapping] GET error:", error);
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

    const body = await req.json();

    const readingId = await recordEnergyReading({
      tenantId: workspaceId,
      energyLevel: body.energyLevel,
      measurementType: body.measurementType,
      category: body.category,
      activityContext: body.activityContext,
      contributingFactors: body.contributingFactors,
      notes: body.notes,
      metadata: body.metadata,
    });

    return NextResponse.json({ readingId });
  } catch (error: any) {
    console.error("[energy-mapping] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
