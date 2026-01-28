/**
 * ERP Dashboard Service
 *
 * Aggregates data from all ERP modules:
 * - Invoicing (customers, invoices, payments)
 * - Inventory (products, warehouses, stock levels)
 * - Purchase Orders (supplier orders)
 * - Sales Orders (customer orders)
 *
 * Provides comprehensive business intelligence and alerts.
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface DashboardMetrics {
  // Customers & Products
  total_customers: number;
  total_products: number;
  total_warehouses: number;

  // Inventory
  total_inventory_value: number; // Cents
  low_stock_items: number;
  out_of_stock_items: number;

  // Sales
  total_sales_orders: number;
  pending_sales_orders: number;
  total_sales_value: number; // Cents
  monthly_sales_value: number; // Cents

  // Purchases
  total_purchase_orders: number;
  pending_purchase_orders: number;
  total_purchase_value: number; // Cents
  monthly_purchase_value: number; // Cents

  // Invoicing
  total_invoices: number;
  outstanding_invoices: number;
  outstanding_amount: number; // Cents
  overdue_invoices: number;
  overdue_amount: number; // Cents
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  reorder_point: number;
}

export interface PendingOrder {
  id: string;
  order_number: string;
  order_type: 'purchase' | 'sales';
  date: string;
  status: string;
  total_amount: number; // Cents
  customer_or_supplier?: string;
}

export interface RecentActivity {
  id: string;
  type: 'invoice' | 'payment' | 'stock_movement' | 'purchase_order' | 'sales_order';
  description: string;
  amount?: number; // Cents
  quantity?: number;
  date: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  low_stock_alerts: LowStockAlert[];
  pending_orders: PendingOrder[];
  recent_activity: RecentActivity[];
}

// ============================================================================
// Dashboard Metrics
// ============================================================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Customers count
  const { count: customersCount } = await supabase
    .from('erp_customers')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // Products count
  const { count: productsCount } = await supabase
    .from('erp_products')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // Warehouses count
  const { count: warehousesCount } = await supabase
    .from('erp_warehouses')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // Inventory value and stock alerts
  const { data: stockLevels } = await supabase
    .from('erp_stock_levels')
    .select('quantity_on_hand, average_cost, reorder_point')
    .eq('workspace_id', workspaceId);

  let inventoryValue = 0;
  let lowStockItems = 0;
  let outOfStockItems = 0;

  for (const stock of stockLevels || []) {
    inventoryValue += stock.quantity_on_hand * stock.average_cost;
    if (stock.quantity_on_hand === 0) {
      outOfStockItems++;
    } else if (stock.reorder_point && stock.quantity_on_hand <= stock.reorder_point) {
      lowStockItems++;
    }
  }

  // Sales Orders
  const { data: salesOrders } = await supabase
    .from('erp_sales_orders')
    .select('status, total_amount, order_date')
    .eq('workspace_id', workspaceId);

  const totalSalesOrders = salesOrders?.length || 0;
  const pendingSalesOrders =
    salesOrders?.filter(
      (so) =>
        so.status === 'draft' || so.status === 'confirmed' || so.status === 'picking'
    ).length || 0;
  const totalSalesValue = salesOrders?.reduce((sum, so) => sum + so.total_amount, 0) || 0;
  const monthlySalesValue =
    salesOrders
      ?.filter((so) => so.order_date?.startsWith(currentMonth))
      .reduce((sum, so) => sum + so.total_amount, 0) || 0;

  // Purchase Orders
  const { data: purchaseOrders } = await supabase
    .from('erp_purchase_orders')
    .select('status, total_amount, order_date')
    .eq('workspace_id', workspaceId);

  const totalPurchaseOrders = purchaseOrders?.length || 0;
  const pendingPurchaseOrders =
    purchaseOrders?.filter(
      (po) => po.status === 'draft' || po.status === 'submitted' || po.status === 'confirmed'
    ).length || 0;
  const totalPurchaseValue = purchaseOrders?.reduce((sum, po) => sum + po.total_amount, 0) || 0;
  const monthlyPurchaseValue =
    purchaseOrders
      ?.filter((po) => po.order_date?.startsWith(currentMonth))
      .reduce((sum, po) => sum + po.total_amount, 0) || 0;

  // Invoices
  const { data: invoices } = await supabase
    .from('erp_invoices')
    .select('payment_status, total_amount, due_date')
    .eq('workspace_id', workspaceId);

  const totalInvoices = invoices?.length || 0;
  const outstandingInvoices =
    invoices?.filter((inv) => inv.payment_status !== 'paid').length || 0;
  const outstandingAmount =
    invoices
      ?.filter((inv) => inv.payment_status !== 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices =
    invoices?.filter((inv) => inv.payment_status !== 'paid' && inv.due_date < today).length || 0;
  const overdueAmount =
    invoices
      ?.filter((inv) => inv.payment_status !== 'paid' && inv.due_date < today)
      .reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

  return {
    total_customers: customersCount || 0,
    total_products: productsCount || 0,
    total_warehouses: warehousesCount || 0,
    total_inventory_value: inventoryValue,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
    total_sales_orders: totalSalesOrders,
    pending_sales_orders: pendingSalesOrders,
    total_sales_value: totalSalesValue,
    monthly_sales_value: monthlySalesValue,
    total_purchase_orders: totalPurchaseOrders,
    pending_purchase_orders: pendingPurchaseOrders,
    total_purchase_value: totalPurchaseValue,
    monthly_purchase_value: monthlyPurchaseValue,
    total_invoices: totalInvoices,
    outstanding_invoices: outstandingInvoices,
    outstanding_amount: outstandingAmount,
    overdue_invoices: overdueInvoices,
    overdue_amount: overdueAmount,
  };
}

// ============================================================================
// Low Stock Alerts
// ============================================================================

/**
 * Get products below reorder point
 */
export async function getLowStockAlerts(
  workspaceId: string,
  limit: number = 20
): Promise<LowStockAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_stock_levels')
    .select(
      `
      product_id,
      warehouse_id,
      quantity_on_hand,
      reorder_point,
      erp_products!inner(name, sku),
      erp_warehouses!inner(name)
    `
    )
    .eq('workspace_id', workspaceId)
    .not('reorder_point', 'is', null)
    .order('quantity_on_hand', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching low stock alerts:', error);
    return [];
  }

  return (data || [])
    .filter((item: any) => item.quantity_on_hand <= (item.reorder_point || 0))
    .map((item: any) => ({
      product_id: item.product_id,
      product_name: item.erp_products.name,
      product_sku: item.erp_products.sku,
      warehouse_id: item.warehouse_id,
      warehouse_name: item.erp_warehouses.name,
      quantity_on_hand: item.quantity_on_hand,
      reorder_point: item.reorder_point,
    }));
}

// ============================================================================
// Pending Orders
// ============================================================================

/**
 * Get pending purchase and sales orders
 */
export async function getPendingOrders(
  workspaceId: string,
  limit: number = 10
): Promise<PendingOrder[]> {
  const supabase = await createClient();
  const pendingOrders: PendingOrder[] = [];

  // Pending Purchase Orders
  const { data: pos } = await supabase
    .from('erp_purchase_orders')
    .select('id, po_number, order_date, status, total_amount')
    .eq('workspace_id', workspaceId)
    .in('status', ['draft', 'submitted', 'confirmed'])
    .order('order_date', { ascending: false })
    .limit(limit);

  if (pos) {
    pendingOrders.push(
      ...pos.map((po) => ({
        id: po.id,
        order_number: po.po_number,
        order_type: 'purchase' as const,
        date: po.order_date,
        status: po.status,
        total_amount: po.total_amount,
      }))
    );
  }

  // Pending Sales Orders
  const { data: sos } = await supabase
    .from('erp_sales_orders')
    .select('id, so_number, order_date, status, total_amount')
    .eq('workspace_id', workspaceId)
    .in('status', ['draft', 'confirmed', 'picking'])
    .order('order_date', { ascending: false })
    .limit(limit);

  if (sos) {
    pendingOrders.push(
      ...sos.map((so) => ({
        id: so.id,
        order_number: so.so_number,
        order_type: 'sales' as const,
        date: so.order_date,
        status: so.status,
        total_amount: so.total_amount,
      }))
    );
  }

  // Sort by date and limit
  return pendingOrders
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ============================================================================
// Recent Activity
// ============================================================================

/**
 * Get recent activity across all ERP modules
 */
export async function getRecentActivity(
  workspaceId: string,
  limit: number = 20
): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const activities: RecentActivity[] = [];

  // Recent Invoices
  const { data: invoices } = await supabase
    .from('erp_invoices')
    .select('id, invoice_number, issue_date, total_amount')
    .eq('workspace_id', workspaceId)
    .order('issue_date', { ascending: false })
    .limit(5);

  if (invoices) {
    activities.push(
      ...invoices.map((inv) => ({
        id: inv.id,
        type: 'invoice' as const,
        description: `Invoice ${inv.invoice_number} issued`,
        amount: inv.total_amount,
        date: inv.issue_date,
      }))
    );
  }

  // Recent Stock Movements
  const { data: movements } = await supabase
    .from('erp_stock_movements')
    .select('id, movement_type, quantity, movement_date')
    .eq('workspace_id', workspaceId)
    .order('movement_date', { ascending: false })
    .limit(5);

  if (movements) {
    activities.push(
      ...movements.map((mov) => ({
        id: mov.id,
        type: 'stock_movement' as const,
        description: `Stock ${mov.movement_type}: ${mov.quantity} units`,
        quantity: mov.quantity,
        date: mov.movement_date,
      }))
    );
  }

  // Recent Purchase Orders
  const { data: pos } = await supabase
    .from('erp_purchase_orders')
    .select('id, po_number, order_date, total_amount')
    .eq('workspace_id', workspaceId)
    .order('order_date', { ascending: false })
    .limit(5);

  if (pos) {
    activities.push(
      ...pos.map((po) => ({
        id: po.id,
        type: 'purchase_order' as const,
        description: `Purchase Order ${po.po_number} created`,
        amount: po.total_amount,
        date: po.order_date,
      }))
    );
  }

  // Recent Sales Orders
  const { data: sos } = await supabase
    .from('erp_sales_orders')
    .select('id, so_number, order_date, total_amount')
    .eq('workspace_id', workspaceId)
    .order('order_date', { ascending: false })
    .limit(5);

  if (sos) {
    activities.push(
      ...sos.map((so) => ({
        id: so.id,
        type: 'sales_order' as const,
        description: `Sales Order ${so.so_number} created`,
        amount: so.total_amount,
        date: so.order_date,
      }))
    );
  }

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ============================================================================
// Complete Dashboard Data
// ============================================================================

/**
 * Get all dashboard data in one call
 */
export async function getDashboardData(workspaceId: string): Promise<DashboardData> {
  const [metrics, lowStockAlerts, pendingOrders, recentActivity] = await Promise.all([
    getDashboardMetrics(workspaceId),
    getLowStockAlerts(workspaceId, 10),
    getPendingOrders(workspaceId, 10),
    getRecentActivity(workspaceId, 15),
  ]);

  return {
    metrics,
    low_stock_alerts: lowStockAlerts,
    pending_orders: pendingOrders,
    recent_activity: recentActivity,
  };
}
