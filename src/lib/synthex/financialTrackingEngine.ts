/**
 * Financial Tracking Engine
 *
 * Transaction ledger, invoice generation, and financial summary
 * for Synthex tenants. Works with or without Stripe integration.
 *
 * Features:
 * - Transaction logging (charges, refunds, credits)
 * - Invoice generation with line items
 * - Financial summary (MRR, total spend, balance)
 * - Plan cost calculation with offer discounts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  id: string;
  tenant_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type TransactionType =
  | 'subscription_charge'
  | 'job_charge'
  | 'refund'
  | 'credit'
  | 'adjustment';

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'void';
  plan_code: string | null;
  offer_tier: string | null;
  line_items: LineItem[];
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'subscription' | 'usage' | 'addon' | 'discount';
}

export interface FinancialSummary {
  mrr: number;
  totalSpend: number;
  currentPlanCost: number;
  discountApplied: number;
  transactionCount: number;
  lastPaymentDate: string | null;
  nextInvoiceDate: string | null;
  outstandingBalance: number;
  currency: string;
}

export interface CreateTransactionInput {
  tenantId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PLAN PRICING CONSTANTS
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

export const JOB_COST_ESTIMATE = 0.15; // AUD per job
export const GST_RATE = 0.10; // 10% Australian GST

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Get base plan price
 */
export function getPlanPrice(planCode: string): number {
  return PLAN_PRICES[planCode] ?? 0;
}

/**
 * Get discount percentage for offer tier
 */
export function getOfferDiscount(offerTier: string): number {
  return OFFER_DISCOUNTS[offerTier] ?? 0;
}

/**
 * Calculate effective monthly cost after discount
 */
export function calculateMonthlyCost(planCode: string, offerTier: string): number {
  const base = getPlanPrice(planCode);
  const discount = getOfferDiscount(offerTier);
  return base * (1 - discount);
}

/**
 * Calculate GST (Australian Goods and Services Tax)
 */
export function calculateGST(amount: number): number {
  return Math.round(amount * GST_RATE * 100) / 100;
}

/**
 * Calculate total with GST
 */
export function calculateTotalWithGST(amount: number): number {
  return Math.round((amount + calculateGST(amount)) * 100) / 100;
}

/**
 * Estimate job costs for a period
 */
export function estimateJobCosts(jobCount: number, costPerJob: number = JOB_COST_ESTIMATE): number {
  return Math.round(jobCount * costPerJob * 100) / 100;
}

/**
 * Generate invoice number (SYNTH-YYYYMM-XXXX)
 */
export function generateInvoiceNumber(tenantIndex: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(tenantIndex).padStart(4, '0');
  return `SYNTH-${year}${month}-${seq}`;
}

/**
 * Build invoice line items from plan and usage
 */
export function buildLineItems(
  planCode: string,
  offerTier: string,
  jobCount: number = 0
): LineItem[] {
  const items: LineItem[] = [];
  const basePrice = getPlanPrice(planCode);
  const discount = getOfferDiscount(offerTier);

  // Plan subscription line
  items.push({
    description: `Synthex ${planCode.charAt(0).toUpperCase() + planCode.slice(1)} Plan — Monthly`,
    quantity: 1,
    unit_price: basePrice,
    total: basePrice,
    type: 'subscription',
  });

  // Discount line (if applicable)
  if (discount > 0) {
    const discountAmount = basePrice * discount;
    items.push({
      description: `${offerTier.replace('_', ' ')} discount (${Math.round(discount * 100)}% off)`,
      quantity: 1,
      unit_price: -discountAmount,
      total: -discountAmount,
      type: 'discount',
    });
  }

  // Usage line (if jobs)
  if (jobCount > 0) {
    const jobCost = estimateJobCosts(jobCount);
    items.push({
      description: `AI Job Processing (${jobCount} jobs @ $${JOB_COST_ESTIMATE}/job)`,
      quantity: jobCount,
      unit_price: JOB_COST_ESTIMATE,
      total: jobCost,
      type: 'usage',
    });
  }

  return items;
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(lineItems: LineItem[]): {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItems
    .filter(i => i.type !== 'discount')
    .reduce((sum, i) => sum + i.total, 0);

  const discount = Math.abs(
    lineItems
      .filter(i => i.type === 'discount')
      .reduce((sum, i) => sum + i.total, 0)
  );

  const taxableAmount = subtotal - discount;
  const tax = calculateGST(taxableAmount);
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax,
    total,
  };
}

/**
 * Build a financial summary from transactions
 */
export function buildFinancialSummary(
  transactions: Transaction[],
  planCode: string,
  offerTier: string,
  nextInvoiceDate: string | null
): FinancialSummary {
  const monthlyCost = calculateMonthlyCost(planCode, offerTier);
  const basePrice = getPlanPrice(planCode);
  const discountAmount = basePrice - monthlyCost;

  const completedTxns = transactions.filter(t => t.status === 'completed');
  const totalSpend = completedTxns
    .filter(t => t.transaction_type !== 'refund' && t.transaction_type !== 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const refunds = completedTxns
    .filter(t => t.transaction_type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const credits = completedTxns
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCharges = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastPayment = completedTxns
    .filter(t => t.transaction_type === 'subscription_charge')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    mrr: monthlyCost,
    totalSpend: Math.round((totalSpend - refunds) * 100) / 100,
    currentPlanCost: monthlyCost,
    discountApplied: Math.round(discountAmount * 100) / 100,
    transactionCount: transactions.length,
    lastPaymentDate: lastPayment?.created_at ?? null,
    nextInvoiceDate,
    outstandingBalance: Math.round((pendingCharges - credits) * 100) / 100,
    currency: 'AUD',
  };
}

/**
 * Determine transaction status display
 */
export function getTransactionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    pending: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
    failed: 'text-red-300 border-red-500/30 bg-red-500/10',
    refunded: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
  };
  return colors[status] || colors.pending;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return `$${amount.toFixed(2)} ${currency}`;
}
