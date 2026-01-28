import { describe, it, expect } from 'vitest';

describe('Reports Calculations', () => {
  describe('Stock Valuation', () => {
    it('should calculate total value correctly', () => {
      const stockItems = [
        { quantity_on_hand: 100, average_cost: 1000 }, // $1,000
        { quantity_on_hand: 50, average_cost: 2000 },  // $1,000
      ];

      const totalValue = stockItems.reduce(
        (sum, item) => sum + item.quantity_on_hand * item.average_cost,
        0
      );

      expect(totalValue).toBe(200000); // $2,000
    });

    it('should filter out zero quantity items', () => {
      const stockItems = [
        { quantity_on_hand: 100, average_cost: 1000 },
        { quantity_on_hand: 0, average_cost: 2000 },
        { quantity_on_hand: 50, average_cost: 1500 },
      ];

      const nonZeroItems = stockItems.filter((item) => item.quantity_on_hand > 0);

      expect(nonZeroItems.length).toBe(2);
    });
  });

  describe('Period Grouping', () => {
    it('should group data by month correctly', () => {
      const orders = [
        { order_date: '2026-01-15', total_amount: 10000 },
        { order_date: '2026-01-20', total_amount: 15000 },
        { order_date: '2026-02-10', total_amount: 20000 },
      ];

      const periodMap = new Map<string, { count: number; total: number }>();

      for (const order of orders) {
        const date = new Date(order.order_date);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const existing = periodMap.get(period) || { count: 0, total: 0 };
        periodMap.set(period, {
          count: existing.count + 1,
          total: existing.total + order.total_amount,
        });
      }

      expect(periodMap.get('2026-01')?.count).toBe(2);
      expect(periodMap.get('2026-01')?.total).toBe(25000);
      expect(periodMap.get('2026-02')?.count).toBe(1);
      expect(periodMap.get('2026-02')?.total).toBe(20000);
    });

    it('should calculate week number correctly', () => {
      function getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      }

      const date1 = new Date('2026-01-05');
      const date2 = new Date('2026-01-12');

      const week1 = getWeekNumber(date1);
      const week2 = getWeekNumber(date2);

      expect(week1).toBe(2); // Week 2 of 2026
      expect(week2).toBe(3); // Week 3 of 2026
    });
  });

  describe('Customer Aggregation', () => {
    it('should group sales by customer', () => {
      const orders = [
        { customer_id: 'cust1', customer_name: 'Customer A', total_amount: 10000 },
        { customer_id: 'cust1', customer_name: 'Customer A', total_amount: 15000 },
        { customer_id: 'cust2', customer_name: 'Customer B', total_amount: 20000 },
      ];

      const customerMap = new Map<string, { name: string; count: number; revenue: number }>();

      for (const order of orders) {
        const existing = customerMap.get(order.customer_id) || {
          name: order.customer_name,
          count: 0,
          revenue: 0,
        };

        customerMap.set(order.customer_id, {
          name: existing.name,
          count: existing.count + 1,
          revenue: existing.revenue + order.total_amount,
        });
      }

      expect(customerMap.get('cust1')?.count).toBe(2);
      expect(customerMap.get('cust1')?.revenue).toBe(25000);
      expect(customerMap.get('cust2')?.count).toBe(1);
      expect(customerMap.get('cust2')?.revenue).toBe(20000);
    });

    it('should calculate average order value', () => {
      const customer = {
        count: 5,
        revenue: 50000,
      };

      const averageOrderValue = Math.round(customer.revenue / customer.count);

      expect(averageOrderValue).toBe(10000); // $100 average
    });

    it('should sort customers by revenue descending', () => {
      const customers = [
        { customer_id: 'cust1', revenue: 15000 },
        { customer_id: 'cust2', revenue: 30000 },
        { customer_id: 'cust3', revenue: 20000 },
      ];

      const sorted = customers.sort((a, b) => b.revenue - a.revenue);

      expect(sorted[0].customer_id).toBe('cust2'); // Highest revenue
      expect(sorted[2].customer_id).toBe('cust1'); // Lowest revenue
    });
  });

  describe('Product Aggregation', () => {
    it('should group sales by product', () => {
      const lineItems = [
        { product_id: 'prod1', product_name: 'Product A', quantity_ordered: 10, line_total: 10000 },
        { product_id: 'prod1', product_name: 'Product A', quantity_ordered: 5, line_total: 5000 },
        { product_id: 'prod2', product_name: 'Product B', quantity_ordered: 20, line_total: 20000 },
      ];

      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

      for (const item of lineItems) {
        const existing = productMap.get(item.product_id) || {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };

        productMap.set(item.product_id, {
          name: existing.name,
          quantity: existing.quantity + item.quantity_ordered,
          revenue: existing.revenue + item.line_total,
        });
      }

      expect(productMap.get('prod1')?.quantity).toBe(15);
      expect(productMap.get('prod1')?.revenue).toBe(15000);
      expect(productMap.get('prod2')?.quantity).toBe(20);
      expect(productMap.get('prod2')?.revenue).toBe(20000);
    });
  });

  describe('Aged Receivables', () => {
    it('should calculate days overdue correctly', () => {
      const dueDate = new Date('2026-01-15');
      const today = new Date('2026-01-28');

      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysOverdue).toBe(13);
    });

    it('should assign correct aging bucket for 0-30 days', () => {
      const daysOverdue = 15;

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOverdue <= 30) agingBucket = '0-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      expect(agingBucket).toBe('0-30');
    });

    it('should assign correct aging bucket for 31-60 days', () => {
      const daysOverdue = 45;

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOverdue <= 30) agingBucket = '0-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      expect(agingBucket).toBe('31-60');
    });

    it('should assign correct aging bucket for 61-90 days', () => {
      const daysOverdue = 75;

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOverdue <= 30) agingBucket = '0-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      expect(agingBucket).toBe('61-90');
    });

    it('should assign correct aging bucket for 90+ days', () => {
      const daysOverdue = 120;

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOverdue <= 30) agingBucket = '0-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '90+';

      expect(agingBucket).toBe('90+');
    });

    it('should sort by days overdue descending', () => {
      const receivables = [
        { invoice_id: 'inv1', days_overdue: 30 },
        { invoice_id: 'inv2', days_overdue: 90 },
        { invoice_id: 'inv3', days_overdue: 45 },
      ];

      const sorted = receivables.sort((a, b) => b.days_overdue - a.days_overdue);

      expect(sorted[0].invoice_id).toBe('inv2'); // Most overdue
      expect(sorted[2].invoice_id).toBe('inv1'); // Least overdue
    });
  });

  describe('Payment Collection', () => {
    it('should calculate collection rate correctly', () => {
      const issued = 100000;
      const collected = 80000;

      const collectionRate = (collected / issued) * 100;

      expect(collectionRate).toBe(80);
    });

    it('should handle 100% collection rate', () => {
      const issued = 50000;
      const collected = 50000;

      const collectionRate = (collected / issued) * 100;

      expect(collectionRate).toBe(100);
    });

    it('should handle 0% collection rate', () => {
      const issued = 50000;
      const collected = 0;

      const collectionRate = (collected / issued) * 100;

      expect(collectionRate).toBe(0);
    });

    it('should handle no invoices issued', () => {
      const issued = 0;
      const collected = 0;

      const collectionRate = issued > 0 ? (collected / issued) * 100 : 0;

      expect(collectionRate).toBe(0);
    });

    it('should count paid vs unpaid invoices', () => {
      const invoices = [
        { payment_status: 'paid' },
        { payment_status: 'paid' },
        { payment_status: 'unpaid' },
        { payment_status: 'partial' },
        { payment_status: 'paid' },
      ];

      const paidCount = invoices.filter((inv) => inv.payment_status === 'paid').length;
      const issuedCount = invoices.length;

      expect(issuedCount).toBe(5);
      expect(paidCount).toBe(3);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter orders within date range', () => {
      const orders = [
        { order_date: '2026-01-10' },
        { order_date: '2026-01-15' },
        { order_date: '2026-01-20' },
        { order_date: '2026-02-05' },
      ];

      const startDate = '2026-01-15';
      const endDate = '2026-01-20';

      const filtered = orders.filter(
        (order) => order.order_date >= startDate && order.order_date <= endDate
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].order_date).toBe('2026-01-15');
      expect(filtered[1].order_date).toBe('2026-01-20');
    });

    it('should include boundary dates', () => {
      const orders = [
        { order_date: '2026-01-14' },
        { order_date: '2026-01-15' },
        { order_date: '2026-01-20' },
        { order_date: '2026-01-21' },
      ];

      const startDate = '2026-01-15';
      const endDate = '2026-01-20';

      const filtered = orders.filter(
        (order) => order.order_date >= startDate && order.order_date <= endDate
      );

      expect(filtered.length).toBe(2);
      expect(filtered).toContainEqual({ order_date: '2026-01-15' });
      expect(filtered).toContainEqual({ order_date: '2026-01-20' });
    });
  });

  describe('Stock Movement Reporting', () => {
    it('should show positive and negative quantities', () => {
      const movements = [
        { movement_type: 'purchase_receipt', quantity: 100 },
        { movement_type: 'sale', quantity: -50 },
        { movement_type: 'adjustment_increase', quantity: 10 },
        { movement_type: 'adjustment_decrease', quantity: -5 },
      ];

      const totalIncrease = movements
        .filter((m) => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0);

      const totalDecrease = movements
        .filter((m) => m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

      expect(totalIncrease).toBe(110);
      expect(totalDecrease).toBe(55);
    });

    it('should filter by movement type', () => {
      const movements = [
        { movement_type: 'purchase_receipt', quantity: 100 },
        { movement_type: 'sale', quantity: -50 },
        { movement_type: 'purchase_receipt', quantity: 75 },
        { movement_type: 'sale', quantity: -30 },
      ];

      const purchaseReceipts = movements.filter((m) => m.movement_type === 'purchase_receipt');
      const sales = movements.filter((m) => m.movement_type === 'sale');

      expect(purchaseReceipts.length).toBe(2);
      expect(sales.length).toBe(2);
    });
  });

  describe('Report Sorting', () => {
    it('should sort periods chronologically', () => {
      const periods = [
        { period: '2026-03' },
        { period: '2026-01' },
        { period: '2026-02' },
      ];

      const sorted = periods.sort((a, b) => a.period.localeCompare(b.period));

      expect(sorted[0].period).toBe('2026-01');
      expect(sorted[1].period).toBe('2026-02');
      expect(sorted[2].period).toBe('2026-03');
    });

    it('should sort by revenue descending', () => {
      const items = [
        { name: 'Item A', revenue: 15000 },
        { name: 'Item B', revenue: 30000 },
        { name: 'Item C', revenue: 20000 },
      ];

      const sorted = items.sort((a, b) => b.revenue - a.revenue);

      expect(sorted[0].name).toBe('Item B'); // Highest revenue
      expect(sorted[2].name).toBe('Item A'); // Lowest revenue
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data sets', () => {
      const emptyOrders: any[] = [];

      const periodMap = new Map<string, { count: number; total: number }>();

      for (const order of emptyOrders) {
        const period = order.order_date.substring(0, 7);
        const existing = periodMap.get(period) || { count: 0, total: 0 };
        periodMap.set(period, {
          count: existing.count + 1,
          total: existing.total + order.total_amount,
        });
      }

      expect(periodMap.size).toBe(0);
    });

    it('should handle zero division in averages', () => {
      const count = 0;
      const total = 0;

      const average = count > 0 ? Math.round(total / count) : 0;

      expect(average).toBe(0);
    });

    it('should handle very large values', () => {
      const orders = [
        { total_amount: 100000000 }, // $1,000,000
        { total_amount: 200000000 }, // $2,000,000
      ];

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

      expect(totalRevenue).toBe(300000000); // $3,000,000
    });
  });

  describe('Data Type Validation', () => {
    it('should handle date strings correctly', () => {
      const dateString = '2026-01-28';
      const date = new Date(dateString);

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January (0-indexed)
      expect(date.getDate()).toBe(28);
    });

    it('should handle currency cents correctly', () => {
      const cents = 12345;
      const dollars = cents / 100;

      expect(dollars).toBe(123.45);
      expect(dollars.toFixed(2)).toBe('123.45');
    });
  });
});
