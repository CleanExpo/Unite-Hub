/**
 * ERP Purchase Order Service
 *
 * Handles purchase order management and stock receiving:
 * - PO creation with line items
 * - PO workflow (draft → submitted → confirmed → received)
 * - Stock receiving from POs
 * - Integration with inventory system
 *
 * Related to: UNI-172 [CCW-ERP/CRM] ERP — Inventory & Stock Management
 */

import { createClient } from '@/lib/supabase/server';
import * as inventoryService from './inventoryService';

// ============================================================================
// Types
// ============================================================================

export type POStatus = 'draft' | 'submitted' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  workspace_id: string;
  po_number: string;
  supplier_id: string;
  warehouse_id: string;
  order_date: Date;
  expected_delivery_date?: Date;
  received_date?: Date;
  subtotal: number; // Cents
  tax_amount: number; // Cents
  total_amount: number; // Cents
  status: POStatus;
  payment_terms_days: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
}

export interface POLineItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  line_number: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number; // Cents
  line_total: number; // Cents
  status: 'pending' | 'partially_received' | 'received' | 'cancelled';
}

export interface CreatePOInput {
  workspace_id: string;
  supplier_id: string;
  warehouse_id: string;
  order_date?: Date;
  expected_delivery_date?: Date;
  line_items: Array<{
    product_id: string;
    quantity_ordered: number;
    unit_cost: number; // Cents
  }>;
  payment_terms_days?: number;
  notes?: string;
  created_by: string;
}

export interface ReceiveStockInput {
  workspace_id: string;
  purchase_order_id: string;
  line_item_id: string;
  quantity_received: number;
  received_by: string;
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_PAYMENT_TERMS = 30; // Net 30 days
export const TAX_RATE = 0.10; // 10% GST

// ============================================================================
// PO Number Generation
// ============================================================================

/**
 * Generate next PO number for workspace
 * Format: PO-YYYY-NNNN (e.g., PO-2026-0001)
 */
export async function generatePONumber(workspaceId: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  // Count existing POs for this year
  const { count } = await supabase
    .from('erp_purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('order_date', `${year}-01-01`)
    .lte('order_date', `${year}-12-31`);

  const nextNumber = (count || 0) + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `PO-${year}-${paddedNumber}`;
}

// ============================================================================
// PO Calculations
// ============================================================================

/**
 * Calculate PO totals from line items
 */
export function calculatePOTotals(
  lineItems: Array<{ quantity_ordered: number; unit_cost: number }>,
  taxRate: number = TAX_RATE
): {
  subtotal: number;
  tax_amount: number;
  total_amount: number;
} {
  let subtotal = 0;

  for (const item of lineItems) {
    subtotal += item.quantity_ordered * item.unit_cost;
  }

  const tax_amount = Math.round(subtotal * taxRate);
  const total_amount = subtotal + tax_amount;

  return {
    subtotal,
    tax_amount,
    total_amount,
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Create purchase order with line items
 */
export async function createPurchaseOrder(input: CreatePOInput): Promise<{
  purchase_order: PurchaseOrder;
  line_items: POLineItem[];
}> {
  const supabase = await createClient();

  // Validate supplier exists
  const { data: supplier, error: supplierError } = await supabase
    .from('erp_customers')
    .select('id')
    .eq('workspace_id', input.workspace_id)
    .eq('id', input.supplier_id)
    .single();

  if (supplierError || !supplier) {
    throw new Error('Supplier not found');
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

  // Generate PO number
  const po_number = await generatePONumber(input.workspace_id);

  // Calculate totals
  const totals = calculatePOTotals(input.line_items);

  // Determine dates
  const order_date = input.order_date || new Date();
  const payment_terms_days = input.payment_terms_days || DEFAULT_PAYMENT_TERMS;

  // Create PO
  const { data: po, error: poError } = await supabase
    .from('erp_purchase_orders')
    .insert({
      workspace_id: input.workspace_id,
      po_number,
      supplier_id: input.supplier_id,
      warehouse_id: input.warehouse_id,
      order_date: order_date.toISOString().split('T')[0],
      expected_delivery_date: input.expected_delivery_date
        ? input.expected_delivery_date.toISOString().split('T')[0]
        : null,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      status: 'draft',
      payment_terms_days,
      payment_status: 'pending',
      notes: input.notes,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (poError) throw new Error(`Failed to create purchase order: ${poError.message}`);

  // Create line items
  const lineItemsToInsert = input.line_items.map((item, index) => ({
    purchase_order_id: po.id,
    product_id: item.product_id,
    line_number: index + 1,
    quantity_ordered: item.quantity_ordered,
    quantity_received: 0,
    unit_cost: item.unit_cost,
    line_total: item.quantity_ordered * item.unit_cost,
    status: 'pending',
  }));

  const { data: line_items, error: itemsError } = await supabase
    .from('erp_purchase_order_items')
    .insert(lineItemsToInsert)
    .select();

  if (itemsError) throw new Error(`Failed to create line items: ${itemsError.message}`);

  return {
    purchase_order: po as PurchaseOrder,
    line_items: (line_items || []) as POLineItem[],
  };
}

/**
 * Get purchase order by ID with line items
 */
export async function getPurchaseOrder(
  workspaceId: string,
  poId: string
): Promise<{ purchase_order: PurchaseOrder; line_items: POLineItem[] } | null> {
  const supabase = await createClient();

  const { data: po, error: poError } = await supabase
    .from('erp_purchase_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', poId)
    .single();

  if (poError) {
    if (poError.code === 'PGRST116') return null;
    throw new Error(`Failed to get purchase order: ${poError.message}`);
  }

  const { data: line_items, error: itemsError } = await supabase
    .from('erp_purchase_order_items')
    .select('*')
    .eq('purchase_order_id', poId)
    .order('line_number', { ascending: true });

  if (itemsError) throw new Error(`Failed to get line items: ${itemsError.message}`);

  return {
    purchase_order: po as PurchaseOrder,
    line_items: (line_items || []) as POLineItem[],
  };
}

/**
 * List purchase orders with filters
 */
export async function listPurchaseOrders(
  workspaceId: string,
  filters?: {
    supplier_id?: string;
    warehouse_id?: string;
    status?: POStatus;
  }
): Promise<PurchaseOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_purchase_orders')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }

  if (filters?.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('order_date', { ascending: false });

  if (error) throw new Error(`Failed to list purchase orders: ${error.message}`);
  return (data as PurchaseOrder[]) || [];
}

/**
 * Update purchase order status
 */
export async function updatePOStatus(
  workspaceId: string,
  poId: string,
  status: POStatus
): Promise<PurchaseOrder> {
  const supabase = await createClient();

  const updates: any = { status };

  // If marking as received, set received date
  if (status === 'received') {
    updates.received_date = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('erp_purchase_orders')
    .update(updates)
    .eq('workspace_id', workspaceId)
    .eq('id', poId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update PO status: ${error.message}`);
  return data as PurchaseOrder;
}

/**
 * Receive stock from purchase order line item
 * Creates stock movement and updates inventory
 */
export async function receiveStock(input: ReceiveStockInput): Promise<{
  line_item: POLineItem;
  stock_movement: any;
  stock_level: any;
}> {
  const supabase = await createClient();

  // Get PO and line item
  const poData = await getPurchaseOrder(input.workspace_id, input.purchase_order_id);
  if (!poData) {
    throw new Error('Purchase order not found');
  }

  const lineItem = poData.line_items.find((item) => item.id === input.line_item_id);
  if (!lineItem) {
    throw new Error('Line item not found');
  }

  // Validate quantity
  const remainingQuantity = lineItem.quantity_ordered - lineItem.quantity_received;
  if (input.quantity_received > remainingQuantity) {
    throw new Error(
      `Cannot receive ${input.quantity_received} units. Only ${remainingQuantity} units remaining.`
    );
  }

  // Create stock movement (purchase receipt)
  const movementResult = await inventoryService.recordStockMovement({
    workspace_id: input.workspace_id,
    product_id: lineItem.product_id,
    warehouse_id: poData.purchase_order.warehouse_id,
    movement_type: 'purchase_receipt',
    quantity: input.quantity_received,
    unit_cost: lineItem.unit_cost,
    reference_type: 'purchase_order',
    reference_id: input.purchase_order_id,
    reference_number: poData.purchase_order.po_number,
    reason: `PO Receipt: ${poData.purchase_order.po_number}`,
    notes: input.notes,
    created_by: input.received_by,
  });

  // Update line item
  const newQuantityReceived = lineItem.quantity_received + input.quantity_received;
  const newStatus: POLineItem['status'] =
    newQuantityReceived >= lineItem.quantity_ordered ? 'received' : 'partially_received';

  const { data: updatedLineItem, error: lineItemError } = await supabase
    .from('erp_purchase_order_items')
    .update({
      quantity_received: newQuantityReceived,
      status: newStatus,
    })
    .eq('id', input.line_item_id)
    .select()
    .single();

  if (lineItemError) throw new Error(`Failed to update line item: ${lineItemError.message}`);

  // Check if all line items are received
  const { data: allItems } = await supabase
    .from('erp_purchase_order_items')
    .select('status')
    .eq('purchase_order_id', input.purchase_order_id);

  if (allItems) {
    const allReceived = allItems.every((item) => item.status === 'received');
    const someReceived = allItems.some(
      (item) => item.status === 'received' || item.status === 'partially_received'
    );

    let poStatus: POStatus = poData.purchase_order.status;
    if (allReceived) {
      poStatus = 'received';
    } else if (someReceived) {
      poStatus = 'partially_received';
    }

    await updatePOStatus(input.workspace_id, input.purchase_order_id, poStatus);
  }

  return {
    line_item: updatedLineItem as POLineItem,
    stock_movement: movementResult.movement,
    stock_level: movementResult.stock_level,
  };
}

/**
 * Cancel purchase order
 * Can only cancel if no stock has been received
 */
export async function cancelPurchaseOrder(
  workspaceId: string,
  poId: string
): Promise<PurchaseOrder> {
  const supabase = await createClient();

  // Check if any stock has been received
  const { data: lineItems } = await supabase
    .from('erp_purchase_order_items')
    .select('quantity_received')
    .eq('purchase_order_id', poId);

  if (lineItems && lineItems.some((item) => item.quantity_received > 0)) {
    throw new Error('Cannot cancel purchase order with received stock');
  }

  return await updatePOStatus(workspaceId, poId, 'cancelled');
}
