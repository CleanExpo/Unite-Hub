/**
 * Xero Integration Service
 * Phase 41: Founder Financial Command Center
 *
 * Multi-org Xero API integration for financial data sync
 */

import { getSupabaseServer } from "@/lib/supabase";
import { withRetry } from "@/lib/visual/visualRetryHandler";

// Types
export interface XeroAccount {
  accountId: string;
  name: string;
  type: string;
  bankAccountNumber?: string;
  currencyCode: string;
  balance?: number;
}

export interface XeroTransaction {
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  accountId: string;
  reference?: string;
  category?: string;
}

export interface XeroInvoice {
  invoiceId: string;
  invoiceNumber: string;
  contact: string;
  date: string;
  dueDate: string;
  total: number;
  amountDue: number;
  status: string;
  type: "ACCREC" | "ACCPAY";
}

export interface XeroOrganization {
  orgId: string;
  name: string;
  shortCode: string;
  baseCurrency: string;
}

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
}

/**
 * Get Xero API headers
 */
function getXeroHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Connect to a Xero organization
 */
export async function connectToOrganization(orgId: string): Promise<XeroOrganization | null> {
  const result = await withRetry(async () => {
    const accessToken = process.env.XERO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Xero access token not configured");
    }

    const response = await rateLimitedFetch(
      `https://api.xero.com/api.xro/2.0/Organisation`,
      {
        headers: {
          ...getXeroHeaders(accessToken),
          "Xero-Tenant-Id": orgId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status}`);
    }

    const data = await response.json();
    const org = data.Organisations?.[0];

    if (!org) {
      throw new Error("Organization not found");
    }

    return {
      orgId: org.OrganisationID,
      name: org.Name,
      shortCode: org.ShortCode,
      baseCurrency: org.BaseCurrency,
    };
  }, { maxRetries: 2 });

  return result.success ? result.data : null;
}

/**
 * Fetch accounts from Xero
 */
export async function fetchAccounts(orgId: string): Promise<XeroAccount[]> {
  const result = await withRetry(async () => {
    const accessToken = process.env.XERO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Xero access token not configured");
    }

    const response = await rateLimitedFetch(
      `https://api.xero.com/api.xro/2.0/Accounts`,
      {
        headers: {
          ...getXeroHeaders(accessToken),
          "Xero-Tenant-Id": orgId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.Accounts || []).map((acc: Record<string, unknown>) => ({
      accountId: acc.AccountID as string,
      name: acc.Name as string,
      type: acc.Type as string,
      bankAccountNumber: acc.BankAccountNumber as string | undefined,
      currencyCode: acc.CurrencyCode as string,
      balance: acc.Balance as number | undefined,
    }));
  }, { maxRetries: 2 });

  return result.success ? result.data : [];
}

/**
 * Fetch transactions from Xero
 */
export async function fetchTransactions(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<XeroTransaction[]> {
  const result = await withRetry(async () => {
    const accessToken = process.env.XERO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Xero access token not configured");
    }

    const fromDate = startDate.toISOString().split("T")[0];
    const toDate = endDate.toISOString().split("T")[0];

    const response = await rateLimitedFetch(
      `https://api.xero.com/api.xro/2.0/BankTransactions?where=Date>="${fromDate}"&&Date<="${toDate}"`,
      {
        headers: {
          ...getXeroHeaders(accessToken),
          "Xero-Tenant-Id": orgId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.BankTransactions || []).map((txn: Record<string, unknown>) => ({
      transactionId: txn.BankTransactionID as string,
      date: txn.Date as string,
      description: (txn.Contact as Record<string, unknown>)?.Name as string || txn.Reference as string || "Unknown",
      amount: Math.abs(txn.Total as number),
      type: (txn.Type as string) === "RECEIVE" ? "credit" : "debit",
      accountId: (txn.BankAccount as Record<string, unknown>)?.AccountID as string,
      reference: txn.Reference as string | undefined,
    }));
  }, { maxRetries: 2 });

  return result.success ? result.data : [];
}

/**
 * Fetch invoices from Xero
 */
export async function fetchInvoices(orgId: string): Promise<XeroInvoice[]> {
  const result = await withRetry(async () => {
    const accessToken = process.env.XERO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Xero access token not configured");
    }

    const response = await rateLimitedFetch(
      `https://api.xero.com/api.xro/2.0/Invoices?where=Status!="DELETED"`,
      {
        headers: {
          ...getXeroHeaders(accessToken),
          "Xero-Tenant-Id": orgId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.Invoices || []).map((inv: Record<string, unknown>) => ({
      invoiceId: inv.InvoiceID as string,
      invoiceNumber: inv.InvoiceNumber as string,
      contact: (inv.Contact as Record<string, unknown>)?.Name as string,
      date: inv.Date as string,
      dueDate: inv.DueDate as string,
      total: inv.Total as number,
      amountDue: inv.AmountDue as number,
      status: inv.Status as string,
      type: inv.Type as "ACCREC" | "ACCPAY",
    }));
  }, { maxRetries: 2 });

  return result.success ? result.data : [];
}

/**
 * Fetch bills from Xero
 */
export async function fetchBills(orgId: string): Promise<XeroInvoice[]> {
  const invoices = await fetchInvoices(orgId);
  return invoices.filter((inv) => inv.type === "ACCPAY");
}

/**
 * Fetch bank statements from Xero
 */
export async function fetchBankStatements(
  orgId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<XeroTransaction[]> {
  return fetchTransactions(orgId, startDate, endDate);
}

/**
 * Sync Xero data to unified ledger
 */
export async function syncToUnifiedLedger(xeroOrgId: string): Promise<{
  accountsSynced: number;
  transactionsSynced: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  const errors: string[] = [];
  let accountsSynced = 0;
  let transactionsSynced = 0;

  try {
    // Fetch accounts
    const accounts = await fetchAccounts(xeroOrgId);

    for (const account of accounts) {
      const { error } = await supabase
        .from("founder_financial_accounts")
        .upsert({
          xero_org_id: xeroOrgId,
          xero_account_id: account.accountId,
          account_name: account.name,
          account_type: mapAccountType(account.type),
          currency: account.currencyCode,
          balance: account.balance || 0,
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: "xero_account_id",
        });

      if (error) {
        errors.push(`Account ${account.name}: ${error.message}`);
      } else {
        accountsSynced++;
      }
    }

    // Fetch transactions (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const transactions = await fetchTransactions(xeroOrgId, startDate, endDate);

    for (const txn of transactions) {
      // Find matching account in our system
      const { data: account } = await supabase
        .from("founder_financial_accounts")
        .select("id")
        .eq("xero_account_id", txn.accountId)
        .single();

      if (!account) {
        errors.push(`Transaction ${txn.transactionId}: Account not found`);
        continue;
      }

      const { error } = await supabase
        .from("founder_financial_transactions")
        .upsert({
          account_id: account.id,
          date: txn.date.split("T")[0],
          description: txn.description,
          amount: txn.amount,
          transaction_type: txn.type,
          source: "xero",
          xero_transaction_id: txn.transactionId,
        }, {
          onConflict: "xero_transaction_id",
        });

      if (error) {
        errors.push(`Transaction ${txn.transactionId}: ${error.message}`);
      } else {
        transactionsSynced++;
      }
    }

  } catch (err) {
    errors.push(`Sync error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    accountsSynced,
    transactionsSynced,
    errors,
  };
}

/**
 * Map Xero account type to our system
 */
function mapAccountType(xeroType: string): string {
  const typeMap: Record<string, string> = {
    BANK: "bank",
    CURRENT: "asset",
    CURRLIAB: "liability",
    DEPRECIATN: "expense",
    DIRECTCOSTS: "expense",
    EQUITY: "equity",
    EXPENSE: "expense",
    FIXED: "asset",
    INVENTORY: "asset",
    LIABILITY: "liability",
    NONCURRENT: "asset",
    OTHERINCOME: "revenue",
    OVERHEADS: "expense",
    PREPAYMENT: "asset",
    REVENUE: "revenue",
    SALES: "revenue",
    TERMLIAB: "liability",
  };

  return typeMap[xeroType] || "expense";
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  connectToOrganization,
  fetchAccounts,
  fetchTransactions,
  fetchInvoices,
  fetchBills,
  fetchBankStatements,
  syncToUnifiedLedger,
};
