/**
 * Founder Financials API — GET /api/founder/financials
 * Phase 41: P&L Dashboard
 *
 * Returns financial summary + health score for the founder dashboard.
 * Data sources (in priority order):
 *   1. founder_financial_transactions / founder_financial_accounts (Xero-synced)
 *   2. Stripe MRR as income proxy (if Xero not yet connected)
 *
 * FOUNDER-ONLY — uses supabaseAdmin to bypass RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchStripeMrr, getStripeKeyForBusiness } from "@/lib/stripe-mrr";

// ============================================================================
// CONSTANTS
// ============================================================================

const BUSINESSES = [
  "disaster-recovery",
  "restore-assist",
  "ato",
  "nrpg",
  "unite-group",
  "carsi",
] as const;

// ============================================================================
// TYPES
// ============================================================================

interface BusinessFinancials {
  income: number;
  expenses: number;
  netFlow: number;
}

interface HealthFactor {
  name: string;
  score: number;
  weight: number;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  byCategory: Record<string, number>;
  period: string;
}

interface HealthScore {
  score: number;
  factors: HealthFactor[];
}

interface FinancialsResponse {
  summary: FinancialSummary;
  healthScore: HealthScore;
  byBusiness: Record<string, BusinessFinancials>;
  dataSource: "xero" | "stripe" | "empty";
  notice?: string;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function getPeriodDates(period: "quarterly" | "annual"): { startDate: Date; endDate: Date; label: string } {
  const endDate = new Date();
  const startDate = new Date();

  if (period === "quarterly") {
    startDate.setMonth(startDate.getMonth() - 3);
    return { startDate, endDate, label: "Last 3 Months" };
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
    return { startDate, endDate, label: "Last 12 Months" };
  }
}

// ============================================================================
// HEALTH SCORE CALCULATION
// ============================================================================

function calculateHealthScore(
  totalIncome: number,
  totalExpenses: number,
  netCashFlow: number,
  transactionCount: number
): HealthScore {
  // Factor 1: Cash flow ratio (40% weight)
  // Score 100 = income 2x expenses; 0 = expenses exceed income
  const cashFlowRatio = totalIncome > 0 ? Math.min(netCashFlow / totalIncome, 1) : 0;
  const cashFlowScore = Math.max(0, Math.round(cashFlowRatio * 100));

  // Factor 2: Transaction volume (20% weight)
  // 50+ transactions = 100; 0 = 0
  const txnScore = Math.min(100, Math.round((transactionCount / 50) * 100));

  // Factor 3: Income trend (20% weight)
  // Positive income = 75; no income = 0; deficit = proportional
  const incomeTrendScore = totalIncome > 0 ? (netCashFlow >= 0 ? 75 : Math.max(0, Math.round(75 + (netCashFlow / totalIncome) * 75))) : 0;

  // Factor 4: Expense ratio (20% weight)
  // Expenses < 60% of income = 100; expenses > income = 0
  const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 1;
  const expenseScore = Math.max(0, Math.round((1 - expenseRatio) * 100));

  const factors: HealthFactor[] = [
    { name: "Cash Flow Ratio", score: cashFlowScore, weight: 40 },
    { name: "Transaction Volume", score: txnScore, weight: 20 },
    { name: "Income Trend", score: incomeTrendScore, weight: 20 },
    { name: "Expense Ratio", score: expenseScore, weight: 20 },
  ];

  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0)
  );

  return { score: overallScore, factors };
}

// ============================================================================
// XERO DATA FETCH
// ============================================================================

async function fetchXeroData(
  startDate: Date,
  endDate: Date
): Promise<{
  found: boolean;
  summary: Omit<FinancialSummary, "period">;
  byBusiness: Record<string, BusinessFinancials>;
} | null> {
  try {
    // Fetch transactions within the period from founder_financial_transactions
    // joined through founder_financial_accounts for account type
    const { data: txns, error: txnError } = await supabaseAdmin
      .from("founder_financial_transactions")
      .select(`
        id,
        amount,
        transaction_type,
        description,
        date,
        account_id,
        founder_financial_accounts!inner(
          account_type,
          xero_org_id,
          account_name
        )
      `)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0]);

    if (txnError) {
      // Table may not exist yet — treat as no data
      console.warn("[financials] founder_financial_transactions not available:", txnError.message);
      return null;
    }

    if (!txns || txns.length === 0) {
      return { found: false, summary: { totalIncome: 0, totalExpenses: 0, netCashFlow: 0, transactionCount: 0, byCategory: {} }, byBusiness: {} };
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const byCategory: Record<string, number> = {};
    const byBusiness: Record<string, BusinessFinancials> = {};

    for (const txn of txns as any[]) {
      const amount = Math.abs(Number(txn.amount) || 0);
      const accountType: string = txn.founder_financial_accounts?.account_type || "expense";
      const orgId: string = txn.founder_financial_accounts?.xero_org_id || "unknown";
      const description: string = txn.description || "Uncategorised";

      const isCredit = txn.transaction_type === "credit" || accountType === "revenue";

      if (isCredit) {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
        // Track expense categories
        byCategory[description] = (byCategory[description] || 0) + amount;
      }

      // Per-business breakdown using org ID as proxy (may map to business later)
      if (!byBusiness[orgId]) {
        byBusiness[orgId] = { income: 0, expenses: 0, netFlow: 0 };
      }
      if (isCredit) {
        byBusiness[orgId].income += amount;
      } else {
        byBusiness[orgId].expenses += amount;
      }
      byBusiness[orgId].netFlow = byBusiness[orgId].income - byBusiness[orgId].expenses;
    }

    return {
      found: true,
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        transactionCount: txns.length,
        byCategory,
      },
      byBusiness,
    };
  } catch (err) {
    console.error("[financials] Error fetching Xero data:", err);
    return null;
  }
}

// ============================================================================
// STRIPE FALLBACK
// ============================================================================

async function fetchStripeAggregate(
  months: number
): Promise<{
  totalIncome: number;
  byBusiness: Record<string, BusinessFinancials>;
}> {
  let totalIncome = 0;
  const byBusiness: Record<string, BusinessFinancials> = {};

  // Fetch MRR for each business in parallel
  const results = await Promise.allSettled(
    BUSINESSES.map(async (businessId) => {
      const stripeKey = getStripeKeyForBusiness(businessId);
      if (!stripeKey) return null;

      const mrrResult = await fetchStripeMrr(stripeKey);
      return mrrResult ? { businessId, mrr: mrrResult.mrr } : null;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { businessId, mrr } = result.value;
      // MRR is monthly — multiply by period months for total income proxy
      const periodRevenue = mrr * months;
      totalIncome += periodRevenue;

      byBusiness[businessId] = {
        income: periodRevenue,
        expenses: 0, // No expense data without Xero
        netFlow: periodRevenue,
      };
    }
  }

  return { totalIncome, byBusiness };
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "quarterly";
    const period = periodParam === "annual" ? "annual" : "quarterly";

    const { startDate, endDate, label } = getPeriodDates(period);
    const periodMonths = period === "quarterly" ? 3 : 12;

    // ---- Attempt Xero data first ----
    const xeroResult = await fetchXeroData(startDate, endDate);

    if (xeroResult && xeroResult.found) {
      const { summary, byBusiness } = xeroResult;
      const healthScore = calculateHealthScore(
        summary.totalIncome,
        summary.totalExpenses,
        summary.netCashFlow,
        summary.transactionCount
      );

      const response: FinancialsResponse = {
        summary: { ...summary, period: label },
        healthScore,
        byBusiness,
        dataSource: "xero",
      };

      return NextResponse.json(response);
    }

    // ---- Check if Xero tables exist but are empty ----
    if (xeroResult && !xeroResult.found) {
      // Tables exist — Xero connected but no data for period yet
      // Try Stripe as income proxy
      const stripeData = await fetchStripeAggregate(periodMonths);

      if (stripeData.totalIncome > 0) {
        const healthScore = calculateHealthScore(
          stripeData.totalIncome,
          0,
          stripeData.totalIncome,
          0
        );

        const response: FinancialsResponse = {
          summary: {
            totalIncome: stripeData.totalIncome,
            totalExpenses: 0,
            netCashFlow: stripeData.totalIncome,
            transactionCount: 0,
            byCategory: {},
            period: label,
          },
          healthScore,
          byBusiness: stripeData.byBusiness,
          dataSource: "stripe",
          notice: "Xero connected but no transactions for this period. Income estimated from Stripe MRR.",
        };

        return NextResponse.json(response);
      }

      // No Stripe data either — return zeros
      const emptyResponse: FinancialsResponse = {
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          netCashFlow: 0,
          transactionCount: 0,
          byCategory: {},
          period: label,
        },
        healthScore: calculateHealthScore(0, 0, 0, 0),
        byBusiness: {},
        dataSource: "empty",
        notice: "Xero not yet connected. Sync Xero to populate financial data.",
      };

      return NextResponse.json(emptyResponse);
    }

    // ---- Xero tables don't exist — try Stripe only ----
    const stripeData = await fetchStripeAggregate(periodMonths);

    if (stripeData.totalIncome > 0) {
      const healthScore = calculateHealthScore(
        stripeData.totalIncome,
        0,
        stripeData.totalIncome,
        0
      );

      const response: FinancialsResponse = {
        summary: {
          totalIncome: stripeData.totalIncome,
          totalExpenses: 0,
          netCashFlow: stripeData.totalIncome,
          transactionCount: 0,
          byCategory: {},
          period: label,
        },
        healthScore,
        byBusiness: stripeData.byBusiness,
        dataSource: "stripe",
        notice: "Income estimated from Stripe MRR. Connect Xero for full P&L data.",
      };

      return NextResponse.json(response);
    }

    // ---- Nothing available — return zeros gracefully ----
    const emptyResponse: FinancialsResponse = {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        transactionCount: 0,
        byCategory: {},
        period: label,
      },
      healthScore: calculateHealthScore(0, 0, 0, 0),
      byBusiness: {},
      dataSource: "empty",
      notice: "Xero not yet connected. Sync Xero to populate financial data.",
    };

    return NextResponse.json(emptyResponse);
  } catch (err) {
    console.error("[financials] Unhandled error in GET /api/founder/financials:", err);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
