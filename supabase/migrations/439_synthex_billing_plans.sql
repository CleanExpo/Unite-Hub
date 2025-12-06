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
--   Months 4-12: 60%+ margin (40% cost) - standard ops
--   MINIMUM TARGET: 60% annual blended margin
--
-- *** COMPLETE API COST BREAKDOWN (ALL SERVICES) ***
-- =====================================================
--
-- STARTER ($495/mo = ~$330 USD)
-- ─────────────────────────────────────────────────────
-- MONTHLY OPERATIONAL COSTS:
--   Anthropic LLM (10K tokens):     $10/mo
--   Perplexity SEO Search:          $2/mo
--   DataForSEO (keywords/SERP):     $5/mo
--   Gemini Images (5 images):       $3/mo
--   SendGrid Emails (1K):           $1/mo
--   Supabase DB (share):            $3/mo
--   Vercel Hosting (share):         $2/mo
--   Stripe Fees (2.9% of $495):     $14/mo
--   Support/Overhead:               $15/mo
--   ───────────────────────────────
--   MONTHLY OPS TOTAL:              $55/mo
--
-- PHASE 1 (Months 1-3): Revenue $1,485
--   Onboarding/setup:    $300 (one-time)
--   Training:            $200 (one-time)
--   Ops costs (3mo):     $165
--   Total Phase 1:       $665 → 45% cost, 55% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $4,455
--   Ops costs (9mo):     $495
--   Total Phase 2:       $495 → 11% cost, 89% margin ✓
--
-- ANNUAL: $1,160 cost / $5,940 revenue → 80.5% margin ✓
-- ─────────────────────────────────────────────────────
--
-- PRO ($895/mo = ~$600 USD)
-- ─────────────────────────────────────────────────────
-- MONTHLY OPERATIONAL COSTS:
--   Anthropic LLM (75K tokens):     $45/mo
--   Perplexity SEO Search:          $8/mo
--   DataForSEO (full suite):        $20/mo
--   Gemini Images (20 images):      $15/mo
--   SendGrid Emails (5K):           $6/mo
--   Supabase DB (share):            $5/mo
--   Vercel Hosting (share):         $3/mo
--   Stripe Fees (2.9% of $895):     $26/mo
--   Support/Overhead:               $35/mo
--   ───────────────────────────────
--   MONTHLY OPS TOTAL:              $163/mo
--
-- PHASE 1 (Months 1-3): Revenue $2,685
--   Onboarding/setup:    $500 (one-time)
--   Strategy sessions:   $350 (one-time)
--   Ops costs (3mo):     $489
--   Total Phase 1:       $1,339 → 50% cost, 50% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $8,055
--   Ops costs (9mo):     $1,467
--   Total Phase 2:       $1,467 → 18% cost, 82% margin ✓
--
-- ANNUAL: $2,806 cost / $10,740 revenue → 73.9% margin ✓
-- ─────────────────────────────────────────────────────
--
-- ELITE ($1,295/mo = ~$865 USD)
-- ─────────────────────────────────────────────────────
-- MONTHLY OPERATIONAL COSTS:
--   Anthropic LLM (300K tokens):    $120/mo
--   Perplexity SEO Search:          $25/mo
--   DataForSEO (enterprise):        $60/mo
--   Gemini Images (50 images):      $40/mo
--   SendGrid Emails (15K):          $19/mo
--   Supabase DB (share):            $10/mo
--   Vercel Hosting (share):         $5/mo
--   Stripe Fees (2.9% of $1295):    $38/mo
--   Support/Overhead:               $70/mo
--   ───────────────────────────────
--   MONTHLY OPS TOTAL:              $387/mo
--
-- PHASE 1 (Months 1-3): Revenue $3,885
--   Onboarding/setup:    $800 (one-time)
--   Strategy sessions:   $500 (one-time)
--   Ops costs (3mo):     $1,161
--   Total Phase 1:       $2,461 → 63% cost, 37% margin ✓
--
-- PHASE 2 (Months 4-12): Revenue $11,655
--   Ops costs (9mo):     $3,483
--   Total Phase 2:       $3,483 → 30% cost, 70% margin ✓
--
-- ANNUAL: $5,944 cost / $15,540 revenue → 61.7% margin ✓
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
    '{"gst_included": true, "min_contract_months": 3, "min_margin_pct": 60, "monthly_ops_cost": 55, "phase1_cost": 665, "phase1_margin_pct": 55, "phase2_cost": 495, "phase2_margin_pct": 89, "annual_cost": 1160, "annual_revenue": 5940, "blended_margin_pct": 80.5, "cost_breakdown": {"anthropic": 10, "perplexity": 2, "dataforseo": 5, "gemini": 3, "sendgrid": 1, "supabase": 3, "vercel": 2, "stripe": 14, "support": 15}}'
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
    '{"gst_included": true, "min_contract_months": 3, "popular": true, "min_margin_pct": 60, "monthly_ops_cost": 163, "phase1_cost": 1339, "phase1_margin_pct": 50, "phase2_cost": 1467, "phase2_margin_pct": 82, "annual_cost": 2806, "annual_revenue": 10740, "blended_margin_pct": 73.9, "cost_breakdown": {"anthropic": 45, "perplexity": 8, "dataforseo": 20, "gemini": 15, "sendgrid": 6, "supabase": 5, "vercel": 3, "stripe": 26, "support": 35}}'
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
    '{"gst_included": true, "min_contract_months": 3, "min_margin_pct": 60, "monthly_ops_cost": 387, "phase1_cost": 2461, "phase1_margin_pct": 37, "phase2_cost": 3483, "phase2_margin_pct": 70, "annual_cost": 5944, "annual_revenue": 15540, "blended_margin_pct": 61.7, "cost_breakdown": {"anthropic": 120, "perplexity": 25, "dataforseo": 60, "gemini": 40, "sendgrid": 19, "supabase": 10, "vercel": 5, "stripe": 38, "support": 70}}'
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
