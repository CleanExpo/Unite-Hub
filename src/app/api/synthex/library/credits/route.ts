/**
 * Synthex Credits API
 * GET - Get account info, balance, usage summary
 * POST - Add credits, process purchase
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateAccount,
  getUsageSummary,
  addCredits,
  processPurchase,
  listPackages,
  listPlans,
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
    const includeUsage = searchParams.get("includeUsage") === "true";
    const includePackages = searchParams.get("includePackages") === "true";
    const includePlans = searchParams.get("includePlans") === "true";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const account = await getOrCreateAccount(tenantId);

    const response: {
      success: boolean;
      account: typeof account;
      usage?: Awaited<ReturnType<typeof getUsageSummary>>;
      packages?: Awaited<ReturnType<typeof listPackages>>;
      plans?: Awaited<ReturnType<typeof listPlans>>;
    } = {
      success: true,
      account,
    };

    if (includeUsage) {
      response.usage = await getUsageSummary(tenantId);
    }

    if (includePackages) {
      response.packages = await listPackages();
    }

    if (includePlans) {
      response.plans = await listPlans();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Credits API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get account" },
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
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Process a purchase
    if (action === "purchase") {
      const { packageId, quantity, stripePaymentId } = data;
      if (!packageId || !stripePaymentId) {
        return NextResponse.json(
          { error: "packageId and stripePaymentId are required" },
          { status: 400 }
        );
      }

      const result = await processPurchase(
        tenantId,
        packageId,
        quantity || 1,
        stripePaymentId
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Add credits (admin/bonus)
    if (action === "add") {
      const { credits, transactionType, description } = data;
      if (!credits || !transactionType) {
        return NextResponse.json(
          { error: "credits and transactionType are required" },
          { status: 400 }
        );
      }

      const result = await addCredits(
        tenantId,
        credits,
        transactionType,
        description
      );

      return NextResponse.json({
        success: result.success,
        balance: result.balance,
        error: result.error,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'purchase' or 'add'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Credits API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
