/**
 * Founder Financials Sync API — POST /api/founder/financials/sync
 * Phase 41: P&L Dashboard
 *
 * Triggers a Xero sync for all connected organisations stored in
 * founder_financial_accounts. Returns per-org sync results.
 *
 * FOUNDER-ONLY — uses supabaseAdmin to bypass RLS.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncToUnifiedLedger } from "@/lib/integrations/xeroIntegrationService";

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(): Promise<NextResponse> {
  try {
    // Fetch all unique Xero org IDs from founder_financial_accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("founder_financial_accounts")
      .select("xero_org_id")
      .not("xero_org_id", "is", null);

    if (accountsError) {
      console.error("[financials/sync] Error fetching accounts:", accountsError.message);

      // Table may not exist yet — treat as no Xero connected
      if (accountsError.message?.includes("relation") || accountsError.code === "42P01") {
        return NextResponse.json({
          synced: false,
          reason: "No Xero tenants connected. Connect Xero via Settings to enable sync.",
        });
      }

      return NextResponse.json(
        { error: `Failed to fetch Xero accounts: ${accountsError.message}` },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        synced: false,
        reason: "No Xero tenants connected. Connect Xero via Settings to enable sync.",
      });
    }

    // Deduplicate org IDs
    const orgIds = [...new Set((accounts as any[]).map((a) => a.xero_org_id as string).filter(Boolean))];

    if (orgIds.length === 0) {
      return NextResponse.json({
        synced: false,
        reason: "No Xero tenants connected. Connect Xero via Settings to enable sync.",
      });
    }

    // Sync each org in parallel
    const syncResults = await Promise.allSettled(
      orgIds.map(async (orgId) => {
        const result = await syncToUnifiedLedger(orgId);
        return { orgId, ...result };
      })
    );

    const results = syncResults.map((r) => {
      if (r.status === "fulfilled") {
        return r.value;
      } else {
        return {
          orgId: "unknown",
          accountsSynced: 0,
          transactionsSynced: 0,
          errors: [r.reason?.message || "Unknown error"],
        };
      }
    });

    const totalAccounts = results.reduce((sum, r) => sum + (r.accountsSynced || 0), 0);
    const totalTransactions = results.reduce((sum, r) => sum + (r.transactionsSynced || 0), 0);
    const allErrors = results.flatMap((r) => r.errors || []);

    return NextResponse.json({
      synced: true,
      orgCount: orgIds.length,
      totalAccountsSynced: totalAccounts,
      totalTransactionsSynced: totalTransactions,
      errors: allErrors.length > 0 ? allErrors : undefined,
      results,
    });
  } catch (err) {
    console.error("[financials/sync] Unhandled error:", err);
    return NextResponse.json(
      { error: "Sync failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
