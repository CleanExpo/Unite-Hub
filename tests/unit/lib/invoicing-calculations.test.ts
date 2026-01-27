import { describe, it, expect } from 'vitest';
import * as invoicingService from '@/lib/erp/invoicingService';

describe('Invoicing Calculations', () => {
  describe('calculateLineItem', () => {
    it('should calculate line item with no discount', () => {
      const result = invoicingService.calculateLineItem(2, 10000, 0, 0.1);

      expect(result.line_subtotal).toBe(20000); // 2 * $100 = $200
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(2000); // 10% of $200 = $20
      expect(result.line_total).toBe(22000); // $220
    });

    it('should calculate line item with discount', () => {
      const result = invoicingService.calculateLineItem(2, 10000, 10, 0.1);

      expect(result.line_subtotal).toBe(20000); // 2 * $100 = $200
      expect(result.line_discount).toBe(2000); // 10% of $200 = $20
      expect(result.line_tax).toBe(1800); // 10% of ($200 - $20) = $18
      expect(result.line_total).toBe(19800); // $180 + $18 = $198
    });

    it('should handle fractional quantities', () => {
      const result = invoicingService.calculateLineItem(2.5, 10000, 0, 0.1);

      expect(result.line_subtotal).toBe(25000); // 2.5 * $100 = $250
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(2500); // 10% of $250 = $25
      expect(result.line_total).toBe(27500); // $275
    });

    it('should handle zero quantity', () => {
      const result = invoicingService.calculateLineItem(0, 10000, 0, 0.1);

      expect(result.line_subtotal).toBe(0);
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(0);
      expect(result.line_total).toBe(0);
    });

    it('should handle 100% discount', () => {
      const result = invoicingService.calculateLineItem(1, 10000, 100, 0.1);

      expect(result.line_subtotal).toBe(10000);
      expect(result.line_discount).toBe(10000);
      expect(result.line_tax).toBe(0); // No tax on $0
      expect(result.line_total).toBe(0);
    });

    it('should handle different tax rates', () => {
      // 5% tax instead of 10%
      const result = invoicingService.calculateLineItem(1, 10000, 0, 0.05);

      expect(result.line_subtotal).toBe(10000);
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(500); // 5% of $100 = $5
      expect(result.line_total).toBe(10500);
    });

    it('should round correctly', () => {
      // Test case that might produce fractional cents
      const result = invoicingService.calculateLineItem(3, 3333, 10, 0.1);

      expect(result.line_subtotal).toBe(9999); // 3 * 33.33 = 99.99
      expect(result.line_discount).toBe(1000); // 10% of 99.99 ≈ 10.00
      expect(result.line_tax).toBe(900); // 10% of (99.99 - 10.00) ≈ 9.00
      expect(result.line_total).toBe(9899); // 89.99 + 9.00 = 98.99
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for single line item', () => {
      const result = invoicingService.calculateInvoiceTotals([
        { quantity: 1, unit_price: 10000, discount_percent: 0 },
      ]);

      expect(result.subtotal).toBe(10000);
      expect(result.discount_amount).toBe(0);
      expect(result.tax_amount).toBe(1000);
      expect(result.total_amount).toBe(11000);
    });

    it('should calculate totals for multiple line items', () => {
      const result = invoicingService.calculateInvoiceTotals([
        { quantity: 10, unit_price: 15000, discount_percent: 0 }, // $1,500
        { quantity: 1, unit_price: 5000, discount_percent: 10 }, // $50 - 10% = $45
      ]);

      expect(result.subtotal).toBe(155000); // $1,500 + $50 = $1,550
      expect(result.discount_amount).toBe(500); // $5
      expect(result.tax_amount).toBe(15450); // 10% of $1,545 = $154.50
      expect(result.total_amount).toBe(169950); // $1,699.50
    });

    it('should handle all items with discounts', () => {
      const result = invoicingService.calculateInvoiceTotals([
        { quantity: 1, unit_price: 10000, discount_percent: 10 },
        { quantity: 1, unit_price: 20000, discount_percent: 20 },
      ]);

      expect(result.subtotal).toBe(30000); // $300
      expect(result.discount_amount).toBe(5000); // $10 + $40 = $50
      expect(result.tax_amount).toBe(2500); // 10% of $250 = $25
      expect(result.total_amount).toBe(27500); // $275
    });

    it('should use custom tax rate', () => {
      const result = invoicingService.calculateInvoiceTotals(
        [{ quantity: 1, unit_price: 10000, discount_percent: 0 }],
        0.15 // 15% tax
      );

      expect(result.subtotal).toBe(10000);
      expect(result.discount_amount).toBe(0);
      expect(result.tax_amount).toBe(1500); // 15% of $100 = $15
      expect(result.total_amount).toBe(11500);
    });

    it('should handle empty line items', () => {
      const result = invoicingService.calculateInvoiceTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.discount_amount).toBe(0);
      expect(result.tax_amount).toBe(0);
      expect(result.total_amount).toBe(0);
    });
  });

  describe('GST Calculations', () => {
    it('should use correct Australian GST rate', () => {
      expect(invoicingService.GST_RATE).toBe(0.10); // 10%
    });

    it('should calculate GST correctly on $1,000', () => {
      const result = invoicingService.calculateLineItem(1, 100000, 0);

      expect(result.line_tax).toBe(10000); // $100 GST on $1,000
      expect(result.line_total).toBe(110000); // $1,100 total
    });

    it('should calculate GST correctly with discount', () => {
      const result = invoicingService.calculateLineItem(1, 100000, 20);

      // $1,000 - 20% discount = $800
      // GST on $800 = $80
      expect(result.line_discount).toBe(20000);
      expect(result.line_tax).toBe(8000);
      expect(result.line_total).toBe(88000); // $880
    });
  });

  describe('Payment Terms', () => {
    it('should have correct default payment terms', () => {
      expect(invoicingService.DEFAULT_PAYMENT_TERMS).toBe(30); // Net 30
    });

    it('should have correct invoice prefix', () => {
      expect(invoicingService.INVOICE_PREFIX).toBe('INV');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts (cents)', () => {
      const result = invoicingService.calculateLineItem(1, 1, 0, 0.1);

      expect(result.line_subtotal).toBe(1);
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(0); // Rounds to 0
      expect(result.line_total).toBe(1);
    });

    it('should handle very large amounts', () => {
      const result = invoicingService.calculateLineItem(1, 100000000, 0, 0.1);

      expect(result.line_subtotal).toBe(100000000); // $1,000,000
      expect(result.line_discount).toBe(0);
      expect(result.line_tax).toBe(10000000); // $100,000
      expect(result.line_total).toBe(110000000); // $1,100,000
    });

    it('should handle negative quantities gracefully', () => {
      // Negative quantities might represent returns/refunds
      const result = invoicingService.calculateLineItem(-1, 10000, 0, 0.1);

      expect(result.line_subtotal).toBe(-10000);
      expect(Math.abs(result.line_discount)).toBe(0); // Handle -0 vs 0
      expect(result.line_tax).toBe(-1000);
      expect(result.line_total).toBe(-11000);
    });
  });
});
