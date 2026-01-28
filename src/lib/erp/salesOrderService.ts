/**
 * ERP Sales Order Service
 *
 * Handles sales order management and fulfillment:
 * - SO creation with line items
 * - Stock allocation and reservation
 * - SO workflow (draft → confirmed → picking → packed → shipped → delivered)
 * - Integration with inventory (stock allocation)
 * - Integration with invoicing (invoice generation)
 *
 * Related to: CCW-ERP/CRM Sales Management
 */

import { createClient } from '@/lib/supabase/server';
import * as inventoryService from './inventoryService';
import * as invoicingService from './invoicingService';

// ============================================================================
// Types
// ============================================================================

export type SOStatus = 'draft' | 'confirmed' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface SalesOrder {
  id: string;
  workspace_id: string;
  so_number: string;
  customer_id: string;
  warehouse_id: string;
  order_date: Date;
  requested_delivery_date?: Date;
  actual_delivery_date?: Date;
  subtotal: number; // Cents
  discount_amount: number; // Cents
  tax_amount: number; // Cents
  total_amount: number; // Cents
  status: SOStatus;
  payment_status: 'unpaid' | 'partial' | 'paid';
  invoice_id?: string;
  notes?: string;
}

export interface SOLineItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  line_number: number;
  quantity_ordered: number;
  quantity_allocated: number;
  quantity_shipped: number;
  unit_price: number; // Cents
  discount_percent: number;
  line_total: number; // Cents
  status: 'pending' | 'allocated' | 'partially_shipped' | 'shipped';
}

export interface CreateSOInput {
  workspace_id: string;
  customer_id: string;
  warehouse_id: string;
  order_date?: Date;
  requested_delivery_date?: Date;
  line_items: Array<{
    product_id: string;
    quantity_ordered: number;
    unit_price: number; // Cents
    discount_percent?: number;
  }>;
  discount_amount?: number;
  notes?: string;
  created_by: string;
}

export interface AllocateStockInput {
  workspace_id: string;
  sales_order_id: string;
  line_item_id: string;
  quantity: number;
}

export interface ShipOrderInput {
  workspace_id: string;
  sales_order_id: string;
  line_items: Array<{
    line_item_id: string;
    quantity_shipped: number;
  }>;
  tracking_number?: string;
  carrier?: string;
  shipped_by: string;
}

// ============================================================================
// Constants
// ============================================================================

export const TAX_RATE = 0.10; // 10% GST

// ============================================================================
// SO Number Generation
// ============================================================================

/**
 * Generate next SO number for workspace
 * Format: SO-YYYY-NNNN (e.g., SO-2026-0001)
 */
export async function generateSONumber(workspaceId: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  // Count existing SOs for this year
  const { count } = await supabase
    .from('erp_sales_orders')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('order_date', `${year}-01-01`)
    .lte('order_date', `${year}-12-31`);

  const nextNumber = (count || 0) + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `SO-${year}-${paddedNumber}`;
}

// ============================================================================
// SO Calculations
// ============================================================================

/**
 * Calculate line item totals
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  taxRate: number = TAX_RATE
): {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
} {
  const line_subtotal = Math.round(quantity * unitPrice);
  const line_discount = Math.round(line_subtotal * (discountPercent / 100));
  const taxable_amount = line_subtotal - line_discount;
  const line_tax = Math.round(taxable_amount * taxRate);
  const line_total = taxable_amount + line_tax;

  return {
    line_subtotal,
    line_discount,
    line_tax,
    line_total,
  };
}

/**
 * Calculate SO totals from line items
 */
export function calculateSOTotals(
  lineItems: Array<{
    quantity_ordered: number;
    unit_price: number;
    discount_percent?: number;
  }>,
  additionalDiscount: number = 0,
  taxRate: number = TAX_RATE
): {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
} {
  let subtotal = 0;
  let line_discount_total = 0;

  for (const item of lineItems) {
    const calculated = calculateLineItem(
      item.quantity_ordered,
      item.unit_price,
      item.discount_percent || 0,
      0 // Don't calculate tax per line, calculate on total
    );
    subtotal += calculated.line_subtotal;
    line_discount_total += calculated.line_discount;
  }

  const discount_amount = line_discount_total + additionalDiscount;
  const taxable_amount = subtotal - discount_amount;
  const tax_amount = Math.round(taxable_amount * taxRate);
  const total_amount = taxable_amount + tax_amount;

  return {
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Create sales order with line items
 */
export async function createSalesOrder(input: CreateSOInput): Promise<{
  sales_order: SalesOrder;
  line_items: SOLineItem[];
}> {
  const supabase = await createClient();

  // Validate customer exists
  const { data: customer, error: customerError } = await supabase
    .from('erp_customers')
    .select('id')
    .eq('workspace_id', input.workspace_id)
    .eq('id', input.customer_id)
    .single();

  if (customerError || !customer) {
    throw new Error('Customer not found');
  }

  // Validate warehouse exists
  const { data: warehouse, error: warehouseError } = await supabase
    .from('erp_warehouses')
    .select('id')
    .eq('workspace_id', input.workspace_id)
    .eq('id', input.warehouse_id)
    .single();

  if (warehouseError || !warehouse) {
    throw new Error('Warehouse not found');
  }

  // Generate SO number
  const so_number = await generateSONumber(input.workspace_id);

  // Calculate totals
  const totals = calculateSOTotals(input.line_items, input.discount_amount || 0);

  // Determine dates
  const order_date = input.order_date || new Date();

  // Create SO
  const { data: so, error: soError } = await supabase
    .from('erp_sales_orders')
    .insert({
      workspace_id: input.workspace_id,
      so_number,
      customer_id: input.customer_id,
      warehouse_id: input.warehouse_id,
      order_date: order_date.toISOString().split('T')[0],
      requested_delivery_date: input.requested_delivery_date
        ? input.requested_delivery_date.toISOString().split('T')[0]
        : null,
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      status: 'draft',
      payment_status: 'unpaid',
      notes: input.notes,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (soError) throw new Error(`Failed to create sales order: ${soError.message}`);

  // Create line items
  const lineItemsToInsert = input.line_items.map((item, index) => {
    const calculated = calculateLineItem(
      item.quantity_ordered,
      item.unit_price,
      item.discount_percent || 0
    );

    return {
      sales_order_id: so.id,
      product_id: item.product_id,
      line_number: index + 1,
      quantity_ordered: item.quantity_ordered,
      quantity_allocated: 0,
      quantity_shipped: 0,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
      line_total: calculated.line_total,
      status: 'pending',
    };
  });

  const { data: line_items, error: itemsError } = await supabase
    .from('erp_sales_order_items')
    .insert(lineItemsToInsert)
    .select();

  if (itemsError) throw new Error(`Failed to create line items: ${itemsError.message}`);

  return {
    sales_order: so as SalesOrder,
    line_items: (line_items || []) as SOLineItem[],
  };
}

/**
 * Get sales order by ID with line items
 */
export async function getSalesOrder(
  workspaceId: string,
  soId: string
): Promise<{ sales_order: SalesOrder; line_items: SOLineItem[] } | null> {
  const supabase = await createClient();

  const { data: so, error: soError } = await supabase
    .from('erp_sales_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', soId)
    .single();

  if (soError) {
    if (soError.code === 'PGRST116') return null;
    throw new Error(`Failed to get sales order: ${soError.message}`);
  }

  const { data: line_items, error: itemsError } = await supabase
    .from('erp_sales_order_items')
    .select('*')
    .eq('sales_order_id', soId)
    .order('line_number', { ascending: true });

  if (itemsError) throw new Error(`Failed to get line items: ${itemsError.message}`);

  return {
    sales_order: so as SalesOrder,
    line_items: (line_items || []) as SOLineItem[],
  };
}

/**
 * List sales orders with filters
 */
export async function listSalesOrders(
  workspaceId: string,
  filters?: {
    customer_id?: string;
    warehouse_id?: string;
    status?: SOStatus;
  }
): Promise<SalesOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_sales_orders')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters?.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('order_date', { ascending: false });

  if (error) throw new Error(`Failed to list sales orders: ${error.message}`);
  return (data as SalesOrder[]) || [];
}

/**
 * Update sales order status
 */
export async function updateSOStatus(
  workspaceId: string,
  soId: string,
  status: SOStatus
): Promise<SalesOrder> {
  const supabase = await createClient();

  const updates: any = { status };

  // If marking as delivered, set actual delivery date
  if (status === 'delivered') {
    updates.actual_delivery_date = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('erp_sales_orders')
    .update(updates)
    .eq('workspace_id', workspaceId)
    .eq('id', soId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update SO status: ${error.message}`);
  return data as SalesOrder;
}

/**
 * Allocate stock for sales order line item
 * Reserves stock without shipping
 */
export async function allocateStock(input: AllocateStockInput): Promise<{
  line_item: SOLineItem;
  stock_level: any;
}> {
  const supabase = await createClient();

  // Get SO and line item
  const soData = await getSalesOrder(input.workspace_id, input.sales_order_id);
  if (!soData) {
    throw new Error('Sales order not found');
  }

  const lineItem = soData.line_items.find((item) => item.id === input.line_item_id);
  if (!lineItem) {
    throw new Error('Line item not found');
  }

  // Validate quantity
  const remainingQuantity = lineItem.quantity_ordered - lineItem.quantity_allocated;
  if (input.quantity > remainingQuantity) {
    throw new Error(
      `Cannot allocate ${input.quantity} units. Only ${remainingQuantity} units remaining.`
    );
  }

  // Get stock level
  const stockLevel = await inventoryService.getOrCreateStockLevel(
    input.workspace_id,
    lineItem.product_id,
    soData.sales_order.warehouse_id
  );

  // Check if sufficient stock available
  if (input.quantity > stockLevel.quantity_available) {
    throw new Error(
      `Insufficient stock. Available: ${stockLevel.quantity_available}, Requested: ${input.quantity}`
    );
  }

  // Update stock level (increase allocated, decrease available)
  const { data: updatedStock, error: stockError } = await supabase
    .from('erp_stock_levels')
    .update({
      quantity_allocated: stockLevel.quantity_allocated + input.quantity,
      quantity_available: stockLevel.quantity_available - input.quantity,
    })
    .eq('id', stockLevel.id)
    .select()
    .single();

  if (stockError) throw new Error(`Failed to allocate stock: ${stockError.message}`);

  // Update line item
  const newQuantityAllocated = lineItem.quantity_allocated + input.quantity;
  const newStatus: SOLineItem['status'] =
    newQuantityAllocated >= lineItem.quantity_ordered ? 'allocated' : 'pending';

  const { data: updatedLineItem, error: lineItemError } = await supabase
    .from('erp_sales_order_items')
    .update({
      quantity_allocated: newQuantityAllocated,
      status: newStatus,
    })
    .eq('id', input.line_item_id)
    .select()
    .single();

  if (lineItemError) throw new Error(`Failed to update line item: ${lineItemError.message}`);

  // Update SO status if all items allocated
  const { data: allItems } = await supabase
    .from('erp_sales_order_items')
    .select('status')
    .eq('sales_order_id', input.sales_order_id);

  if (allItems && allItems.every((item) => item.status === 'allocated')) {
    await updateSOStatus(input.workspace_id, input.sales_order_id, 'confirmed');
  }

  return {
    line_item: updatedLineItem as SOLineItem,
    stock_level: updatedStock,
  };
}

/**
 * Ship sales order
 * Creates stock movements and updates quantities
 */
export async function shipOrder(input: ShipOrderInput): Promise<{
  sales_order: SalesOrder;
  stock_movements: any[];
}> {
  const supabase = await createClient();

  // Get SO
  const soData = await getSalesOrder(input.workspace_id, input.sales_order_id);
  if (!soData) {
    throw new Error('Sales order not found');
  }

  const stockMovements = [];

  // Process each line item
  for (const shipItem of input.line_items) {
    const lineItem = soData.line_items.find((item) => item.id === shipItem.line_item_id);
    if (!lineItem) {
      throw new Error(`Line item ${shipItem.line_item_id} not found`);
    }

    // Create stock movement (sale)
    const movementResult = await inventoryService.recordStockMovement({
      workspace_id: input.workspace_id,
      product_id: lineItem.product_id,
      warehouse_id: soData.sales_order.warehouse_id,
      movement_type: 'sale',
      quantity: -shipItem.quantity_shipped, // Negative for decrease
      reference_type: 'sales_order',
      reference_id: input.sales_order_id,
      reference_number: soData.sales_order.so_number,
      reason: `Sales Order: ${soData.sales_order.so_number}`,
      created_by: input.shipped_by,
    });

    stockMovements.push(movementResult.movement);

    // Update line item
    const newQuantityShipped = lineItem.quantity_shipped + shipItem.quantity_shipped;
    const newStatus: SOLineItem['status'] =
      newQuantityShipped >= lineItem.quantity_ordered ? 'shipped' : 'partially_shipped';

    await supabase
      .from('erp_sales_order_items')
      .update({
        quantity_shipped: newQuantityShipped,
        status: newStatus,
      })
      .eq('id', shipItem.line_item_id);
  }

  // Update SO status
  const { data: allItems } = await supabase
    .from('erp_sales_order_items')
    .select('status')
    .eq('sales_order_id', input.sales_order_id);

  let newSOStatus: SOStatus = soData.sales_order.status;
  if (allItems) {
    const allShipped = allItems.every((item) => item.status === 'shipped');
    const someShipped = allItems.some(
      (item) => item.status === 'shipped' || item.status === 'partially_shipped'
    );

    if (allShipped) {
      newSOStatus = 'shipped';
    } else if (someShipped) {
      newSOStatus = 'packed';
    }
  }

  const updatedSO = await updateSOStatus(input.workspace_id, input.sales_order_id, newSOStatus);

  return {
    sales_order: updatedSO,
    stock_movements: stockMovements,
  };
}

/**
 * Cancel sales order
 * Releases allocated stock
 */
export async function cancelSalesOrder(
  workspaceId: string,
  soId: string
): Promise<SalesOrder> {
  const supabase = await createClient();

  // Get SO
  const soData = await getSalesOrder(workspaceId, soId);
  if (!soData) {
    throw new Error('Sales order not found');
  }

  // Check if any stock has been shipped
  if (soData.line_items.some((item) => item.quantity_shipped > 0)) {
    throw new Error('Cannot cancel sales order with shipped items');
  }

  // Release allocated stock
  for (const lineItem of soData.line_items) {
    if (lineItem.quantity_allocated > 0) {
      const stockLevel = await inventoryService.getOrCreateStockLevel(
        workspaceId,
        lineItem.product_id,
        soData.sales_order.warehouse_id
      );

      await supabase
        .from('erp_stock_levels')
        .update({
          quantity_allocated: stockLevel.quantity_allocated - lineItem.quantity_allocated,
          quantity_available: stockLevel.quantity_available + lineItem.quantity_allocated,
        })
        .eq('id', stockLevel.id);
    }
  }

  return await updateSOStatus(workspaceId, soId, 'cancelled');
}
