/**
 * Synthex Credit Transactions API
 * GET - Get transaction history
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransactionHistory } from "@/lib/synthex/creditService";

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
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const transactions = await getTransactionHistory(tenantId, {
      type: type || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("[Credits Transactions API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get transactions" },
      { status: 500 }
    );
  }
}
