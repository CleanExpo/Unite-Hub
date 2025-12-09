/**
 * Synthex Finance Accounts API
 *
 * Phase: D43 - Capital & Runway Dashboard
 *
 * GET - List accounts
 * POST - Create account
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createAccount,
  listAccounts,
  type FINAccountType,
} from "@/lib/synthex/financeRunwayService";

/**
 * GET /api/synthex/finance/accounts
 * List financial accounts
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const accountType = searchParams.get("accountType") as FINAccountType | null;
    const isActive = searchParams.get("isActive");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const accounts = await listAccounts(tenantId, {
      businessId: businessId || undefined,
      accountType: accountType || undefined,
      isActive: isActive ? isActive === "true" : undefined,
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/finance/accounts
 * Create a financial account
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, businessId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.account_name) {
      return NextResponse.json({ error: "account_name is required" }, { status: 400 });
    }

    const account = await createAccount(tenantId, businessId, {
      account_name: body.account_name,
      account_type: body.account_type,
      currency: body.currency,
      institution_name: body.institution_name,
      account_number_last4: body.account_number_last4,
      opening_balance: body.opening_balance,
      available_credit: body.available_credit,
      is_primary: body.is_primary,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating account:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
