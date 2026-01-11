/**
 * Synthex Credit Limits API
 * GET - Check rate limits and feature limits
 * POST - Check pre-operation limits
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkAllRateLimits,
  checkFeatureLimit,
  preOperationCheck,
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
    const feature = searchParams.get("feature") as "brands" | "templates" | "personas" | "tone_profiles" | "team_members" | null;
    const currentCount = parseInt(searchParams.get("currentCount") || "0", 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const rateLimits = await checkAllRateLimits(tenantId);

    const response: {
      success: boolean;
      rateLimits: typeof rateLimits;
      featureLimit?: Awaited<ReturnType<typeof checkFeatureLimit>>;
    } = {
      success: true,
      rateLimits,
    };

    if (feature) {
      response.featureLimit = await checkFeatureLimit(tenantId, feature, currentCount);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Credits Limits API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check limits" },
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
    const { tenantId, creditsRequired } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const check = await preOperationCheck(tenantId, creditsRequired || 1);

    return NextResponse.json({
      success: true,
      ...check,
    });
  } catch (error) {
    console.error("[Credits Limits API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check limits" },
      { status: 500 }
    );
  }
}
