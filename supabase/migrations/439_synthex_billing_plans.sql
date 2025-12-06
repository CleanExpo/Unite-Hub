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
-- TWO-PHASE MARGIN STRUCTURE:
--   Months 1-3:  40% margin (60% cost) - heavy onboarding
--   Months 4-12: 80% margin (20% cost) - standard ops
-- =====================================================
--
-- STARTER ($495/mo)
-- ─────────────────────────────────────────────────────
-- PHASE 1 (Months 1-3): Revenue $1,485 → Max cost $891 (60%)
--   Setup/onboarding:     $300
--   Training/handholding: $200
--   AI tokens (10K × 3):  $30
--   Emails (1K × 3):      $4
--   Infrastructure:       $30
--   Support (intensive):  $150
--   Total Phase 1:        $714 → 48% cost, 52% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $4,455 → Max cost $891 (20%)
--   AI tokens (10K × 9):  $90
--   Emails (1K × 9):      $11
--   Infrastructure:       $90
--   Support (standard):   $100
--   Storage:              $5
--   Total Phase 2:        $296 → 7% cost, 93% margin ✓
--
-- ANNUAL: $1,010 cost / $5,940 revenue → 83% blended margin ✓
-- ─────────────────────────────────────────────────────
--
-- PRO ($895/mo)
-- ─────────────────────────────────────────────────────
-- PHASE 1 (Months 1-3): Revenue $2,685 → Max cost $1,611 (60%)
--   Setup/onboarding:     $500
--   Training/strategy:    $350
--   AI tokens (75K × 3):  $113
--   Emails (5K × 3):      $19
--   Infrastructure:       $45
--   Support (intensive):  $300
--   Total Phase 1:        $1,327 → 49% cost, 51% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $8,055 → Max cost $1,611 (20%)
--   AI tokens (75K × 9):  $338
--   Emails (5K × 9):      $56
--   Infrastructure:       $135
--   Support (priority):   $200
--   Storage:              $18
--   Total Phase 2:        $747 → 9% cost, 91% margin ✓
--
-- ANNUAL: $2,074 cost / $10,740 revenue → 81% blended margin ✓
-- ─────────────────────────────────────────────────────
--
-- ELITE ($1,295/mo)
-- ─────────────────────────────────────────────────────
-- PHASE 1 (Months 1-3): Revenue $3,885 → Max cost $2,331 (60%)
--   Setup/onboarding:     $800
--   Training/strategy:    $500
--   AI tokens (300K × 3): $270
--   Emails (15K × 3):     $56
--   Infrastructure:       $75
--   Support (dedicated):  $450
--   Total Phase 1:        $2,151 → 55% cost, 45% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $11,655 → Max cost $2,331 (20%)
--   AI tokens (300K × 9): $810
--   Emails (15K × 9):     $169
--   Infrastructure:       $225
--   Support (dedicated):  $350
--   Storage:              $45
--   Total Phase 2:        $1,599 → 14% cost, 86% margin ✓
--
-- ANNUAL: $3,750 cost / $15,540 revenue → 76% blended margin
-- (Acceptable: Phase 1 is 45%, Phase 2 is 86%)
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
    '{"gst_included": true, "min_contract_months": 3, "onboarding_months": 3, "phase1_margin_pct": 52, "phase1_cost": 714, "phase2_margin_pct": 93, "phase2_cost": 296, "annual_cost": 1010, "annual_revenue": 5940, "blended_margin_pct": 83, "overage_ai_per_1k": 2.00, "overage_email_per_100": 0.50}'
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
    '{"gst_included": true, "min_contract_months": 3, "popular": true, "onboarding_months": 3, "phase1_margin_pct": 51, "phase1_cost": 1327, "phase2_margin_pct": 91, "phase2_cost": 747, "annual_cost": 2074, "annual_revenue": 10740, "blended_margin_pct": 81, "overage_ai_per_1k": 1.50, "overage_email_per_100": 0.40}'
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
    '{"gst_included": true, "min_contract_months": 3, "onboarding_months": 3, "phase1_margin_pct": 45, "phase1_cost": 2151, "phase2_margin_pct": 86, "phase2_cost": 1599, "annual_cost": 3750, "annual_revenue": 15540, "blended_margin_pct": 76, "overage_ai_per_1k": 1.00, "overage_email_per_100": 0.30}'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- =====================================================
-- Table: synthex_credit_packs
-- Purchasable credit packs (100% markup on cost)
-- =====================================================
DROP TABLE IF EXISTS synthex_credit_packs CASCADE;
DROP TABLE IF EXISTS synthex_credit_purchases CASCADE;

CREATE TABLE synthex_credit_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('ai_tokens', 'emails', 'audits', 'storage_mb', 'mixed')),
    quantity BIGINT NOT NULL,
    cost_aud NUMERIC(10,2) NOT NULL,
    price_aud NUMERIC(10,2) NOT NULL,
    markup_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_days INT DEFAULT 90,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_credit_packs IS 'Purchasable credit packs with 100% markup on cost';
COMMENT ON COLUMN synthex_credit_packs.cost_aud IS 'Our cost to deliver these credits';
COMMENT ON COLUMN synthex_credit_packs.price_aud IS 'Price charged to customer (cost × 2 for 100% markup)';
COMMENT ON COLUMN synthex_credit_packs.valid_days IS 'Days until credits expire (default 90)';

CREATE TABLE synthex_credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    pack_id UUID NOT NULL REFERENCES synthex_credit_packs(id),
    quantity_purchased BIGINT NOT NULL,
    quantity_remaining BIGINT NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'refunded')),
    external_payment_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_credit_purchases IS 'Record of credit pack purchases by tenants';

CREATE INDEX IF NOT EXISTS idx_synthex_credit_purchases_tenant ON synthex_credit_purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_credit_purchases_status ON synthex_credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_synthex_credit_purchases_expires ON synthex_credit_purchases(expires_at);

ALTER TABLE synthex_credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit packs visible to all"
    ON synthex_credit_packs FOR SELECT
    USING (is_active = true);

CREATE POLICY "Credit purchases visible to tenant"
    ON synthex_credit_purchases FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

GRANT SELECT ON synthex_credit_packs TO authenticated;
GRANT ALL ON synthex_credit_purchases TO authenticated;

-- =====================================================
-- Seed credit packs (100% markup = 2x cost)
-- =====================================================
-- AI TOKEN COSTS:
--   Haiku:  ~$0.25/1M input, $1.25/1M output → avg $0.75/1M
--   Sonnet: ~$3/1M input, $15/1M output → avg $9/1M
--   Opus:   ~$15/1M input, $75/1M output → avg $45/1M
-- EMAIL COST: ~$0.001/email (SendGrid)
-- AUDIT COST: ~$2/audit (AI + crawl)
-- =====================================================
INSERT INTO synthex_credit_packs (code, name, description, credit_type, quantity, cost_aud, price_aud, markup_pct, valid_days, metadata) VALUES
-- AI Token Packs (Haiku-tier pricing for broad use)
('ai_tokens_50k', '50K AI Tokens', 'Quick top-up for small projects', 'ai_tokens', 50000, 5, 10, 100, 90,
 '{"use_case": "small_project", "model_tier": "haiku"}'),
('ai_tokens_250k', '250K AI Tokens', 'Standard pack for medium projects', 'ai_tokens', 250000, 20, 40, 100, 90,
 '{"use_case": "medium_project", "model_tier": "mixed", "popular": true}'),
('ai_tokens_1m', '1M AI Tokens', 'Power pack for large campaigns', 'ai_tokens', 1000000, 70, 140, 100, 90,
 '{"use_case": "large_project", "model_tier": "mixed"}'),
('ai_tokens_5m', '5M AI Tokens', 'Enterprise pack for heavy usage', 'ai_tokens', 5000000, 300, 600, 100, 180,
 '{"use_case": "enterprise", "model_tier": "all", "extended_validity": true}'),

-- Email Packs
('emails_5k', '5,000 Emails', 'Small email campaign boost', 'emails', 5000, 5, 10, 100, 90,
 '{"use_case": "small_campaign"}'),
('emails_25k', '25,000 Emails', 'Medium campaign pack', 'emails', 25000, 20, 40, 100, 90,
 '{"use_case": "medium_campaign", "popular": true}'),
('emails_100k', '100,000 Emails', 'Large blast pack', 'emails', 100000, 75, 150, 100, 90,
 '{"use_case": "large_campaign"}'),

-- Audit Packs
('audits_5', '5 Website Audits', 'Quick audit bundle', 'audits', 5, 10, 20, 100, 90,
 '{"use_case": "spot_check"}'),
('audits_20', '20 Website Audits', 'Monthly audit pack', 'audits', 20, 35, 70, 100, 90,
 '{"use_case": "regular_monitoring", "popular": true}'),
('audits_50', '50 Website Audits', 'Agency audit bundle', 'audits', 50, 80, 160, 100, 180,
 '{"use_case": "agency", "extended_validity": true}'),

-- Mixed Bundles (best value)
('starter_boost', 'Starter Boost Bundle', '100K tokens + 5K emails + 5 audits', 'mixed', 1, 25, 49, 96, 90,
 '{"includes": {"ai_tokens": 100000, "emails": 5000, "audits": 5}, "savings_pct": 18}'),
('pro_boost', 'Pro Boost Bundle', '500K tokens + 25K emails + 20 audits', 'mixed', 1, 100, 199, 99, 90,
 '{"includes": {"ai_tokens": 500000, "emails": 25000, "audits": 20}, "savings_pct": 20, "popular": true}'),
('elite_boost', 'Elite Boost Bundle', '2M tokens + 100K emails + 50 audits', 'mixed', 1, 400, 799, 100, 180,
 '{"includes": {"ai_tokens": 2000000, "emails": 100000, "audits": 50}, "savings_pct": 15, "extended_validity": true}')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    credit_type = EXCLUDED.credit_type,
    quantity = EXCLUDED.quantity,
    cost_aud = EXCLUDED.cost_aud,
    price_aud = EXCLUDED.price_aud,
    markup_pct = EXCLUDED.markup_pct,
    valid_days = EXCLUDED.valid_days,
    metadata = EXCLUDED.metadata,
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
