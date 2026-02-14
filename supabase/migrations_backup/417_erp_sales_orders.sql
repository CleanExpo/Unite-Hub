/**
 * Migration 417: ERP Sales Orders
 *
 * Complete sales order management system:
 * - Sales orders with line items
 * - Stock allocation and reservation
 * - Order fulfillment workflow
 * - Integration with inventory and invoicing
 *
 * Related to: CCW-ERP/CRM Sales Management
 */

-- ============================================================================
-- Sales Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- SO Details
  so_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES erp_customers(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES erp_warehouses(id) ON DELETE RESTRICT,

  -- Dates
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  requested_delivery_date date,
  actual_delivery_date date,

  -- Amounts (in cents)
  subtotal integer NOT NULL DEFAULT 0,
  discount_amount integer DEFAULT 0,
  tax_amount integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'confirmed', 'picking', 'packed', 'shipped', 'delivered', 'cancelled')
  ),

  -- Payment
  payment_status text DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'partial', 'paid')
  ),
  invoice_id uuid REFERENCES erp_invoices(id),

  -- Notes
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT erp_sales_orders_workspace_number UNIQUE (workspace_id, so_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_sales_orders_workspace ON erp_sales_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_orders_customer ON erp_sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_orders_warehouse ON erp_sales_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_orders_status ON erp_sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_sales_orders_order_date ON erp_sales_orders(order_date);

COMMENT ON TABLE erp_sales_orders IS 'Sales orders to customers';

-- ============================================================================
-- Sales Order Line Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES erp_sales_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES erp_products(id) ON DELETE RESTRICT,

  -- Line Details
  line_number integer NOT NULL,
  quantity_ordered integer NOT NULL,
  quantity_allocated integer DEFAULT 0, -- Reserved stock
  quantity_shipped integer DEFAULT 0,

  -- Pricing (in cents)
  unit_price integer NOT NULL,
  discount_percent decimal(5,2) DEFAULT 0,
  line_total integer NOT NULL,

  -- Status
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'allocated', 'partially_shipped', 'shipped')
  ),

  -- Metadata
  created_at timestamptz DEFAULT now(),

  CONSTRAINT erp_sales_order_items_so_line UNIQUE (sales_order_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_sales_order_items_so ON erp_sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_order_items_product ON erp_sales_order_items(product_id);

COMMENT ON TABLE erp_sales_order_items IS 'Line items on sales orders';
COMMENT ON COLUMN erp_sales_order_items.quantity_allocated IS 'Stock reserved but not shipped';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE erp_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sales_order_items ENABLE ROW LEVEL SECURITY;

-- Sales Orders Policies
CREATE POLICY "Users can view their workspace sales orders"
  ON erp_sales_orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage sales orders"
  ON erp_sales_orders FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Sales Order Items Policies (inherit from SO)
CREATE POLICY "Users can view SO items"
  ON erp_sales_order_items FOR SELECT
  USING (
    sales_order_id IN (
      SELECT id FROM erp_sales_orders
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can manage SO items"
  ON erp_sales_order_items FOR ALL
  USING (
    sales_order_id IN (
      SELECT id FROM erp_sales_orders
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

CREATE TRIGGER update_erp_sales_orders_updated_at
  BEFORE UPDATE ON erp_sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();
