/**
 * Synthex Finance Account by ID API
 *
 * Phase: D43 - Capital & Runway Dashboard
 *
 * GET - Get account details
 * PUT - Update account
 * DELETE - Delete account
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getAccount,
  updateAccount,
  deleteAccount,
  listEvents,
} from "@/lib/synthex/financeRunwayService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/finance/accounts/[id]
 * Get account with recent transactions
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get("includeTransactions") === "true";

    const account = await getAccount(id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let transactions = null;
    if (includeTransactions) {
      transactions = await listEvents(account.tenant_id, {
        accountId: id,
        limit: 50,
      });
    }

    return NextResponse.json({
      success: true,
      account,
      transactions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/finance/accounts/[id]
 * Update account
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const account = await updateAccount(id, {
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
    console.error("Error updating account:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/finance/accounts/[id]
 * Delete account
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteAccount(id);

    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
