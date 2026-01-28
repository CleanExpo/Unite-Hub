/**
 * ERP Reports Service
 *
 * Comprehensive reporting across all ERP modules:
 * - Inventory Reports (stock valuation, movements, low stock)
 * - Sales Reports (by period, customer, product)
 * - Purchase Reports (by period, supplier)
 * - Financial Reports (aged receivables, payment collection)
 *
 * Related to: CCW-ERP Reporting & Analytics
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

// Inventory Reports
export interface StockValuationItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  average_cost: number; // Cents
  total_value: number; // Cents
}

export interface StockMovementItem {
  movement_date: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  unit_cost: number; // Cents
  reference_number?: string;
  reason?: string;
}

// Sales Reports
export interface SalesByPeriodItem {
  period: string; // YYYY-MM for monthly, YYYY-Www for weekly
  order_count: number;
  total_revenue: number; // Cents
  total_cost: number; // Cents (if available)
  profit: number; // Cents
}

export interface SalesByCustomerItem {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_revenue: number; // Cents
  average_order_value: number; // Cents
}

export interface SalesByProductItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_sold: number;
  total_revenue: number; // Cents
}

// Purchase Reports
export interface PurchasesByPeriodItem {
  period: string;
  order_count: number;
  total_cost: number; // Cents
}

// Financial Reports
export interface AgedReceivableItem {
  customer_id: string;
  customer_name: string;
  invoice_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  days_overdue: number;
  total_amount: number; // Cents
  aging_bucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface PaymentCollectionItem {
  period: string;
  invoices_issued: number;
  invoices_paid: number;
  total_issued: number; // Cents
  total_collected: number; // Cents
  collection_rate: number; // Percentage
}

// ============================================================================
// Inventory Reports
// ============================================================================

/**
 * Stock Valuation Report
 * Shows current stock value across all warehouses
 */
export async function getStockValuationReport(
  workspaceId: string,
  warehouseId?: string
): Promise<StockValuationItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_stock_levels')
    .select(
      `
      product_id,
      warehouse_id,
      quantity_on_hand,
      average_cost,
      erp_products!inner(name, sku),
      erp_warehouses!inner(name)
    `
    )
    .eq('workspace_id', workspaceId)
    .gt('quantity_on_hand', 0);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  const { data, error } = await query.order('quantity_on_hand', { ascending: false });

  if (error) {
    console.error('Error fetching stock valuation:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    product_id: item.product_id,
    product_name: item.erp_products.name,
    product_sku: item.erp_products.sku,
    warehouse_id: item.warehouse_id,
    warehouse_name: item.erp_warehouses.name,
    quantity_on_hand: item.quantity_on_hand,
    average_cost: item.average_cost,
    total_value: item.quantity_on_hand * item.average_cost,
  }));
}

/**
 * Stock Movement Report
 * Shows all stock movements within date range
 */
export async function getStockMovementReport(
  workspaceId: string,
  dateRange: DateRange,
  warehouseId?: string,
  productId?: string
): Promise<StockMovementItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_stock_movements')
    .select(
      `
      movement_date,
      movement_type,
      quantity,
      unit_cost,
      reference_number,
      reason,
      erp_products!inner(name, sku),
      erp_warehouses!inner(name)
    `
    )
    .eq('workspace_id', workspaceId)
    .gte('movement_date', dateRange.start_date)
    .lte('movement_date', dateRange.end_date);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query.order('movement_date', { ascending: false });

  if (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    movement_date: item.movement_date,
    product_name: item.erp_products.name,
    product_sku: item.erp_products.sku,
    warehouse_name: item.erp_warehouses.name,
    movement_type: item.movement_type,
    quantity: item.quantity,
    unit_cost: item.unit_cost || 0,
    reference_number: item.reference_number,
    reason: item.reason,
  }));
}

// ============================================================================
// Sales Reports
// ============================================================================

/**
 * Sales by Period Report
 * Aggregates sales by month or week
 */
export async function getSalesByPeriodReport(
  workspaceId: string,
  dateRange: DateRange,
  periodType: 'month' | 'week' = 'month'
): Promise<SalesByPeriodItem[]> {
  const supabase = await createClient();

  const { data: salesOrders } = await supabase
    .from('erp_sales_orders')
    .select('order_date, total_amount, subtotal')
    .eq('workspace_id', workspaceId)
    .gte('order_date', dateRange.start_date)
    .lte('order_date', dateRange.end_date)
    .in('status', ['confirmed', 'picking', 'packed', 'shipped', 'delivered']);

  if (!salesOrders) return [];

  // Group by period
  const periodMap = new Map<string, { count: number; revenue: number }>();

  for (const so of salesOrders) {
    const date = new Date(so.order_date);
    let period: string;

    if (periodType === 'month') {
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Week number
      const week = getWeekNumber(date);
      period = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }

    const existing = periodMap.get(period) || { count: 0, revenue: 0 };
    periodMap.set(period, {
      count: existing.count + 1,
      revenue: existing.revenue + so.total_amount,
    });
  }

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      order_count: data.count,
      total_revenue: data.revenue,
      total_cost: 0, // Would need to calculate from COGS
      profit: data.revenue, // Simplified: revenue - cost
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Sales by Customer Report
 */
export async function getSalesByCustomerReport(
  workspaceId: string,
  dateRange: DateRange
): Promise<SalesByCustomerItem[]> {
  const supabase = await createClient();

  const { data: salesOrders } = await supabase
    .from('erp_sales_orders')
    .select(
      `
      customer_id,
      total_amount,
      erp_customers!inner(company_name, first_name, last_name)
    `
    )
    .eq('workspace_id', workspaceId)
    .gte('order_date', dateRange.start_date)
    .lte('order_date', dateRange.end_date)
    .in('status', ['confirmed', 'picking', 'packed', 'shipped', 'delivered']);

  if (!salesOrders) return [];

  // Group by customer
  const customerMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();

  for (const so of salesOrders as any[]) {
    const customerName =
      so.erp_customers.company_name ||
      `${so.erp_customers.first_name} ${so.erp_customers.last_name}`;

    const existing = customerMap.get(so.customer_id) || {
      name: customerName,
      count: 0,
      revenue: 0,
    };

    customerMap.set(so.customer_id, {
      name: existing.name,
      count: existing.count + 1,
      revenue: existing.revenue + so.total_amount,
    });
  }

  return Array.from(customerMap.entries())
    .map(([customerId, data]) => ({
      customer_id: customerId,
      customer_name: data.name,
      order_count: data.count,
      total_revenue: data.revenue,
      average_order_value: Math.round(data.revenue / data.count),
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}

/**
 * Sales by Product Report
 */
export async function getSalesByProductReport(
  workspaceId: string,
  dateRange: DateRange
): Promise<SalesByProductItem[]> {
  const supabase = await createClient();

  // Get sales orders in date range
  const { data: salesOrders } = await supabase
    .from('erp_sales_orders')
    .select('id')
    .eq('workspace_id', workspaceId)
    .gte('order_date', dateRange.start_date)
    .lte('order_date', dateRange.end_date)
    .in('status', ['confirmed', 'picking', 'packed', 'shipped', 'delivered']);

  if (!salesOrders || salesOrders.length === 0) return [];

  const orderIds = salesOrders.map((so) => so.id);

  // Get line items for these orders
  const { data: lineItems } = await supabase
    .from('erp_sales_order_items')
    .select(
      `
      product_id,
      quantity_ordered,
      line_total,
      erp_products!inner(name, sku)
    `
    )
    .in('sales_order_id', orderIds);

  if (!lineItems) return [];

  // Group by product
  const productMap = new Map<
    string,
    { name: string; sku: string; quantity: number; revenue: number }
  >();

  for (const item of lineItems as any[]) {
    const existing = productMap.get(item.product_id) || {
      name: item.erp_products.name,
      sku: item.erp_products.sku,
      quantity: 0,
      revenue: 0,
    };

    productMap.set(item.product_id, {
      name: existing.name,
      sku: existing.sku,
      quantity: existing.quantity + item.quantity_ordered,
      revenue: existing.revenue + item.line_total,
    });
  }

  return Array.from(productMap.entries())
    .map(([productId, data]) => ({
      product_id: productId,
      product_name: data.name,
      product_sku: data.sku,
      quantity_sold: data.quantity,
      total_revenue: data.revenue,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}

// ============================================================================
// Purchase Reports
// ============================================================================

/**
 * Purchases by Period Report
 */
export async function getPurchasesByPeriodReport(
  workspaceId: string,
  dateRange: DateRange,
  periodType: 'month' | 'week' = 'month'
): Promise<PurchasesByPeriodItem[]> {
  const supabase = await createClient();

  const { data: purchaseOrders } = await supabase
    .from('erp_purchase_orders')
    .select('order_date, total_amount')
    .eq('workspace_id', workspaceId)
    .gte('order_date', dateRange.start_date)
    .lte('order_date', dateRange.end_date);

  if (!purchaseOrders) return [];

  // Group by period
  const periodMap = new Map<string, { count: number; cost: number }>();

  for (const po of purchaseOrders) {
    const date = new Date(po.order_date);
    let period: string;

    if (periodType === 'month') {
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const week = getWeekNumber(date);
      period = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }

    const existing = periodMap.get(period) || { count: 0, cost: 0 };
    periodMap.set(period, {
      count: existing.count + 1,
      cost: existing.cost + po.total_amount,
    });
  }

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      order_count: data.count,
      total_cost: data.cost,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ============================================================================
// Financial Reports
// ============================================================================

/**
 * Aged Receivables Report
 * Shows overdue invoices by aging bucket
 */
export async function getAgedReceivablesReport(
  workspaceId: string
): Promise<AgedReceivableItem[]> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: invoices } = await supabase
    .from('erp_invoices')
    .select(
      `
      id,
      invoice_number,
      customer_id,
      issue_date,
      due_date,
      total_amount,
      payment_status,
      erp_customers!inner(company_name, first_name, last_name)
    `
    )
    .eq('workspace_id', workspaceId)
    .neq('payment_status', 'paid')
    .lt('due_date', today);

  if (!invoices) return [];

  return (invoices as any[]).map((inv) => {
    const dueDate = new Date(inv.due_date);
    const todayDate = new Date(today);
    const daysOverdue = Math.floor(
      (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let agingBucket: AgedReceivableItem['aging_bucket'];
    if (daysOverdue <= 30) agingBucket = '0-30';
    else if (daysOverdue <= 60) agingBucket = '31-60';
    else if (daysOverdue <= 90) agingBucket = '61-90';
    else agingBucket = '90+';

    const customerName =
      inv.erp_customers.company_name ||
      `${inv.erp_customers.first_name} ${inv.erp_customers.last_name}`;

    return {
      customer_id: inv.customer_id,
      customer_name: customerName,
      invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      days_overdue: daysOverdue,
      total_amount: inv.total_amount,
      aging_bucket: agingBucket,
    };
  }).sort((a, b) => b.days_overdue - a.days_overdue);
}

/**
 * Payment Collection Report
 * Shows invoice issuance and payment collection by period
 */
export async function getPaymentCollectionReport(
  workspaceId: string,
  dateRange: DateRange
): Promise<PaymentCollectionItem[]> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('erp_invoices')
    .select('issue_date, total_amount, payment_status')
    .eq('workspace_id', workspaceId)
    .gte('issue_date', dateRange.start_date)
    .lte('issue_date', dateRange.end_date);

  if (!invoices) return [];

  // Group by month
  const periodMap = new Map<
    string,
    { issued_count: number; paid_count: number; issued_amount: number; collected_amount: number }
  >();

  for (const inv of invoices) {
    const date = new Date(inv.issue_date);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = periodMap.get(period) || {
      issued_count: 0,
      paid_count: 0,
      issued_amount: 0,
      collected_amount: 0,
    };

    periodMap.set(period, {
      issued_count: existing.issued_count + 1,
      paid_count: existing.paid_count + (inv.payment_status === 'paid' ? 1 : 0),
      issued_amount: existing.issued_amount + inv.total_amount,
      collected_amount:
        existing.collected_amount + (inv.payment_status === 'paid' ? inv.total_amount : 0),
    });
  }

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      invoices_issued: data.issued_count,
      invoices_paid: data.paid_count,
      total_issued: data.issued_amount,
      total_collected: data.collected_amount,
      collection_rate:
        data.issued_amount > 0 ? (data.collected_amount / data.issued_amount) * 100 : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
