/**
 * Migration 416: CCW-ERP/CRM Inventory & Stock Management
 *
 * Complete inventory management system:
 * - Products catalog with SKUs
 * - Warehouses/locations
 * - Stock levels by location
 * - Stock movements (receipts, adjustments, transfers)
 * - Purchase orders
 * - Stock valuation (FIFO, weighted average)
 *
 * Related to: UNI-172 [CCW-ERP/CRM] ERP — Inventory & Stock Management
 */

-- ============================================================================
-- Warehouses/Locations
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Warehouse Details
  code text NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postcode text,
  country text DEFAULT 'Australia',

  -- Contact
  manager_name text,
  phone text,
  email text,

  -- Status
  is_active boolean DEFAULT true,
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT erp_warehouses_workspace_code UNIQUE (workspace_id, code)
);

CREATE INDEX IF NOT EXISTS idx_erp_warehouses_workspace ON erp_warehouses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_warehouses_active ON erp_warehouses(is_active) WHERE is_active = true;

COMMENT ON TABLE erp_warehouses IS 'Warehouse/location management';

-- ============================================================================
-- Products
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Product Identification
  sku text NOT NULL,
  barcode text,
  name text NOT NULL,
  description text,

  -- Classification
  category text,
  brand text,
  supplier_code text,

  -- Pricing (in cents)
  cost_price integer, -- Purchase cost
  sell_price integer, -- Retail price
  wholesale_price integer,

  -- Inventory Settings
  track_inventory boolean DEFAULT true,
  stock_unit text DEFAULT 'unit', -- unit, kg, litre, metre, etc.
  reorder_level integer DEFAULT 10,
  reorder_quantity integer DEFAULT 50,

  -- Dimensions/Weight (for shipping)
  weight_kg decimal(10,3),
  length_cm decimal(10,2),
  width_cm decimal(10,2),
  height_cm decimal(10,2),

  -- Tax
  tax_rate decimal(5,4) DEFAULT 0.1000, -- 10% GST
  tax_exempt boolean DEFAULT false,

  -- Status
  is_active boolean DEFAULT true,
  discontinued_at timestamptz,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT erp_products_workspace_sku UNIQUE (workspace_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_erp_products_workspace ON erp_products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_products_sku ON erp_products(sku);
CREATE INDEX IF NOT EXISTS idx_erp_products_barcode ON erp_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_erp_products_category ON erp_products(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_erp_products_active ON erp_products(is_active) WHERE is_active = true;

COMMENT ON TABLE erp_products IS 'Product catalog with SKUs';
COMMENT ON COLUMN erp_products.sku IS 'Stock Keeping Unit (unique identifier)';
COMMENT ON COLUMN erp_products.reorder_level IS 'Minimum stock level before reorder';

-- ============================================================================
-- Stock Levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES erp_products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES erp_warehouses(id) ON DELETE CASCADE,

  -- Stock Quantities
  quantity_on_hand integer NOT NULL DEFAULT 0,
  quantity_allocated integer DEFAULT 0, -- Reserved for orders
  quantity_available integer NOT NULL DEFAULT 0, -- on_hand - allocated

  -- Stock Valuation
  valuation_method text DEFAULT 'weighted_average' CHECK (
    valuation_method IN ('fifo', 'lifo', 'weighted_average', 'specific_identification')
  ),
  average_cost integer DEFAULT 0, -- In cents
  total_value integer DEFAULT 0, -- In cents (quantity * average_cost)

  -- Metadata
  last_counted_at timestamptz,
  last_movement_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT erp_stock_levels_product_warehouse UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_erp_stock_levels_workspace ON erp_stock_levels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_levels_product ON erp_stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_levels_warehouse ON erp_stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_levels_low_stock ON erp_stock_levels(quantity_available)
  WHERE quantity_available < 10;

COMMENT ON TABLE erp_stock_levels IS 'Stock quantities by product and warehouse';
COMMENT ON COLUMN erp_stock_levels.quantity_available IS 'Available stock (on_hand - allocated)';
COMMENT ON COLUMN erp_stock_levels.average_cost IS 'Weighted average cost per unit in cents';

-- ============================================================================
-- Stock Movements
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES erp_products(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES erp_warehouses(id) ON DELETE RESTRICT,

  -- Movement Details
  movement_type text NOT NULL CHECK (
    movement_type IN (
      'purchase_receipt',    -- Stock coming in from supplier
      'sale',                -- Stock going out to customer
      'adjustment_increase', -- Manual increase (found stock, correction)
      'adjustment_decrease', -- Manual decrease (damage, theft, correction)
      'transfer_out',        -- Transfer to another warehouse
      'transfer_in',         -- Transfer from another warehouse
      'return_from_customer',-- Customer return (increase)
      'return_to_supplier'   -- Return to supplier (decrease)
    )
  ),
  quantity integer NOT NULL, -- Positive for increase, negative for decrease

  -- Cost Information (in cents)
  unit_cost integer, -- Cost per unit for this movement
  total_cost integer, -- quantity * unit_cost

  -- References
  reference_type text, -- 'purchase_order', 'sales_order', 'transfer', etc.
  reference_id uuid,
  reference_number text,

  -- Transfer Details (if transfer)
  from_warehouse_id uuid REFERENCES erp_warehouses(id),
  to_warehouse_id uuid REFERENCES erp_warehouses(id),

  -- Movement Date
  movement_date date NOT NULL DEFAULT CURRENT_DATE,

  -- Notes
  reason text,
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_workspace ON erp_stock_movements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_product ON erp_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_warehouse ON erp_stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_type ON erp_stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_date ON erp_stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_reference ON erp_stock_movements(reference_id)
  WHERE reference_id IS NOT NULL;

COMMENT ON TABLE erp_stock_movements IS 'All stock movements (receipts, sales, adjustments, transfers)';
COMMENT ON COLUMN erp_stock_movements.quantity IS 'Positive = increase, negative = decrease';

-- ============================================================================
-- Purchase Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- PO Details
  po_number text NOT NULL,
  supplier_id uuid REFERENCES erp_customers(id), -- Reuse customers table for suppliers
  warehouse_id uuid NOT NULL REFERENCES erp_warehouses(id),

  -- Dates
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  received_date date,

  -- Amounts (in cents)
  subtotal integer NOT NULL DEFAULT 0,
  tax_amount integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'confirmed', 'partially_received', 'received', 'cancelled')
  ),

  -- Payment
  payment_terms_days integer DEFAULT 30,
  payment_status text DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'partial', 'paid')
  ),

  -- Notes
  notes text,
  terms_and_conditions text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT erp_purchase_orders_workspace_number UNIQUE (workspace_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_purchase_orders_workspace ON erp_purchase_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_purchase_orders_supplier ON erp_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_erp_purchase_orders_status ON erp_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_purchase_orders_order_date ON erp_purchase_orders(order_date);

COMMENT ON TABLE erp_purchase_orders IS 'Purchase orders to suppliers';

-- ============================================================================
-- Purchase Order Line Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES erp_purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES erp_products(id) ON DELETE RESTRICT,

  -- Line Details
  line_number integer NOT NULL,
  quantity_ordered integer NOT NULL,
  quantity_received integer DEFAULT 0,

  -- Pricing (in cents)
  unit_cost integer NOT NULL,
  line_total integer NOT NULL,

  -- Status
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'partially_received', 'received', 'cancelled')
  ),

  -- Metadata
  created_at timestamptz DEFAULT now(),

  CONSTRAINT erp_purchase_order_items_po_line UNIQUE (purchase_order_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_purchase_order_items_po ON erp_purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_erp_purchase_order_items_product ON erp_purchase_order_items(product_id);

COMMENT ON TABLE erp_purchase_order_items IS 'Line items on purchase orders';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE erp_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Warehouses Policies
CREATE POLICY "Users can view their workspace warehouses"
  ON erp_warehouses FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage warehouses"
  ON erp_warehouses FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Products Policies
CREATE POLICY "Users can view their workspace products"
  ON erp_products FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage products"
  ON erp_products FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Stock Levels Policies
CREATE POLICY "Users can view their workspace stock levels"
  ON erp_stock_levels FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage stock levels"
  ON erp_stock_levels FOR ALL
  USING (true)
  WITH CHECK (true);

-- Stock Movements Policies
CREATE POLICY "Users can view their workspace stock movements"
  ON erp_stock_movements FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create stock movements"
  ON erp_stock_movements FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Purchase Orders Policies
CREATE POLICY "Users can view their workspace purchase orders"
  ON erp_purchase_orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage purchase orders"
  ON erp_purchase_orders FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Purchase Order Items Policies (inherit from PO)
CREATE POLICY "Users can view PO items"
  ON erp_purchase_order_items FOR SELECT
  USING (
    purchase_order_id IN (
      SELECT id FROM erp_purchase_orders
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can manage PO items"
  ON erp_purchase_order_items FOR ALL
  USING (
    purchase_order_id IN (
      SELECT id FROM erp_purchase_orders
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

CREATE TRIGGER update_erp_warehouses_updated_at
  BEFORE UPDATE ON erp_warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();

CREATE TRIGGER update_erp_products_updated_at
  BEFORE UPDATE ON erp_products
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();

CREATE TRIGGER update_erp_stock_levels_updated_at
  BEFORE UPDATE ON erp_stock_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();

CREATE TRIGGER update_erp_purchase_orders_updated_at
  BEFORE UPDATE ON erp_purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();
