// Financial Tracking Engine
// Pure/synchronous functions for plan pricing, discounts, GST, invoicing, and financial summaries.

// ============================================================================
// Constants
// ============================================================================

export const PLAN_PRICES: Record<string, number> = {
  launch: 49,
  growth: 129,
  scale: 299,
};

export const OFFER_DISCOUNTS: Record<string, number> = {
  early_founders: 0.50,
  growth_wave: 0.25,
  standard: 0,
};

export const JOB_COST_ESTIMATE = 0.15;

export const GST_RATE = 0.10;

// ============================================================================
// Types
// ============================================================================

export interface Transaction {
  id: string;
  tenant_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LineItem {
  type: 'subscription' | 'discount' | 'usage';
  description: string;
  quantity?: number;
  unit_price?: number;
  total: number;
}

interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface FinancialSummary {
  mrr: number;
  currentPlanCost: number;
  discountApplied: number;
  totalSpend: number;
  outstandingBalance: number;
  lastPaymentDate: string | null;
  nextInvoiceDate: string | null;
  currency: string;
  transactionCount: number;
}

// ============================================================================
// Plan Pricing
// ============================================================================

export function getPlanPrice(plan: string): number {
  return PLAN_PRICES[plan] ?? 0;
}

// ============================================================================
// Offer Discounts
// ============================================================================

export function getOfferDiscount(offer: string): number {
  return OFFER_DISCOUNTS[offer] ?? 0;
}

// ============================================================================
// Monthly Cost
// ============================================================================

export function calculateMonthlyCost(plan: string, offer: string): number {
  const price = getPlanPrice(plan);
  const discount = getOfferDiscount(offer);
  return round2(price * (1 - discount));
}

// ============================================================================
// GST Calculation
// ============================================================================

export function calculateGST(amount: number): number {
  return round2(amount * GST_RATE);
}

export function calculateTotalWithGST(amount: number): number {
  return round2(amount + calculateGST(amount));
}

// ============================================================================
// Job Cost Estimation
// ============================================================================

export function estimateJobCosts(jobCount: number, costPerJob: number = JOB_COST_ESTIMATE): number {
  return round2(jobCount * costPerJob);
}

// ============================================================================
// Invoice Number Generation
// ============================================================================

export function generateInvoiceNumber(sequence: number, date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `SYNTH-${year}${month}-${seq}`;
}

// ============================================================================
// Line Item Building
// ============================================================================

const PLAN_LABELS: Record<string, string> = {
  launch: 'Launch Plan',
  growth: 'Growth Plan',
  scale: 'Scale Plan',
};

export function buildLineItems(plan: string, offer: string, jobCount?: number): LineItem[] {
  const items: LineItem[] = [];
  const price = getPlanPrice(plan);
  const label = PLAN_LABELS[plan] ?? plan;

  items.push({
    type: 'subscription',
    description: `${label} - Monthly Subscription`,
    total: price,
  });

  const discountRate = getOfferDiscount(offer);
  if (discountRate > 0) {
    const discountAmount = round2(price * discountRate);
    items.push({
      type: 'discount',
      description: `Discount (${offer})`,
      total: -discountAmount,
    });
  }

  if (jobCount && jobCount > 0) {
    items.push({
      type: 'usage',
      description: 'AI Job Processing',
      quantity: jobCount,
      unit_price: JOB_COST_ESTIMATE,
      total: estimateJobCosts(jobCount),
    });
  }

  return items;
}

// ============================================================================
// Invoice Totals
// ============================================================================

export function calculateInvoiceTotals(items: LineItem[]): InvoiceTotals {
  let subtotal = 0;
  let discount = 0;

  for (const item of items) {
    if (item.type === 'discount') {
      discount += Math.abs(item.total);
    } else {
      subtotal += item.total;
    }
  }

  subtotal = round2(subtotal);
  discount = round2(discount);
  const taxable = round2(subtotal - discount);
  const tax = calculateGST(taxable);
  const total = round2(taxable + tax);

  return { subtotal, discount, tax, total };
}

// ============================================================================
// Financial Summary
// ============================================================================

export function buildFinancialSummary(
  transactions: Transaction[],
  plan: string,
  offer: string,
  nextInvoiceDate: string | null,
): FinancialSummary {
  const currentPlanCost = getPlanPrice(plan);
  const discountRate = getOfferDiscount(offer);
  const discountApplied = round2(currentPlanCost * discountRate);
  const mrr = round2(currentPlanCost - discountApplied);

  let totalSpend = 0;
  let outstandingBalance = 0;
  let lastPaymentDate: string | null = null;

  for (const txn of transactions) {
    if (txn.transaction_type === 'refund') {
      totalSpend -= txn.amount;
    } else if (txn.transaction_type === 'credit') {
      outstandingBalance -= txn.amount;
    } else if (txn.status === 'pending') {
      outstandingBalance += txn.amount;
    } else if (txn.status === 'completed') {
      totalSpend += txn.amount;
      if (txn.transaction_type === 'subscription_charge') {
        if (!lastPaymentDate || txn.created_at > lastPaymentDate) {
          lastPaymentDate = txn.created_at;
        }
      }
    }
  }

  return {
    mrr,
    currentPlanCost,
    discountApplied,
    totalSpend: round2(totalSpend),
    outstandingBalance: round2(outstandingBalance),
    lastPaymentDate,
    nextInvoiceDate,
    currency: 'AUD',
    transactionCount: transactions.length,
  };
}

// ============================================================================
// Display Helpers
// ============================================================================

export function getTransactionStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-600 bg-emerald-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    case 'refunded':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-yellow-600 bg-yellow-50';
  }
}

export function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return `$${round2(amount).toFixed(2)} ${currency}`;
}

// ============================================================================
// Helpers
// ============================================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
