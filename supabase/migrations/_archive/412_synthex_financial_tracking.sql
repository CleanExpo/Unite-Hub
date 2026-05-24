-- =============================================================================
-- Migration 412: Synthex Financial Tracking — Accounts & Transactions
-- =============================================================================

-- Transaction ledger
CREATE TABLE IF NOT EXISTS synthex_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,   -- subscription_charge, job_charge, refund, credit, adjustment
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'completed',  -- pending, completed, failed, refunded
  description TEXT,
  reference_id TEXT,                -- external ref (e.g. Stripe charge ID)
  reference_type TEXT,              -- stripe_charge, manual, system
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS synthex_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'draft',       -- draft, issued, paid, overdue, void
  plan_code TEXT,
  offer_tier TEXT,
  line_items JSONB DEFAULT '[]',
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Stripe/billing fields to synthex_tenants
ALTER TABLE synthex_tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_brand TEXT,
  ADD COLUMN IF NOT EXISTS next_invoice_date TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_txn_tenant ON synthex_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_txn_type ON synthex_transactions(tenant_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_synthex_txn_status ON synthex_transactions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_inv_tenant ON synthex_invoices(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_inv_status ON synthex_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_inv_number ON synthex_invoices(invoice_number);

-- RLS
ALTER TABLE synthex_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_txn" ON synthex_transactions;
CREATE POLICY "tenant_isolation_txn" ON synthex_transactions
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND TRUE);

DROP POLICY IF EXISTS "tenant_isolation_inv" ON synthex_invoices;
CREATE POLICY "tenant_isolation_inv" ON synthex_invoices
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND TRUE);
