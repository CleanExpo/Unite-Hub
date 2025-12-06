-- Migration 433: Synthex Invoicing & Payment Management
-- Phase B27: Billing, Invoicing & Subscription Engine
-- Created: 2025-12-06

-- =====================================================
-- SYNTHEX INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_invoices (
    invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES synthex_subscriptions(id) ON DELETE SET NULL,
    amount_cents integer NOT NULL CHECK (amount_cents >= 0),
    currency text NOT NULL DEFAULT 'usd',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'failed', 'cancelled')),
    stripe_invoice_id text,
    stripe_invoice_url text,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    paid_at timestamptz,
    line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for invoices
DROP INDEX IF EXISTS idx_synthex_invoices_tenant_id;
CREATE INDEX idx_synthex_invoices_tenant_id ON synthex_invoices(tenant_id);
DROP INDEX IF EXISTS idx_synthex_invoices_subscription_id;
CREATE INDEX idx_synthex_invoices_subscription_id ON synthex_invoices(subscription_id) WHERE subscription_id IS NOT NULL;
DROP INDEX IF EXISTS idx_synthex_invoices_status;
CREATE INDEX idx_synthex_invoices_status ON synthex_invoices(status);
DROP INDEX IF EXISTS idx_synthex_invoices_stripe_invoice;
CREATE INDEX idx_synthex_invoices_stripe_invoice ON synthex_invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
DROP INDEX IF EXISTS idx_synthex_invoices_period;
CREATE INDEX idx_synthex_invoices_period ON synthex_invoices(tenant_id, period_start, period_end);
DROP INDEX IF EXISTS idx_synthex_invoices_due_date;
CREATE INDEX idx_synthex_invoices_due_date ON synthex_invoices(due_date) WHERE status IN ('draft', 'pending');

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_invoices_updated_at ON synthex_invoices;
CREATE TRIGGER set_synthex_invoices_updated_at
    BEFORE UPDATE ON synthex_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('card', 'bank')),
    last_four text NOT NULL,
    brand text,
    is_default boolean NOT NULL DEFAULT false,
    stripe_payment_method_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for payment methods
DROP INDEX IF EXISTS idx_synthex_payment_methods_tenant_id;
CREATE INDEX idx_synthex_payment_methods_tenant_id ON synthex_payment_methods(tenant_id);
DROP INDEX IF EXISTS idx_synthex_payment_methods_default;
CREATE INDEX idx_synthex_payment_methods_default ON synthex_payment_methods(tenant_id, is_default) WHERE is_default = true;
DROP INDEX IF EXISTS idx_synthex_payment_methods_stripe;
CREATE UNIQUE INDEX idx_synthex_payment_methods_stripe ON synthex_payment_methods(stripe_payment_method_id);

-- =====================================================
-- SYNTHEX BILLING EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_billing_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for billing events
DROP INDEX IF EXISTS idx_synthex_billing_events_tenant_id;
CREATE INDEX idx_synthex_billing_events_tenant_id ON synthex_billing_events(tenant_id);
DROP INDEX IF EXISTS idx_synthex_billing_events_type;
CREATE INDEX idx_synthex_billing_events_type ON synthex_billing_events(event_type);
DROP INDEX IF EXISTS idx_synthex_billing_events_created;
CREATE INDEX idx_synthex_billing_events_created ON synthex_billing_events(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Synthex Invoices: Tenant isolation
ALTER TABLE synthex_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant invoices" ON synthex_invoices;
CREATE POLICY "Users can view their tenant invoices"
    ON synthex_invoices FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role can manage invoices" ON synthex_invoices;
CREATE POLICY "Service role can manage invoices"
    ON synthex_invoices FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Synthex Payment Methods: Tenant isolation
ALTER TABLE synthex_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant payment methods" ON synthex_payment_methods;
CREATE POLICY "Users can view their tenant payment methods"
    ON synthex_payment_methods FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage their tenant payment methods" ON synthex_payment_methods;
CREATE POLICY "Admins can manage their tenant payment methods"
    ON synthex_payment_methods FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Service role can manage payment methods" ON synthex_payment_methods;
CREATE POLICY "Service role can manage payment methods"
    ON synthex_payment_methods FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Synthex Billing Events: Tenant isolation
ALTER TABLE synthex_billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant billing events" ON synthex_billing_events;
CREATE POLICY "Users can view their tenant billing events"
    ON synthex_billing_events FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role can manage billing events" ON synthex_billing_events;
CREATE POLICY "Service role can manage billing events"
    ON synthex_billing_events FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Ensure only one default payment method per tenant
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If setting this payment method as default, unset others
    IF NEW.is_default = true THEN
        UPDATE synthex_payment_methods
        SET is_default = false
        WHERE tenant_id = NEW.tenant_id
          AND id != NEW.id
          AND is_default = true;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_default_payment_method ON synthex_payment_methods;
CREATE TRIGGER enforce_single_default_payment_method
    BEFORE INSERT OR UPDATE ON synthex_payment_methods
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function: Auto-update invoice status to 'paid' when paid_at is set
CREATE OR REPLACE FUNCTION auto_update_invoice_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- If paid_at is set and status is not already 'paid', update it
    IF NEW.paid_at IS NOT NULL AND NEW.status != 'paid' THEN
        NEW.status := 'paid';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_set_invoice_paid_status ON synthex_invoices;
CREATE TRIGGER auto_set_invoice_paid_status
    BEFORE INSERT OR UPDATE ON synthex_invoices
    FOR EACH ROW
    WHEN (NEW.paid_at IS NOT NULL)
    EXECUTE FUNCTION auto_update_invoice_status();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_invoices IS 'Synthex tenant invoices with Stripe integration';
COMMENT ON TABLE synthex_payment_methods IS 'Synthex tenant payment methods (cards, bank accounts)';
COMMENT ON TABLE synthex_billing_events IS 'Synthex billing event log for audit trail';
