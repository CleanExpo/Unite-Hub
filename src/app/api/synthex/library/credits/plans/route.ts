/**
 * Synthex Plans API
 * GET - List available plans
 * POST - Upgrade to a plan
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listPlans,
  getPlan,
  upgradePlan,
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
    const planType = searchParams.get("planType");

    // Get specific plan
    if (planType) {
      const plan = await getPlan(planType);
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        plan,
      });
    }

    // List all plans
    const plans = await listPlans();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("[Plans API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get plans" },
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
    const { tenantId, planType, stripeSubscriptionId } = body;

    if (!tenantId || !planType) {
      return NextResponse.json(
        { error: "tenantId and planType are required" },
        { status: 400 }
      );
    }

    const account = await upgradePlan(tenantId, planType, stripeSubscriptionId);

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("[Plans API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upgrade plan" },
      { status: 500 }
    );
  }
}
