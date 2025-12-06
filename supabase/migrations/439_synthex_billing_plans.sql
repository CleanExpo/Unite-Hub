-- =====================================================
-- Migration 439: Synthex Billing Plans & Usage Metering
-- Phase B33: Billing, Plans, and Usage Metering Engine
-- =====================================================
-- Flexible billing and subscription layer with metering
-- for AI tokens, emails, events, and other resources
-- =====================================================

-- Drop tables first (CASCADE handles policies and indexes)
DROP TABLE IF EXISTS synthex_invoices CASCADE;
DROP TABLE IF EXISTS synthex_usage_meters CASCADE;
DROP TABLE IF EXISTS synthex_subscriptions CASCADE;
DROP TABLE IF EXISTS synthex_billing_plans CASCADE;

-- =====================================================
-- Table: synthex_billing_plans
-- Available subscription plans with limits
-- =====================================================
CREATE TABLE synthex_billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    limits JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_billing_plans IS 'Available subscription plans with pricing and limits';
COMMENT ON COLUMN synthex_billing_plans.code IS 'Unique plan code (e.g., free, starter, professional, enterprise)';
COMMENT ON COLUMN synthex_billing_plans.limits IS 'JSON object with limit keys: ai_tokens, emails, contacts, campaigns, events, etc.';
COMMENT ON COLUMN synthex_billing_plans.features IS 'JSON array of feature strings included in this plan';

-- =====================================================
-- Table: synthex_subscriptions
-- Tenant subscriptions to plans
-- =====================================================
CREATE TABLE synthex_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES synthex_billing_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    external_customer_id TEXT,
    external_subscription_id TEXT,
    payment_method JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id)
);

COMMENT ON TABLE synthex_subscriptions IS 'Tenant subscription records linked to billing plans';
COMMENT ON COLUMN synthex_subscriptions.external_customer_id IS 'Stripe/provider customer ID';
COMMENT ON COLUMN synthex_subscriptions.external_subscription_id IS 'Stripe/provider subscription ID';

-- =====================================================
-- Table: synthex_usage_meters
-- Usage tracking per tenant per metric
-- =====================================================
CREATE TABLE synthex_usage_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric TEXT NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, metric, period_start)
);

COMMENT ON TABLE synthex_usage_meters IS 'Usage metering records per tenant per billing period';
COMMENT ON COLUMN synthex_usage_meters.metric IS 'Metric type: ai_tokens, emails_sent, contacts, campaigns, events, api_calls, etc.';
COMMENT ON COLUMN synthex_usage_meters.quantity IS 'Cumulative usage quantity for the period';

-- =====================================================
-- Table: synthex_invoices
-- Invoice history for tenants
-- =====================================================
CREATE TABLE synthex_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    subscription_id UUID REFERENCES synthex_subscriptions(id),
    invoice_number TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    external_invoice_id TEXT,
    line_items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_invoices IS 'Invoice records for tenant billing history';

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_subscriptions_tenant ON synthex_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_subscriptions_plan ON synthex_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_synthex_subscriptions_status ON synthex_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_synthex_usage_meters_tenant ON synthex_usage_meters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_usage_meters_metric ON synthex_usage_meters(metric);
CREATE INDEX IF NOT EXISTS idx_synthex_usage_meters_period ON synthex_usage_meters(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_synthex_invoices_tenant ON synthex_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_invoices_status ON synthex_invoices(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_invoices ENABLE ROW LEVEL SECURITY;

-- Plans: visible to all authenticated users (for plan selection UI)
CREATE POLICY "Plans visible to all"
    ON synthex_billing_plans FOR SELECT
    USING (is_active = true AND is_public = true);

-- Subscriptions: tenant isolation
CREATE POLICY "Subscriptions visible to tenant"
    ON synthex_subscriptions FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Usage meters: tenant isolation
CREATE POLICY "Usage meters visible to tenant"
    ON synthex_usage_meters FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoices: tenant isolation
CREATE POLICY "Invoices visible to tenant"
    ON synthex_invoices FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Seed default plans (AUD pricing, GST inclusive)
-- Minimum 3-month contract, Annual = 12 months for price of 10
-- =====================================================
INSERT INTO synthex_billing_plans (code, name, description, price_monthly, price_yearly, currency, limits, features, sort_order, metadata) VALUES
(
    'starter',
    'Starter',
    'For growing businesses and small teams',
    495,
    4950,
    'AUD',
    '{"ai_tokens": 20000, "audits": 2, "contacts": 500, "seats": 1, "campaigns": 5, "content": 10, "emails_sent": 2000}',
    '["20,000 AI tokens/month", "2 website audits/month", "500 contacts", "1 team seat", "5 email campaigns", "Basic AI workspace", "Email support", "Core dashboard"]',
    1,
    '{"gst_included": true, "min_contract_months": 3}'
),
(
    'pro',
    'Pro',
    'For established businesses with advanced needs',
    895,
    8950,
    'AUD',
    '{"ai_tokens": 250000, "audits": 20, "contacts": 5000, "seats": 3, "campaigns": -1, "content": -1, "emails_sent": 15000}',
    '["250,000 AI tokens/month", "20 website audits/month", "5,000 contacts", "3 team seats", "Unlimited campaigns", "Full NEXUS AI workspace", "Drip campaigns", "Priority support", "API access"]',
    2,
    '{"gst_included": true, "min_contract_months": 3, "popular": true}'
),
(
    'elite',
    'Elite',
    'For agencies and high-volume businesses',
    1295,
    12950,
    'AUD',
    '{"ai_tokens": 2000000, "audits": 100, "contacts": -1, "seats": 10, "campaigns": -1, "content": -1, "emails_sent": -1}',
    '["2,000,000 AI tokens/month", "100 website audits/month", "Unlimited contacts", "10 team seats", "Everything in Pro", "Dedicated AI agent", "Custom brand model", "A/B testing", "White label options", "Agency integration"]',
    3,
    '{"gst_included": true, "min_contract_months": 3}'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- =====================================================
-- Helper function: Get usage summary for a tenant
-- =====================================================
CREATE OR REPLACE FUNCTION get_tenant_usage_summary(
    p_tenant_id UUID,
    p_period_start TIMESTAMPTZ DEFAULT date_trunc('month', now())
)
RETURNS TABLE (
    metric TEXT,
    used BIGINT,
    limit_value BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    v_plan_limits JSONB;
BEGIN
    -- Get the tenant's current plan limits
    SELECT bp.limits INTO v_plan_limits
    FROM synthex_subscriptions s
    JOIN synthex_billing_plans bp ON bp.id = s.plan_id
    WHERE s.tenant_id = p_tenant_id AND s.status IN ('active', 'trialing');

    IF v_plan_limits IS NULL THEN
        v_plan_limits := '{}';
    END IF;

    RETURN QUERY
    SELECT
        um.metric,
        COALESCE(SUM(um.quantity), 0)::BIGINT AS used,
        COALESCE((v_plan_limits->um.metric)::BIGINT, -1) AS limit_value,
        CASE
            WHEN (v_plan_limits->um.metric)::BIGINT > 0 THEN
                ROUND((COALESCE(SUM(um.quantity), 0)::NUMERIC / (v_plan_limits->um.metric)::NUMERIC) * 100, 2)
            ELSE 0
        END AS percentage
    FROM synthex_usage_meters um
    WHERE um.tenant_id = p_tenant_id
      AND um.period_start >= p_period_start
    GROUP BY um.metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Record usage increment
-- =====================================================
CREATE OR REPLACE FUNCTION record_usage(
    p_tenant_id UUID,
    p_metric TEXT,
    p_quantity BIGINT,
    p_period_start TIMESTAMPTZ DEFAULT date_trunc('month', now())
)
RETURNS void AS $$
DECLARE
    v_period_end TIMESTAMPTZ;
BEGIN
    v_period_end := (p_period_start + interval '1 month')::TIMESTAMPTZ;

    INSERT INTO synthex_usage_meters (tenant_id, metric, quantity, period_start, period_end)
    VALUES (p_tenant_id, p_metric, p_quantity, p_period_start, v_period_end)
    ON CONFLICT (tenant_id, metric, period_start)
    DO UPDATE SET
        quantity = synthex_usage_meters.quantity + EXCLUDED.quantity,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_synthex_billing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_billing_plans_updated ON synthex_billing_plans;
CREATE TRIGGER trg_synthex_billing_plans_updated
    BEFORE UPDATE ON synthex_billing_plans
    FOR EACH ROW EXECUTE FUNCTION update_synthex_billing_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_subscriptions_updated ON synthex_subscriptions;
CREATE TRIGGER trg_synthex_subscriptions_updated
    BEFORE UPDATE ON synthex_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_synthex_billing_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_usage_meters_updated ON synthex_usage_meters;
CREATE TRIGGER trg_synthex_usage_meters_updated
    BEFORE UPDATE ON synthex_usage_meters
    FOR EACH ROW EXECUTE FUNCTION update_synthex_billing_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_invoices_updated ON synthex_invoices;
CREATE TRIGGER trg_synthex_invoices_updated
    BEFORE UPDATE ON synthex_invoices
    FOR EACH ROW EXECUTE FUNCTION update_synthex_billing_timestamp();

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT ON synthex_billing_plans TO authenticated;
GRANT ALL ON synthex_subscriptions TO authenticated;
GRANT ALL ON synthex_usage_meters TO authenticated;
GRANT ALL ON synthex_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_usage_summary(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage(UUID, TEXT, BIGINT, TIMESTAMPTZ) TO authenticated;
