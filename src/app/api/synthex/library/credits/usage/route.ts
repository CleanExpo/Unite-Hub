/**
 * Synthex Credit Usage API
 * GET - Get usage history and summary
 * POST - Record usage (internal use)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUsageSummary,
  getUsageHistory,
  recordUsage,
} from "@/lib/synthex/creditService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const feature = searchParams.get("feature");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const includeSummary = searchParams.get("includeSummary") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const history = await getUsageHistory(tenantId, {
      feature: feature || undefined,
      limit,
    });

    const response: {
      success: boolean;
      history: typeof history;
      summary?: Awaited<ReturnType<typeof getUsageSummary>>;
    } = {
      success: true,
      history,
    };

    if (includeSummary) {
      response.summary = await getUsageSummary(
        tenantId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Credits Usage API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get usage" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...usageData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!usageData.operation_type || !usageData.feature) {
      return NextResponse.json(
        { error: "operation_type and feature are required" },
        { status: 400 }
      );
    }

    const record = await recordUsage(tenantId, {
      ...usageData,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("[Credits Usage API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record usage" },
      { status: 500 }
    );
  }
}
