/**
 * Founder Ledger Service
 * Phase 41: Founder Financial Command Center
 *
 * Unified ledger operations, categorization, anomaly detection
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  transactionType: "credit" | "debit";
  source: string;
  category: string;
  vendor?: string;
  isReconciled: boolean;
  isDuplicate: boolean;
  isAnomaly: boolean;
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  byCategory: Record<string, number>;
  byVendor: Record<string, number>;
  period: string;
}

export interface Anomaly {
  transactionId: string;
  type: string;
  severity: string;
  description: string;
  suggestedAction: string;
}

/**
 * Unify transactions from all sources
 */
export async function unifyTransactionSources(): Promise<{
  total: number;
  bySource: Record<string, number>;
}> {
  const supabase = await getSupabaseServer();

  const { data: transactions } = await supabase
    .from("founder_financial_transactions")
    .select("source");

  const bySource: Record<string, number> = {};
  for (const txn of transactions || []) {
    bySource[txn.source] = (bySource[txn.source] || 0) + 1;
  }

  return {
    total: transactions?.length || 0,
    bySource,
  };
}

/**
 * Auto-categorize transactions
 */
export async function categorizeTransactions(): Promise<{
  categorized: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  const errors: string[] = [];
  let categorized = 0;

  // Get uncategorized transactions
  const { data: transactions } = await supabase
    .from("founder_financial_transactions")
    .select("*")
    .is("category", null);

  for (const txn of transactions || []) {
    const category = inferCategory(txn.description, txn.vendor);

    if (category) {
      const { error } = await supabase
        .from("founder_financial_transactions")
        .update({ category })
        .eq("id", txn.id);

      if (error) {
        errors.push(`Transaction ${txn.id}: ${error.message}`);
      } else {
        categorized++;
      }
    }
  }

  return { categorized, errors };
}

/**
 * Detect duplicate transactions
 */
export async function detectDuplicates(): Promise<{
  duplicates: string[];
  marked: number;
}> {
  const supabase = await getSupabaseServer();
  const duplicates: string[] = [];

  // Get all transactions
  const { data: transactions } = await supabase
    .from("founder_financial_transactions")
    .select("*")
    .order("date", { ascending: true });

  if (!transactions) return { duplicates: [], marked: 0 };

  // Group by key attributes
  const groups = new Map<string, string[]>();

  for (const txn of transactions) {
    const key = `${txn.date}-${txn.amount}-${txn.description.substring(0, 20)}`;
    const existing = groups.get(key) || [];
    existing.push(txn.id);
    groups.set(key, existing);
  }

  // Mark duplicates
  let marked = 0;
  for (const [, ids] of groups) {
    if (ids.length > 1) {
      // Mark all but first as duplicate
      for (let i = 1; i < ids.length; i++) {
        duplicates.push(ids[i]);

        await supabase
          .from("founder_financial_transactions")
          .update({ is_duplicate: true })
          .eq("id", ids[i]);

        // Create anomaly record
        await supabase.from("founder_financial_anomalies").insert({
          transaction_id: ids[i],
          anomaly_type: "duplicate",
          severity: "medium",
          description: "Potential duplicate transaction detected",
          suggested_action: "Review and delete if confirmed duplicate",
        });

        marked++;
      }
    }
  }

  return { duplicates, marked };
}

/**
 * Detect anomalies in transactions
 */
export async function detectAnomalies(): Promise<Anomaly[]> {
  const supabase = await getSupabaseServer();
  const anomalies: Anomaly[] = [];

  // Get transactions from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: transactions } = await supabase
    .from("founder_financial_transactions")
    .select("*")
    .gte("date", ninetyDaysAgo.toISOString().split("T")[0]);

  if (!transactions) return [];

  // Calculate averages by category
  const categoryAvg = new Map<string, { sum: number; count: number }>();

  for (const txn of transactions) {
    if (!txn.category) continue;
    const existing = categoryAvg.get(txn.category) || { sum: 0, count: 0 };
    existing.sum += txn.amount;
    existing.count += 1;
    categoryAvg.set(txn.category, existing);
  }

  // Detect unusual amounts (>3x average)
  for (const txn of transactions) {
    if (!txn.category) continue;
    const avg = categoryAvg.get(txn.category);
    if (!avg) continue;

    const categoryMean = avg.sum / avg.count;

    if (txn.amount > categoryMean * 3 && txn.amount > 100) {
      const anomaly: Anomaly = {
        transactionId: txn.id,
        type: "unusual_amount",
        severity: txn.amount > categoryMean * 5 ? "high" : "medium",
        description: `Amount $${txn.amount.toFixed(2)} is ${(txn.amount / categoryMean).toFixed(1)}x higher than average for ${txn.category}`,
        suggestedAction: "Review for accuracy or unexpected charge",
      };

      anomalies.push(anomaly);

      // Save to database
      await supabase.from("founder_financial_anomalies").insert({
        transaction_id: txn.id,
        anomaly_type: "unusual_amount",
        severity: anomaly.severity,
        description: anomaly.description,
        suggested_action: anomaly.suggestedAction,
      });

      // Mark transaction
      await supabase
        .from("founder_financial_transactions")
        .update({ is_anomaly: true, anomaly_reason: anomaly.description })
        .eq("id", txn.id);
    }
  }

  return anomalies;
}

/**
 * Generate quarterly summary
 */
export async function generateQuarterlySummary(
  year: number,
  quarter: number
): Promise<LedgerSummary> {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);

  return generateSummary(startDate, endDate, `Q${quarter} ${year}`);
}

/**
 * Generate annual summary
 */
export async function generateAnnualSummary(year: number): Promise<LedgerSummary> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return generateSummary(startDate, endDate, `FY ${year}`);
}

/**
 * Generate summary for date range
 */
async function generateSummary(
  startDate: Date,
  endDate: Date,
  period: string
): Promise<LedgerSummary> {
  const supabase = await getSupabaseServer();

  const { data: transactions } = await supabase
    .from("founder_financial_transactions")
    .select("*")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .eq("is_duplicate", false);

  let totalIncome = 0;
  let totalExpenses = 0;
  const byCategory: Record<string, number> = {};
  const byVendor: Record<string, number> = {};

  for (const txn of transactions || []) {
    if (txn.transaction_type === "credit") {
      totalIncome += txn.amount;
    } else {
      totalExpenses += txn.amount;
    }

    if (txn.category) {
      byCategory[txn.category] = (byCategory[txn.category] || 0) + txn.amount;
    }

    if (txn.vendor) {
      byVendor[txn.vendor] = (byVendor[txn.vendor] || 0) + txn.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: transactions?.length || 0,
    byCategory,
    byVendor,
    period,
  };
}

/**
 * Infer category from description
 */
function inferCategory(description: string, vendor?: string): string | null {
  const desc = description.toLowerCase();
  const vend = vendor?.toLowerCase() || "";

  // Software & SaaS
  if (
    desc.includes("subscription") ||
    desc.includes("saas") ||
    vend.includes("adobe") ||
    vend.includes("microsoft") ||
    vend.includes("google")
  ) {
    return "Software & SaaS";
  }

  // Cloud Infrastructure
  if (
    desc.includes("aws") ||
    desc.includes("azure") ||
    vend.includes("amazon web services") ||
    vend.includes("digitalocean") ||
    vend.includes("vercel")
  ) {
    return "Cloud Infrastructure";
  }

  // Marketing & Advertising
  if (
    desc.includes("ads") ||
    desc.includes("marketing") ||
    desc.includes("google ads") ||
    desc.includes("facebook")
  ) {
    return "Marketing & Advertising";
  }

  // Professional Services
  if (
    desc.includes("consulting") ||
    desc.includes("legal") ||
    desc.includes("accounting")
  ) {
    return "Professional Services";
  }

  // Office & Admin
  if (
    desc.includes("office") ||
    desc.includes("supplies") ||
    desc.includes("equipment")
  ) {
    return "Office & Admin";
  }

  // Communication
  if (
    vend.includes("slack") ||
    vend.includes("zoom") ||
    desc.includes("phone") ||
    desc.includes("internet")
  ) {
    return "Communication";
  }

  return null;
}

export default {
  unifyTransactionSources,
  categorizeTransactions,
  detectDuplicates,
  detectAnomalies,
  generateQuarterlySummary,
  generateAnnualSummary,
};
