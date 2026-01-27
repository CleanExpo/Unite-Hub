/**
 * ERP Inventory Service
 *
 * Handles stock management and movements:
 * - Stock level tracking by warehouse
 * - Stock movements (receipts, sales, adjustments, transfers)
 * - Stock valuation (weighted average, FIFO)
 * - Low stock alerts
 * - Purchase order management
 *
 * Related to: UNI-172 [CCW-ERP/CRM] ERP — Inventory & Stock Management
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type MovementType =
  | 'purchase_receipt'
  | 'sale'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'transfer_out'
  | 'transfer_in'
  | 'return_from_customer'
  | 'return_to_supplier';

export type ValuationMethod = 'fifo' | 'lifo' | 'weighted_average' | 'specific_identification';
export type POStatus = 'draft' | 'submitted' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

export interface Product {
  id: string;
  workspace_id: string;
  sku: string;
  name: string;
  description?: string;
  cost_price?: number;
  sell_price?: number;
  track_inventory: boolean;
  reorder_level: number;
  reorder_quantity: number;
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface StockLevel {
  id: string;
  workspace_id: string;
  product_id: string;
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_allocated: number;
  quantity_available: number;
  valuation_method: ValuationMethod;
  average_cost: number; // Cents
  total_value: number; // Cents
}

export interface StockMovement {
  id: string;
  workspace_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  movement_date: Date;
  reason?: string;
  notes?: string;
}

export interface CreateMovementInput {
  workspace_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: MovementType;
  quantity: number; // Positive for increase, negative for decrease
  unit_cost?: number; // Required for receipts
  movement_date?: Date;
  reason?: string;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
}

export interface TransferStockInput {
  workspace_id: string;
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  workspace_id: string;
  po_number: string;
  supplier_id?: string;
  warehouse_id: string;
  order_date: Date;
  expected_delivery_date?: Date;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: POStatus;
}

// ============================================================================
// Stock Level Management
// ============================================================================

/**
 * Get or create stock level record for product/warehouse
 */
export async function getOrCreateStockLevel(
  workspaceId: string,
  productId: string,
  warehouseId: string
): Promise<StockLevel> {
  const supabase = await createClient();

  // Try to get existing
  const { data: existing, error: getError } = await supabase
    .from('erp_stock_levels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('product_id', productId)
    .eq('warehouse_id', warehouseId)
    .single();

  if (existing && !getError) {
    return existing as StockLevel;
  }

  // Create new if doesn't exist
  const { data: newLevel, error: createError } = await supabase
    .from('erp_stock_levels')
    .insert({
      workspace_id: workspaceId,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity_on_hand: 0,
      quantity_allocated: 0,
      quantity_available: 0,
      valuation_method: 'weighted_average',
      average_cost: 0,
      total_value: 0,
    })
    .select()
    .single();

  if (createError) throw new Error(`Failed to create stock level: ${createError.message}`);
  return newLevel as StockLevel;
}

/**
 * Update stock level quantities
 */
export async function updateStockLevel(
  workspaceId: string,
  productId: string,
  warehouseId: string,
  quantityChange: number,
  unitCost?: number
): Promise<StockLevel> {
  const supabase = await createClient();

  // Get current stock level
  const current = await getOrCreateStockLevel(workspaceId, productId, warehouseId);

  // Calculate new quantities
  const newOnHand = current.quantity_on_hand + quantityChange;
  const newAvailable = newOnHand - current.quantity_allocated;

  // Calculate new average cost (weighted average method)
  let newAverageCost = current.average_cost;
  let newTotalValue = current.total_value;

  if (unitCost !== undefined && quantityChange > 0) {
    // Receiving stock - update weighted average
    const currentValue = current.quantity_on_hand * current.average_cost;
    const addedValue = quantityChange * unitCost;
    const totalQuantity = current.quantity_on_hand + quantityChange;

    newAverageCost = totalQuantity > 0 ? Math.round((currentValue + addedValue) / totalQuantity) : 0;
    newTotalValue = newOnHand * newAverageCost;
  } else {
    // Selling/decreasing stock - use current average cost
    newTotalValue = newOnHand * newAverageCost;
  }

  // Update stock level
  const { data, error } = await supabase
    .from('erp_stock_levels')
    .update({
      quantity_on_hand: newOnHand,
      quantity_available: newAvailable,
      average_cost: newAverageCost,
      total_value: newTotalValue,
      last_movement_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update stock level: ${error.message}`);
  return data as StockLevel;
}

// ============================================================================
// Stock Movements
// ============================================================================

/**
 * Record stock movement and update stock levels
 */
export async function recordStockMovement(input: CreateMovementInput): Promise<{
  movement: StockMovement;
  stock_level: StockLevel;
}> {
  const supabase = await createClient();

  // Validate quantity sign based on movement type
  const increaseTypes: MovementType[] = ['purchase_receipt', 'adjustment_increase', 'transfer_in', 'return_from_customer'];
  const decreaseTypes: MovementType[] = ['sale', 'adjustment_decrease', 'transfer_out', 'return_to_supplier'];

  let quantityChange = input.quantity;

  if (decreaseTypes.includes(input.movement_type)) {
    quantityChange = -Math.abs(input.quantity); // Ensure negative
  } else if (increaseTypes.includes(input.movement_type)) {
    quantityChange = Math.abs(input.quantity); // Ensure positive
  }

  // Calculate cost
  const unitCost = input.unit_cost || 0;
  const totalCost = Math.abs(quantityChange) * unitCost;

  // Create movement record
  const { data: movement, error: movementError } = await supabase
    .from('erp_stock_movements')
    .insert({
      workspace_id: input.workspace_id,
      product_id: input.product_id,
      warehouse_id: input.warehouse_id,
      movement_type: input.movement_type,
      quantity: quantityChange,
      unit_cost: unitCost,
      total_cost: totalCost,
      movement_date: input.movement_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      reason: input.reason,
      notes: input.notes,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
      reference_number: input.reference_number,
    })
    .select()
    .single();

  if (movementError) throw new Error(`Failed to record movement: ${movementError.message}`);

  // Update stock level
  const stock_level = await updateStockLevel(
    input.workspace_id,
    input.product_id,
    input.warehouse_id,
    quantityChange,
    unitCost
  );

  return {
    movement: movement as StockMovement,
    stock_level,
  };
}

/**
 * Transfer stock between warehouses
 */
export async function transferStock(input: TransferStockInput): Promise<{
  transfer_out: StockMovement;
  transfer_in: StockMovement;
}> {
  const supabase = await createClient();

  // Validate sufficient stock in source warehouse
  const sourceStock = await getOrCreateStockLevel(
    input.workspace_id,
    input.product_id,
    input.from_warehouse_id
  );

  if (sourceStock.quantity_available < input.quantity) {
    throw new Error('Insufficient stock for transfer');
  }

  // Create transfer-out movement
  const transferOut = await recordStockMovement({
    workspace_id: input.workspace_id,
    product_id: input.product_id,
    warehouse_id: input.from_warehouse_id,
    movement_type: 'transfer_out',
    quantity: input.quantity,
    unit_cost: sourceStock.average_cost,
    reason: input.reason,
    notes: input.notes,
  });

  // Create transfer-in movement
  const transferIn = await recordStockMovement({
    workspace_id: input.workspace_id,
    product_id: input.product_id,
    warehouse_id: input.to_warehouse_id,
    movement_type: 'transfer_in',
    quantity: input.quantity,
    unit_cost: sourceStock.average_cost,
    reason: input.reason,
    notes: input.notes,
  });

  return {
    transfer_out: transferOut.movement,
    transfer_in: transferIn.movement,
  };
}

// ============================================================================
// Low Stock Alerts
// ============================================================================

/**
 * Get products below reorder level
 */
export async function getLowStockProducts(workspaceId: string): Promise<Array<{
  product: Product;
  stock_level: StockLevel;
  warehouse: Warehouse;
}>> {
  const supabase = await createClient();

  // Get all stock levels
  const { data: stockLevels, error: stockError } = await supabase
    .from('erp_stock_levels')
    .select(`
      *,
      product:erp_products(*),
      warehouse:erp_warehouses(*)
    `)
    .eq('workspace_id', workspaceId);

  if (stockError) throw new Error(`Failed to get stock levels: ${stockError.message}`);

  // Filter for low stock (available < reorder level)
  const lowStock = (stockLevels || [])
    .filter((level: any) => {
      const product = level.product;
      return product?.track_inventory && level.quantity_available < product.reorder_level;
    })
    .map((level: any) => ({
      product: level.product,
      stock_level: level,
      warehouse: level.warehouse,
    }));

  return lowStock;
}

// ============================================================================
// Product Management
// ============================================================================

/**
 * Create product
 */
export async function createProduct(
  workspaceId: string,
  product: Omit<Product, 'id' | 'workspace_id' | 'is_active'>
): Promise<Product> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_products')
    .insert({
      workspace_id: workspaceId,
      ...product,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create product: ${error.message}`);
  return data as Product;
}

/**
 * List products
 */
export async function listProducts(
  workspaceId: string,
  activeOnly: boolean = true
): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_products')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw new Error(`Failed to list products: ${error.message}`);
  return (data as Product[]) || [];
}

/**
 * Get product with total stock across all warehouses
 */
export async function getProductWithStock(
  workspaceId: string,
  productId: string
): Promise<{
  product: Product;
  total_on_hand: number;
  total_available: number;
  total_value: number;
  warehouse_stock: Array<{
    warehouse: Warehouse;
    stock_level: StockLevel;
  }>;
}> {
  const supabase = await createClient();

  // Get product
  const { data: product, error: productError } = await supabase
    .from('erp_products')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', productId)
    .single();

  if (productError) throw new Error(`Failed to get product: ${productError.message}`);

  // Get stock levels across all warehouses
  const { data: stockLevels, error: stockError } = await supabase
    .from('erp_stock_levels')
    .select(`
      *,
      warehouse:erp_warehouses(*)
    `)
    .eq('workspace_id', workspaceId)
    .eq('product_id', productId);

  if (stockError) throw new Error(`Failed to get stock levels: ${stockError.message}`);

  // Calculate totals
  let total_on_hand = 0;
  let total_available = 0;
  let total_value = 0;

  const warehouse_stock = (stockLevels || []).map((level: any) => {
    total_on_hand += level.quantity_on_hand;
    total_available += level.quantity_available;
    total_value += level.total_value;

    return {
      warehouse: level.warehouse,
      stock_level: level,
    };
  });

  return {
    product: product as Product,
    total_on_hand,
    total_available,
    total_value,
    warehouse_stock,
  };
}

// ============================================================================
// Warehouse Management
// ============================================================================

/**
 * Create warehouse
 */
export async function createWarehouse(
  workspaceId: string,
  warehouse: Omit<Warehouse, 'id' | 'workspace_id' | 'is_active'>
): Promise<Warehouse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_warehouses')
    .insert({
      workspace_id: workspaceId,
      ...warehouse,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create warehouse: ${error.message}`);
  return data as Warehouse;
}

/**
 * List warehouses
 */
export async function listWarehouses(
  workspaceId: string,
  activeOnly: boolean = true
): Promise<Warehouse[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_warehouses')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw new Error(`Failed to list warehouses: ${error.message}`);
  return (data as Warehouse[]) || [];
}

/**
 * Get default warehouse
 */
export async function getDefaultWarehouse(workspaceId: string): Promise<Warehouse | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_warehouses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get default warehouse: ${error.message}`);
  }

  return data as Warehouse;
}

// ============================================================================
// Stock Reporting
// ============================================================================

/**
 * Get stock movement history for product
 */
export async function getStockMovementHistory(
  workspaceId: string,
  productId: string,
  warehouseId?: string,
  fromDate?: Date,
  toDate?: Date
): Promise<StockMovement[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_stock_movements')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('product_id', productId);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  if (fromDate) {
    query = query.gte('movement_date', fromDate.toISOString().split('T')[0]);
  }

  if (toDate) {
    query = query.lte('movement_date', toDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('movement_date', { ascending: false });

  if (error) throw new Error(`Failed to get movement history: ${error.message}`);
  return (data as StockMovement[]) || [];
}

/**
 * Get inventory valuation report
 */
export async function getInventoryValuation(
  workspaceId: string,
  warehouseId?: string
): Promise<{
  total_value: number;
  total_units: number;
  warehouse_breakdown: Array<{
    warehouse_id: string;
    warehouse_name: string;
    total_value: number;
    total_units: number;
  }>;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_stock_levels')
    .select(`
      *,
      warehouse:erp_warehouses(id, name)
    `)
    .eq('workspace_id', workspaceId);

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get inventory valuation: ${error.message}`);

  const levels = data || [];

  // Calculate totals
  let total_value = 0;
  let total_units = 0;
  const warehouseMap = new Map<string, { name: string; value: number; units: number }>();

  for (const level of levels) {
    total_value += level.total_value;
    total_units += level.quantity_on_hand;

    const warehouse = (level as any).warehouse;
    const existing = warehouseMap.get(warehouse.id) || { name: warehouse.name, value: 0, units: 0 };
    existing.value += level.total_value;
    existing.units += level.quantity_on_hand;
    warehouseMap.set(warehouse.id, existing);
  }

  const warehouse_breakdown = Array.from(warehouseMap.entries()).map(([id, data]) => ({
    warehouse_id: id,
    warehouse_name: data.name,
    total_value: data.value,
    total_units: data.units,
  }));

  return {
    total_value,
    total_units,
    warehouse_breakdown,
  };
}
