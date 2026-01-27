/**
 * Financial Tracking Integration Tests
 *
 * End-to-end scenarios:
 * - Invoice generation pipeline (line items → totals)
 * - Financial summary across multiple transactions
 * - Multi-plan cost comparisons
 * - GST compliance
 * - Edge cases: zero jobs, unknown plans, mixed statuses
 */

import { describe, it, expect } from 'vitest';

import {
  buildLineItems,
  calculateInvoiceTotals,
  buildFinancialSummary,
  calculateMonthlyCost,
  calculateGST,
  calculateTotalWithGST,
  generateInvoiceNumber,
  estimateJobCosts,
  formatCurrency,
  PLAN_PRICES,
  OFFER_DISCOUNTS,
  GST_RATE,
} from '@/lib/synthex/financialTrackingEngine';

import type { Transaction } from '@/lib/synthex/financialTrackingEngine';

// ============================================================================
// Invoice Generation Pipeline
// ============================================================================

describe('Invoice generation pipeline', () => {
  it('should generate correct invoice for Launch standard with no jobs', () => {
    const items = buildLineItems('launch', 'standard', 0);
    const totals = calculateInvoiceTotals(items);

    expect(items).toHaveLength(1);
    expect(totals.subtotal).toBe(49);
    expect(totals.discount).toBe(0);
    expect(totals.tax).toBe(4.9);
    expect(totals.total).toBe(53.9);
  });

  it('should generate correct invoice for Growth early_founders with 50 jobs', () => {
    const items = buildLineItems('growth', 'early_founders', 50);
    const totals = calculateInvoiceTotals(items);

    // Subscription: $129, Discount: -$64.50, Usage: $7.50
    expect(items).toHaveLength(3);
    expect(totals.subtotal).toBe(136.5); // 129 + 7.50
    expect(totals.discount).toBe(64.5);
    // Taxable: 136.5 - 64.5 = 72, Tax: 7.2
    expect(totals.tax).toBe(7.2);
    expect(totals.total).toBe(79.2);
  });

  it('should generate correct invoice for Scale growth_wave with 500 jobs', () => {
    const items = buildLineItems('scale', 'growth_wave', 500);
    const totals = calculateInvoiceTotals(items);

    // Subscription: $299, Discount: -$74.75, Usage: $75
    expect(items).toHaveLength(3);
    expect(totals.subtotal).toBe(374); // 299 + 75
    expect(totals.discount).toBe(74.75);
    // Taxable: 374 - 74.75 = 299.25, Tax: 29.93 (rounded)
    expect(totals.tax).toBe(29.93);
    expect(totals.total).toBe(329.18);
  });
});

// ============================================================================
// Multi-Plan Comparison
// ============================================================================

describe('Multi-plan cost comparison', () => {
  it('should correctly order plans by price', () => {
    const launchCost = calculateMonthlyCost('launch', 'standard');
    const growthCost = calculateMonthlyCost('growth', 'standard');
    const scaleCost = calculateMonthlyCost('scale', 'standard');

    expect(launchCost).toBeLessThan(growthCost);
    expect(growthCost).toBeLessThan(scaleCost);
  });

  it('should show early_founders is always cheaper than standard', () => {
    for (const plan of ['launch', 'growth', 'scale']) {
      const standard = calculateMonthlyCost(plan, 'standard');
      const earlyFounders = calculateMonthlyCost(plan, 'early_founders');
      expect(earlyFounders).toBeLessThan(standard);
    }
  });

  it('should show growth_wave is between standard and early_founders', () => {
    for (const plan of ['launch', 'growth', 'scale']) {
      const standard = calculateMonthlyCost(plan, 'standard');
      const growthWave = calculateMonthlyCost(plan, 'growth_wave');
      const earlyFounders = calculateMonthlyCost(plan, 'early_founders');
      expect(growthWave).toBeLessThan(standard);
      expect(growthWave).toBeGreaterThan(earlyFounders);
    }
  });
});

// ============================================================================
// GST Compliance
// ============================================================================

describe('GST compliance', () => {
  it('should apply exactly 10% GST', () => {
    expect(GST_RATE).toBe(0.10);
  });

  it('should calculate GST correctly for all plan prices', () => {
    for (const [plan, price] of Object.entries(PLAN_PRICES)) {
      const gst = calculateGST(price);
      const expected = Math.round(price * 0.10 * 100) / 100;
      expect(gst).toBe(expected);
    }
  });

  it('should make total exactly 110% of base for non-discounted', () => {
    const base = 100;
    const total = calculateTotalWithGST(base);
    expect(total).toBe(110);
  });

  it('should apply GST after discount', () => {
    const items = buildLineItems('growth', 'early_founders');
    const totals = calculateInvoiceTotals(items);

    // After discount: 129 - 64.5 = 64.5
    // Tax should be 10% of 64.5 = 6.45
    expect(totals.tax).toBe(6.45);
  });
});

// ============================================================================
// Financial Summary Scenarios
// ============================================================================

describe('Financial summary scenarios', () => {
  const mkTxn = (overrides: Partial<Transaction>): Transaction => ({
    id: 'txn-default',
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

  it('should handle empty transaction history', () => {
    const summary = buildFinancialSummary([], 'launch', 'standard', null);
    expect(summary.totalSpend).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.lastPaymentDate).toBeNull();
    expect(summary.outstandingBalance).toBe(0);
  });

  it('should handle 12 months of subscription charges', () => {
    const txns = Array.from({ length: 12 }, (_, i) =>
      mkTxn({
        id: `txn-${i}`,
        amount: 49,
        created_at: new Date(2025, i, 1).toISOString(),
      })
    );
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    expect(summary.totalSpend).toBe(588); // 49 * 12
    expect(summary.transactionCount).toBe(12);
  });

  it('should handle mixed completed and failed transactions', () => {
    const txns = [
      mkTxn({ id: 'txn-1', amount: 49, status: 'completed' }),
      mkTxn({ id: 'txn-2', amount: 49, status: 'failed' }),
      mkTxn({ id: 'txn-3', amount: 49, status: 'completed' }),
    ];
    const summary = buildFinancialSummary(txns, 'launch', 'standard', null);
    // Only completed charges count toward total spend
    expect(summary.totalSpend).toBe(98);
    expect(summary.transactionCount).toBe(3);
  });

  it('should handle partial refund scenario', () => {
    const txns = [
      mkTxn({ id: 'txn-1', amount: 129 }),
      mkTxn({ id: 'txn-2', transaction_type: 'refund', amount: 50 }),
    ];
    const summary = buildFinancialSummary(txns, 'growth', 'standard', null);
    expect(summary.totalSpend).toBe(79); // 129 - 50
  });

  it('should calculate discount amount for summary', () => {
    const summary = buildFinancialSummary([], 'scale', 'early_founders', null);
    // Scale base: 299, with 50% off: 149.5
    expect(summary.mrr).toBe(149.5);
    expect(summary.discountApplied).toBe(149.5); // 299 - 149.5
  });

  it('should handle credits reducing outstanding balance', () => {
    const txns = [
      mkTxn({ id: 'txn-1', status: 'pending', amount: 200 }),
      mkTxn({ id: 'txn-2', transaction_type: 'credit', amount: 50, status: 'completed' }),
    ];
    const summary = buildFinancialSummary(txns, 'scale', 'standard', null);
    expect(summary.outstandingBalance).toBe(150); // 200 pending - 50 credit
  });
});

// ============================================================================
// Invoice Number Sequencing
// ============================================================================

describe('Invoice number sequencing', () => {
  it('should generate sequential invoice numbers', () => {
    const date = new Date(2026, 0, 1);
    const numbers = Array.from({ length: 5 }, (_, i) =>
      generateInvoiceNumber(i + 1, date)
    );
    expect(numbers).toEqual([
      'SYNTH-202601-0001',
      'SYNTH-202601-0002',
      'SYNTH-202601-0003',
      'SYNTH-202601-0004',
      'SYNTH-202601-0005',
    ]);
  });

  it('should handle different months', () => {
    expect(generateInvoiceNumber(1, new Date(2026, 0, 1))).toBe('SYNTH-202601-0001');
    expect(generateInvoiceNumber(1, new Date(2026, 6, 1))).toBe('SYNTH-202607-0001');
    expect(generateInvoiceNumber(1, new Date(2026, 11, 1))).toBe('SYNTH-202612-0001');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge cases', () => {
  it('should handle unknown plan code gracefully', () => {
    const items = buildLineItems('enterprise', 'standard');
    const totals = calculateInvoiceTotals(items);
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('should handle very large job counts', () => {
    const cost = estimateJobCosts(100000);
    expect(cost).toBe(15000);
  });

  it('should format zero currency', () => {
    expect(formatCurrency(0)).toBe('$0.00 AUD');
  });

  it('should format large amounts', () => {
    expect(formatCurrency(9999.99)).toBe('$9999.99 AUD');
  });

  it('should handle all discount tiers for all plans', () => {
    for (const plan of Object.keys(PLAN_PRICES)) {
      for (const offer of Object.keys(OFFER_DISCOUNTS)) {
        const cost = calculateMonthlyCost(plan, offer);
        expect(cost).toBeGreaterThanOrEqual(0);
        expect(cost).toBeLessThanOrEqual(PLAN_PRICES[plan]);
      }
    }
  });
});
