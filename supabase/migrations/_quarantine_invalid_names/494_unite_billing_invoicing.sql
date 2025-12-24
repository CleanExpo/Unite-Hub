-- =====================================================================
-- Phase D66: Billing & Invoicing Integration Layer
-- =====================================================================
-- Tables: unite_billing_providers, unite_invoices, unite_invoice_line_items, unite_payment_events
-- Enables multi-provider billing integration (Stripe, Xero, etc.) and invoice management
--
-- Migration: 494

DROP TABLE IF EXISTS unite_payment_events CASCADE;
DROP TABLE IF EXISTS unite_invoice_line_items CASCADE;
DROP TABLE IF EXISTS unite_invoices CASCADE;
DROP TABLE IF EXISTS unite_billing_providers CASCADE;

-- Billing Providers - payment gateway configuration
CREATE TABLE unite_billing_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'stripe',
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices - billing documents
CREATE TABLE unite_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  billing_provider_id uuid REFERENCES unite_billing_providers(id),
  external_invoice_id text,
  number text,
  status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'AUD',
  subtotal numeric(18,6) NOT NULL DEFAULT 0,
  tax numeric(18,6) NOT NULL DEFAULT 0,
  total numeric(18,6) NOT NULL DEFAULT 0,
  issue_date date,
  due_date date,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  canceled_at timestamptz
);

-- Invoice Line Items - itemized charges
CREATE TABLE unite_invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES unite_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(18,4) NOT NULL DEFAULT 1,
  unit_price numeric(18,6) NOT NULL,
  amount numeric(18,6) NOT NULL,
  metadata jsonb
);

-- Payment Events - webhook/sync log
CREATE TABLE unite_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid REFERENCES unite_invoices(id) ON DELETE SET NULL,
  billing_provider_id uuid REFERENCES unite_billing_providers(id),
  external_event_id text,
  event_type text NOT NULL,
  amount numeric(18,6),
  currency text,
  metadata jsonb,
  occurred_at timestamptz DEFAULT now(),
  ingested_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_unite_billing_providers_key ON unite_billing_providers(key);
CREATE INDEX idx_unite_invoices_tenant_issue_date ON unite_invoices(tenant_id, issue_date DESC);
CREATE INDEX idx_unite_invoices_tenant_status ON unite_invoices(tenant_id, status);
CREATE INDEX idx_unite_payment_events_tenant_occurred ON unite_payment_events(tenant_id, occurred_at DESC);

-- RLS Policies
ALTER TABLE unite_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_invoices
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_payment_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Helper Functions
CREATE OR REPLACE FUNCTION unite_get_billing_summary(p_tenant_id uuid, p_days integer DEFAULT 90)
RETURNS jsonb AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_invoiced', (
      SELECT COALESCE(SUM(total), 0)
      FROM unite_invoices
      WHERE tenant_id = p_tenant_id
        AND issue_date >= CURRENT_DATE - p_days
    ),
    'total_paid', (
      SELECT COALESCE(SUM(total), 0)
      FROM unite_invoices
      WHERE tenant_id = p_tenant_id
        AND status = 'paid'
        AND issue_date >= CURRENT_DATE - p_days
    ),
    'total_outstanding', (
      SELECT COALESCE(SUM(total), 0)
      FROM unite_invoices
      WHERE tenant_id = p_tenant_id
        AND status IN ('open', 'overdue')
        AND issue_date >= CURRENT_DATE - p_days
    ),
    'invoice_count', (
      SELECT COUNT(*)
      FROM unite_invoices
      WHERE tenant_id = p_tenant_id
        AND issue_date >= CURRENT_DATE - p_days
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;
