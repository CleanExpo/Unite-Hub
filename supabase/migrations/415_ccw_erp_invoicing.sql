/**
 * Migration 415: CCW-ERP/CRM Invoicing & Financial Module
 *
 * ERP-style invoicing system:
 * - Customers (companies and individuals)
 * - Invoices with line items
 * - Payment tracking
 * - Tax calculations (GST)
 * - Invoice numbering
 * - Payment terms and due dates
 *
 * Related to: UNI-173 [CCW-ERP/CRM] Invoicing & Financial Module
 */

-- ============================================================================
-- Customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Customer Type
  customer_type text NOT NULL CHECK (customer_type IN ('individual', 'company')),

  -- Individual Details
  first_name text,
  last_name text,

  -- Company Details
  company_name text,
  abn text,
  acn text,

  -- Contact Information
  email text,
  phone text,
  mobile text,

  -- Billing Address
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_state text,
  billing_postcode text,
  billing_country text DEFAULT 'Australia',

  -- Shipping Address (optional)
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postcode text,
  shipping_country text DEFAULT 'Australia',

  -- Financial Details
  payment_terms_days integer DEFAULT 30, -- Net 30 default
  credit_limit integer, -- In cents
  current_balance integer DEFAULT 0, -- In cents (outstanding invoices)

  -- Tax Details
  tax_exempt boolean DEFAULT false,
  gst_registered boolean DEFAULT false,

  -- CRM Integration
  crm_contact_id uuid, -- Link to contacts table if exists

  -- Status
  is_active boolean DEFAULT true,
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT erp_customers_workspace_unique CHECK (
    (customer_type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (customer_type = 'company' AND company_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_erp_customers_workspace ON erp_customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_customers_type ON erp_customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_erp_customers_active ON erp_customers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_erp_customers_email ON erp_customers(email);
CREATE INDEX IF NOT EXISTS idx_erp_customers_abn ON erp_customers(abn) WHERE abn IS NOT NULL;

COMMENT ON TABLE erp_customers IS 'ERP customers (individuals and companies)';
COMMENT ON COLUMN erp_customers.payment_terms_days IS 'Default payment terms in days (e.g., 30 for Net 30)';
COMMENT ON COLUMN erp_customers.current_balance IS 'Outstanding invoice balance in cents';

-- ============================================================================
-- Invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES erp_customers(id) ON DELETE RESTRICT,

  -- Invoice Identification
  invoice_number text NOT NULL,
  reference text, -- PO number or customer reference

  -- Dates
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_date date,

  -- Amounts (in cents for precision)
  subtotal integer NOT NULL DEFAULT 0,
  tax_amount integer NOT NULL DEFAULT 0, -- GST (10%)
  discount_amount integer DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,

  -- Payment Status
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded')
  ),
  amount_paid integer DEFAULT 0, -- In cents
  amount_due integer NOT NULL DEFAULT 0, -- In cents (total - paid)

  -- Payment Terms
  payment_terms_days integer NOT NULL,
  payment_terms_text text, -- e.g., "Net 30", "Due on receipt"

  -- Tax Details
  tax_rate decimal(5,4) DEFAULT 0.1000, -- 10% GST
  tax_inclusive boolean DEFAULT false,

  -- Notes
  notes text,
  terms_and_conditions text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id),

  CONSTRAINT erp_invoices_workspace_number UNIQUE (workspace_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_invoices_workspace ON erp_invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoices_customer ON erp_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoices_status ON erp_invoices(status);
CREATE INDEX IF NOT EXISTS idx_erp_invoices_due_date ON erp_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_erp_invoices_invoice_date ON erp_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_erp_invoices_number ON erp_invoices(invoice_number);

COMMENT ON TABLE erp_invoices IS 'ERP invoices with line items';
COMMENT ON COLUMN erp_invoices.invoice_number IS 'Unique invoice number (e.g., INV-2026-001)';
COMMENT ON COLUMN erp_invoices.amount_due IS 'Remaining balance (total - paid)';

-- ============================================================================
-- Invoice Line Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES erp_invoices(id) ON DELETE CASCADE,

  -- Line Item Details
  line_number integer NOT NULL, -- 1, 2, 3, etc.
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit_price integer NOT NULL, -- In cents
  discount_percent decimal(5,2) DEFAULT 0,

  -- Calculated Amounts (in cents)
  line_subtotal integer NOT NULL, -- quantity * unit_price
  line_discount integer DEFAULT 0, -- discount amount
  line_tax integer NOT NULL, -- tax on (subtotal - discount)
  line_total integer NOT NULL, -- subtotal - discount + tax

  -- Product/Service Reference (optional)
  product_code text,
  product_category text,
  account_code text, -- Chart of accounts code

  -- Metadata
  created_at timestamptz DEFAULT now(),

  CONSTRAINT erp_invoice_line_items_invoice_line UNIQUE (invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_erp_invoice_line_items_invoice ON erp_invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_line_items_product ON erp_invoice_line_items(product_code) WHERE product_code IS NOT NULL;

COMMENT ON TABLE erp_invoice_line_items IS 'Individual line items on invoices';
COMMENT ON COLUMN erp_invoice_line_items.line_total IS 'Total for line: (quantity * unit_price - discount) + tax';

-- ============================================================================
-- Invoice Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES erp_invoices(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES erp_customers(id) ON DELETE CASCADE,

  -- Payment Details
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount integer NOT NULL, -- In cents
  payment_method text NOT NULL CHECK (
    payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'cheque', 'paypal', 'stripe', 'other')
  ),
  reference text, -- Transaction ID, cheque number, etc.

  -- Status
  status text NOT NULL DEFAULT 'completed' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),

  -- Notes
  notes text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  refunded_at timestamptz,
  refunded_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_erp_invoice_payments_workspace ON erp_invoice_payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_payments_invoice ON erp_invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_payments_customer ON erp_invoice_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_payments_date ON erp_invoice_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_erp_invoice_payments_status ON erp_invoice_payments(status);

COMMENT ON TABLE erp_invoice_payments IS 'Payments received against invoices';
COMMENT ON COLUMN erp_invoice_payments.reference IS 'External transaction reference (e.g., bank transfer ID)';

-- ============================================================================
-- Invoice Number Sequences
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_invoice_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Sequence Configuration
  prefix text NOT NULL DEFAULT 'INV',
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT erp_invoice_sequences_workspace_year UNIQUE (workspace_id, prefix, year)
);

CREATE INDEX IF NOT EXISTS idx_erp_invoice_sequences_workspace ON erp_invoice_sequences(workspace_id);

COMMENT ON TABLE erp_invoice_sequences IS 'Invoice number generation (e.g., INV-2026-001)';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE erp_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Customers Policies
CREATE POLICY "Users can view their workspace customers"
  ON erp_customers FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage customers"
  ON erp_customers FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Invoices Policies
CREATE POLICY "Users can view their workspace invoices"
  ON erp_invoices FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage invoices"
  ON erp_invoices FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Invoice Line Items Policies (inherit from invoice)
CREATE POLICY "Users can view line items"
  ON erp_invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM erp_invoices
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can manage line items"
  ON erp_invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM erp_invoices
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Invoice Payments Policies
CREATE POLICY "Users can view their workspace payments"
  ON erp_invoice_payments FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage payments"
  ON erp_invoice_payments FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Invoice Sequences Policies
CREATE POLICY "Users can view their workspace sequences"
  ON erp_invoice_sequences FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sequences"
  ON erp_invoice_sequences FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_erp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_erp_customers_updated_at
  BEFORE UPDATE ON erp_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();

CREATE TRIGGER update_erp_invoices_updated_at
  BEFORE UPDATE ON erp_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();

CREATE TRIGGER update_erp_invoice_sequences_updated_at
  BEFORE UPDATE ON erp_invoice_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_updated_at();
