/**
 * Financial Tracking Engine Unit Tests
 *
 * Tests for pure/synchronous functions:
 * - Plan pricing
 * - Offer discounts
 * - Monthly cost calculation
 * - GST calculation
 * - Job cost estimation
 * - Invoice number generation
 * - Line item building
 * - Invoice totals calculation
 * - Financial summary building
 * - Status colors and formatting
 */

import { describe, it, expect } from 'vitest';

import {
  getPlanPrice,
  getOfferDiscount,
  calculateMonthlyCost,
  calculateGST,
  calculateTotalWithGST,
  estimateJobCosts,
  generateInvoiceNumber,
  buildLineItems,
  calculateInvoiceTotals,
  buildFinancialSummary,
  getTransactionStatusColor,
  formatCurrency,
  PLAN_PRICES,
  OFFER_DISCOUNTS,
  JOB_COST_ESTIMATE,
  GST_RATE,
} from '@/lib/synthex/financialTrackingEngine';

import type { Transaction } from '@/lib/synthex/financialTrackingEngine';

// ============================================================================
// Plan Pricing
// ============================================================================

describe('getPlanPrice', () => {
  it('should return launch plan price', () => {
    expect(getPlanPrice('launch')).toBe(49);
  });

  it('should return growth plan price', () => {
    expect(getPlanPrice('growth')).toBe(129);
  });

  it('should return scale plan price', () => {
    expect(getPlanPrice('scale')).toBe(299);
  });

  it('should return 0 for unknown plan', () => {
    expect(getPlanPrice('unknown')).toBe(0);
    expect(getPlanPrice('')).toBe(0);
  });
});

// ============================================================================
// Offer Discounts
// ============================================================================

describe('getOfferDiscount', () => {
  it('should return early founders discount', () => {
    expect(getOfferDiscount('early_founders')).toBe(0.50);
  });

  it('should return growth wave discount', () => {
    expect(getOfferDiscount('growth_wave')).toBe(0.25);
  });

  it('should return 0 for standard tier', () => {
    expect(getOfferDiscount('standard')).toBe(0);
  });

  it('should return 0 for unknown tier', () => {
    expect(getOfferDiscount('premium')).toBe(0);
  });
});

// ============================================================================
// Monthly Cost
// ============================================================================

describe('calculateMonthlyCost', () => {
  it('should calculate full price for standard tier', () => {
    expect(calculateMonthlyCost('launch', 'standard')).toBe(49);
    expect(calculateMonthlyCost('growth', 'standard')).toBe(129);
    expect(calculateMonthlyCost('scale', 'standard')).toBe(299);
  });

  it('should apply 50% early founders discount', () => {
    expect(calculateMonthlyCost('launch', 'early_founders')).toBe(24.5);
    expect(calculateMonthlyCost('growth', 'early_founders')).toBe(64.5);
    expect(calculateMonthlyCost('scale', 'early_founders')).toBe(149.5);
  });

  it('should apply 25% growth wave discount', () => {
    expect(calculateMonthlyCost('launch', 'growth_wave')).toBe(36.75);
    expect(calculateMonthlyCost('growth', 'growth_wave')).toBe(96.75);
    expect(calculateMonthlyCost('scale', 'growth_wave')).toBe(224.25);
  });

  it('should return 0 for unknown plan', () => {
    expect(calculateMonthlyCost('unknown', 'standard')).toBe(0);
  });
});

// ============================================================================
// GST Calculation
// ============================================================================

describe('calculateGST', () => {
  it('should calculate 10% GST', () => {
    expect(calculateGST(100)).toBe(10);
    expect(calculateGST(49)).toBe(4.9);
  });

  it('should round to 2 decimal places', () => {
    expect(calculateGST(33.33)).toBe(3.33);
    expect(calculateGST(66.67)).toBe(6.67);
  });

  it('should return 0 for 0 amount', () => {
    expect(calculateGST(0)).toBe(0);
  });
});

describe('calculateTotalWithGST', () => {
  it('should add GST to amount', () => {
    expect(calculateTotalWithGST(100)).toBe(110);
    expect(calculateTotalWithGST(49)).toBe(53.9);
  });

  it('should round correctly', () => {
    expect(calculateTotalWithGST(33.33)).toBe(36.66);
  });
});

// ============================================================================
// Job Cost Estimation
// ============================================================================

describe('estimateJobCosts', () => {
  it('should calculate cost at default rate', () => {
    expect(estimateJobCosts(10)).toBe(1.5);
    expect(estimateJobCosts(100)).toBe(15);
    expect(estimateJobCosts(1000)).toBe(150);
  });

  it('should use custom cost per job', () => {
    expect(estimateJobCosts(10, 0.25)).toBe(2.5);
    expect(estimateJobCosts(100, 0.50)).toBe(50);
  });

  it('should return 0 for 0 jobs', () => {
    expect(estimateJobCosts(0)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    expect(estimateJobCosts(7)).toBe(1.05);
  });
});

// ============================================================================
// Invoice Number Generation
// ============================================================================

describe('generateInvoiceNumber', () => {
  it('should generate correct format', () => {
    const date = new Date(2026, 0, 15); // Jan 2026
    expect(generateInvoiceNumber(1, date)).toBe('SYNTH-202601-0001');
  });

  it('should pad sequence number', () => {
    const date = new Date(2026, 5, 1); // Jun 2026
    expect(generateInvoiceNumber(42, date)).toBe('SYNTH-202606-0042');
    expect(generateInvoiceNumber(999, date)).toBe('SYNTH-202606-0999');
  });

  it('should handle December correctly', () => {
    const date = new Date(2025, 11, 31); // Dec 2025
    expect(generateInvoiceNumber(1, date)).toBe('SYNTH-202512-0001');
  });

  it('should use current date when none provided', () => {
    const result = generateInvoiceNumber(1);
    expect(result).toMatch(/^SYNTH-\d{6}-0001$/);
  });
});

// ============================================================================
// Line Item Building
// ============================================================================

describe('buildLineItems', () => {
  it('should include subscription line', () => {
    const items = buildLineItems('launch', 'standard');
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('subscription');
    expect(items[0].total).toBe(49);
    expect(items[0].description).toContain('Launch Plan');
  });

  it('should include discount line for early founders', () => {
    const items = buildLineItems('growth', 'early_founders');
    expect(items).toHaveLength(2);
    expect(items[1].type).toBe('discount');
    expect(items[1].total).toBe(-64.5); // 50% of 129
  });

  it('should include discount line for growth wave', () => {
    const items = buildLineItems('scale', 'growth_wave');
    expect(items).toHaveLength(2);
    expect(items[1].type).toBe('discount');
    expect(items[1].total).toBe(-74.75); // 25% of 299
  });

  it('should include usage line for jobs', () => {
    const items = buildLineItems('launch', 'standard', 50);
    expect(items).toHaveLength(2);
    expect(items[1].type).toBe('usage');
    expect(items[1].quantity).toBe(50);
    expect(items[1].unit_price).toBe(JOB_COST_ESTIMATE);
    expect(items[1].total).toBe(7.5);
  });

  it('should include all three line types', () => {
    const items = buildLineItems('growth', 'early_founders', 100);
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('subscription');
    expect(items[1].type).toBe('discount');
    expect(items[2].type).toBe('usage');
  });

  it('should not include usage line for 0 jobs', () => {
    const items = buildLineItems('launch', 'standard', 0);
    expect(items).toHaveLength(1);
  });

  it('should not include discount line for standard tier', () => {
    const items = buildLineItems('scale', 'standard', 10);
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('subscription');
    expect(items[1].type).toBe('usage');
  });
});

// ============================================================================
// Invoice Totals
// ============================================================================

describe('calculateInvoiceTotals', () => {
  it('should calculate simple subscription totals', () => {
    const items = buildLineItems('launch', 'standard');
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotal).toBe(49);
    expect(totals.discount).toBe(0);
    expect(totals.tax).toBe(4.9);
    expect(totals.total).toBe(53.9);
  });

  it('should apply discount correctly', () => {
    const items = buildLineItems('growth', 'early_founders');
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotal).toBe(129);
    expect(totals.discount).toBe(64.5);
    expect(totals.tax).toBe(6.45);
    expect(totals.total).toBe(70.95);
  });

  it('should include job costs in total', () => {
    const items = buildLineItems('launch', 'standard', 100);
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotal).toBe(64); // 49 + 15
    expect(totals.discount).toBe(0);
    expect(totals.tax).toBe(6.4);
    expect(totals.total).toBe(70.4);
  });

  it('should handle full combo: subscription + discount + usage', () => {
    const items = buildLineItems('scale', 'growth_wave', 200);
    const totals = calculateInvoiceTotals(items);
    // subscription: 299, usage: 30
    expect(totals.subtotal).toBe(329);
    // discount: 25% of 299 = 74.75
    expect(totals.discount).toBe(74.75);
    // taxable: 329 - 74.75 = 254.25
    expect(totals.tax).toBe(25.43); // 10% rounded
    expect(totals.total).toBe(279.68);
  });
});

// ============================================================================
// Financial Summary
// ============================================================================

describe('buildFinancialSummary', () => {
  const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'txn-1',
    tenant_id: 'tenant-1',
    transaction_type: 'subscription_charge',
    amount: 49,
    currency: 'AUD',
    status: 'completed',
    description: null,
    reference_id: null,
    reference_type: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  it('should calculate MRR from plan and offer', () => {
    const summary = buildFinancialSummary([], 'launch', 'standard', null);
    expect(summary.mrr).toBe(49);
    expect(summary.currentPlanCost).toBe(49);
  });

  it('should calculate MRR with discount', () => {
    const summary = buildFinancialSummary([], 'growth', 'early_founders', null);
    expect(summary.mrr).toBe(64.5);
    expect(summary.discountApplied).toBe(64.5);
  });

  it('should sum total spend from completed charges', () => {
    const txns = [
      makeTransaction({ amount: 49 }),
      makeTransaction({ amount: 49, created_at: '2026-02-01T00:00:00Z' }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.totalSpend).toBe(98);
  });

  it('should subtract refunds from total spend', () => {
    const txns = [
      makeTransaction({ amount: 49 }),
      makeTransaction({ id: 'txn-2', transaction_type: 'refund', amount: 20 }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.totalSpend).toBe(29);
  });

  it('should track outstanding balance from pending', () => {
    const txns = [
      makeTransaction({ status: 'pending', amount: 49 }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.outstandingBalance).toBe(49);
  });

  it('should subtract credits from outstanding balance', () => {
    const txns = [
      makeTransaction({ status: 'pending', amount: 100 }),
      makeTransaction({ transaction_type: 'credit', amount: 25 }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.outstandingBalance).toBe(75);
  });

  it('should find last payment date', () => {
    const txns = [
      makeTransaction({ created_at: '2026-01-01T00:00:00Z' }),
      makeTransaction({ id: 'txn-2', created_at: '2026-02-01T00:00:00Z' }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.lastPaymentDate).toBe('2026-02-01T00:00:00Z');
  });

  it('should return null last payment date when no charges', () => {
    const txns = [
      makeTransaction({ transaction_type: 'credit', amount: 10 }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.lastPaymentDate).toBeNull();
  });

  it('should set currency to AUD', () => {
    const summary = buildFinancialSummary([], 'launch', 'standard', null);
    expect(summary.currency).toBe('AUD');
  });

  it('should include next invoice date', () => {
    const summary = buildFinancialSummary([], 'launch', 'standard', '2026-02-01T00:00:00Z');
    expect(summary.nextInvoiceDate).toBe('2026-02-01T00:00:00Z');
  });

  it('should count all transactions', () => {
    const txns = [
      makeTransaction(),
      makeTransaction({ id: 'txn-2', transaction_type: 'refund', amount: 10 }),
      makeTransaction({ id: 'txn-3', status: 'pending', amount: 49 }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.transactionCount).toBe(3);
  });
});

// ============================================================================
// Display Helpers
// ============================================================================

describe('getTransactionStatusColor', () => {
  it('should return emerald for completed', () => {
    expect(getTransactionStatusColor('completed')).toContain('emerald');
  });

  it('should return yellow for pending', () => {
    expect(getTransactionStatusColor('pending')).toContain('yellow');
  });

  it('should return red for failed', () => {
    expect(getTransactionStatusColor('failed')).toContain('red');
  });

  it('should return blue for refunded', () => {
    expect(getTransactionStatusColor('refunded')).toContain('blue');
  });

  it('should default to pending style for unknown status', () => {
    expect(getTransactionStatusColor('unknown')).toContain('yellow');
  });
});

describe('formatCurrency', () => {
  it('should format with AUD default', () => {
    expect(formatCurrency(49)).toBe('$49.00 AUD');
  });

  it('should format with custom currency', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99 USD');
  });

  it('should format 0', () => {
    expect(formatCurrency(0)).toBe('$0.00 AUD');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(33.333)).toBe('$33.33 AUD');
  });
});

// ============================================================================
// Constants Validation
// ============================================================================

describe('constants', () => {
  it('should have correct plan prices', () => {
    expect(PLAN_PRICES.launch).toBe(49);
    expect(PLAN_PRICES.growth).toBe(129);
    expect(PLAN_PRICES.scale).toBe(299);
  });

  it('should have correct offer discounts', () => {
    expect(OFFER_DISCOUNTS.early_founders).toBe(0.50);
    expect(OFFER_DISCOUNTS.growth_wave).toBe(0.25);
    expect(OFFER_DISCOUNTS.standard).toBe(0);
  });

  it('should have correct job cost estimate', () => {
    expect(JOB_COST_ESTIMATE).toBe(0.15);
  });

  it('should have correct GST rate', () => {
    expect(GST_RATE).toBe(0.10);
  });
});
