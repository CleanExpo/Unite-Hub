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
--
-- PROFIT MARGIN TARGETS: 80%+ over 12 months
-- =====================================================
-- STARTER: $5,940/yr revenue → Max $1,188 cost (20%)
--   Setup/onboarding:     $100 (one-time)
--   AI (10K × 12 Haiku):  $120/yr ($0.01/1K tokens)
--   Emails (1K × 12):     $15/yr ($0.00125/email)
--   Infrastructure:       $120/yr ($10/mo)
--   Support (email):      $150/yr ($12.50/mo)
--   Storage (250MB):      $6/yr
--   ─────────────────────────────
--   TOTAL: $511/yr → 91.4% margin ✓
--
-- PRO: $10,740/yr revenue → Max $2,148 cost (20%)
--   Setup/onboarding:     $200 (one-time)
--   AI (75K × 12 Sonnet): $450/yr ($0.005/1K tokens avg)
--   Emails (5K × 12):     $75/yr ($0.00125/email)
--   Infrastructure:       $180/yr ($15/mo)
--   Support (priority):   $360/yr ($30/mo)
--   Storage (1GB):        $24/yr
--   ─────────────────────────────
--   TOTAL: $1,289/yr → 88.0% margin ✓
--
-- ELITE: $15,540/yr revenue → Max $3,108 cost (20%)
--   Setup/onboarding:     $400 (one-time)
--   AI (300K × 12 mixed): $1,080/yr ($0.003/1K tokens avg)
--   Emails (15K × 12):    $225/yr ($0.00125/email)
--   Infrastructure:       $300/yr ($25/mo)
--   Support (dedicated):  $600/yr ($50/mo)
--   Storage (5GB):        $60/yr
--   ─────────────────────────────
--   TOTAL: $2,665/yr → 82.8% margin ✓
-- =====================================================
INSERT INTO synthex_billing_plans (code, name, description, price_monthly, price_yearly, currency, limits, features, sort_order, metadata) VALUES
(
    'starter',
    'Starter',
    'For growing businesses and small teams',
    495,
    4950,
    'AUD',
    '{"ai_tokens": 10000, "ai_model": "haiku", "audits": 2, "contacts": 500, "seats": 1, "campaigns": 3, "content": 5, "emails_sent": 1000, "storage_mb": 250}',
    '["10,000 AI tokens/month", "2 website audits/month", "500 contacts", "1 team seat", "3 email campaigns", "1,000 emails/month", "Basic dashboard", "Email support"]',
    1,
    '{"gst_included": true, "min_contract_months": 3, "annual_revenue": 5940, "max_annual_cost": 1188, "actual_annual_cost": 511, "margin_pct": 91.4, "overage_ai_per_1k": 2.00, "overage_email_per_100": 0.50}'
),
(
    'pro',
    'Pro',
    'For established businesses with advanced needs',
    895,
    8950,
    'AUD',
    '{"ai_tokens": 75000, "ai_model": "sonnet", "audits": 8, "contacts": 2000, "seats": 3, "campaigns": 8, "content": 15, "emails_sent": 5000, "storage_mb": 1000}',
    '["75,000 AI tokens/month", "8 website audits/month", "2,000 contacts", "3 team seats", "8 campaigns", "5,000 emails/month", "Drip campaigns", "Priority support", "API access"]',
    2,
    '{"gst_included": true, "min_contract_months": 3, "popular": true, "annual_revenue": 10740, "max_annual_cost": 2148, "actual_annual_cost": 1289, "margin_pct": 88.0, "overage_ai_per_1k": 1.50, "overage_email_per_100": 0.40}'
),
(
    'elite',
    'Elite',
    'For agencies and high-volume businesses',
    1295,
    12950,
    'AUD',
    '{"ai_tokens": 300000, "ai_model": "opus", "audits": 30, "contacts": 7500, "seats": 8, "campaigns": 30, "content": 50, "emails_sent": 15000, "storage_mb": 5000}',
    '["300,000 AI tokens/month", "30 website audits/month", "7,500 contacts", "8 team seats", "30 campaigns", "15,000 emails/month", "Dedicated AI agent", "A/B testing", "White label", "Agency tools"]',
    3,
    '{"gst_included": true, "min_contract_months": 3, "annual_revenue": 15540, "max_annual_cost": 3108, "actual_annual_cost": 2665, "margin_pct": 82.8, "overage_ai_per_1k": 1.00, "overage_email_per_100": 0.30}'
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
