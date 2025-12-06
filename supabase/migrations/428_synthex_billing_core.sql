-- Migration 428: Synthex Billing Core - Plans, Subscriptions & Usage Tracking
-- Phase B22: Synthex Plans, Billing & Entitlements Foundation
-- Created: 2025-12-06

-- =====================================================
-- SYNTHEX PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE CHECK (code IN ('FREE', 'PRO', 'AGENCY')),
    name text NOT NULL,
    description text,
    monthly_price_cents integer NOT NULL DEFAULT 0,
    yearly_price_cents integer NOT NULL DEFAULT 0,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    limits jsonb NOT NULL DEFAULT '{
        "max_contacts": 100,
        "max_sends_per_month": 500,
        "max_ai_calls": 50,
        "max_campaigns": 3,
        "max_automations": 1,
        "max_team_members": 1
    }'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add update trigger for updated_at
DROP TRIGGER IF EXISTS set_synthex_plans_updated_at ON synthex_plans;
CREATE TRIGGER set_synthex_plans_updated_at
    BEFORE UPDATE ON synthex_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES synthex_plans(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'paused')),
    billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    current_period_start timestamptz NOT NULL DEFAULT now(),
    current_period_end timestamptz NOT NULL DEFAULT (now() + interval '14 days'), -- Default 14-day trial
    cancel_at timestamptz,
    external_customer_id text, -- Stripe customer ID (future)
    external_subscription_id text, -- Stripe subscription ID (future)
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(tenant_id) -- One subscription per tenant
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_subscriptions_tenant_id;
DROP INDEX IF EXISTS idx_synthex_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_synthex_subscriptions_status;
DROP INDEX IF EXISTS idx_synthex_subscriptions_external_customer;
CREATE INDEX idx_synthex_subscriptions_tenant_id ON synthex_subscriptions(tenant_id);
CREATE INDEX idx_synthex_subscriptions_plan_id ON synthex_subscriptions(plan_id);
CREATE INDEX idx_synthex_subscriptions_status ON synthex_subscriptions(status);
CREATE INDEX idx_synthex_subscriptions_external_customer ON synthex_subscriptions(external_customer_id) WHERE external_customer_id IS NOT NULL;

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_subscriptions_updated_at ON synthex_subscriptions;
CREATE TRIGGER set_synthex_subscriptions_updated_at
    BEFORE UPDATE ON synthex_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX USAGE RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_usage_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    metric text NOT NULL CHECK (metric IN ('emails_sent', 'contacts', 'ai_calls', 'campaigns', 'automations', 'team_members')),
    quantity bigint NOT NULL DEFAULT 0,
    period_start date NOT NULL,
    period_end date NOT NULL,
    last_updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, metric, period_start, period_end)
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_usage_tenant_id;
DROP INDEX IF EXISTS idx_synthex_usage_metric;
DROP INDEX IF EXISTS idx_synthex_usage_period;
CREATE INDEX idx_synthex_usage_tenant_id ON synthex_usage_records(tenant_id);
CREATE INDEX idx_synthex_usage_metric ON synthex_usage_records(metric);
CREATE INDEX idx_synthex_usage_period ON synthex_usage_records(tenant_id, period_start, period_end);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Synthex Plans: Public read for authenticated users
ALTER TABLE synthex_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON synthex_plans;
CREATE POLICY "Anyone can view active plans"
    ON synthex_plans FOR SELECT
    USING (is_active = true);

-- Synthex Subscriptions: Tenant isolation
ALTER TABLE synthex_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant subscription" ON synthex_subscriptions;
DROP POLICY IF EXISTS "Admins can update their tenant subscription" ON synthex_subscriptions;
CREATE POLICY "Users can view their tenant subscription"
    ON synthex_subscriptions FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their tenant subscription"
    ON synthex_subscriptions FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Synthex Usage Records: Tenant isolation
ALTER TABLE synthex_usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant usage" ON synthex_usage_records;
DROP POLICY IF EXISTS "Service role can manage usage records" ON synthex_usage_records;
CREATE POLICY "Users can view their tenant usage"
    ON synthex_usage_records FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage usage records"
    ON synthex_usage_records FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- DEFAULT PLAN DATA
-- =====================================================

-- Insert default plans
INSERT INTO synthex_plans (code, name, description, monthly_price_cents, yearly_price_cents, features, limits) VALUES
(
    'FREE',
    'Free Plan',
    'Perfect for trying out Synthex',
    0,
    0,
    '[
        "Up to 100 contacts",
        "500 emails per month",
        "50 AI interactions",
        "3 active campaigns",
        "1 automation",
        "Email support"
    ]'::jsonb,
    '{
        "max_contacts": 100,
        "max_sends_per_month": 500,
        "max_ai_calls": 50,
        "max_campaigns": 3,
        "max_automations": 1,
        "max_team_members": 1
    }'::jsonb
),
(
    'PRO',
    'Pro Plan',
    'For growing teams and businesses',
    4900,
    52800, -- $528/year (10% discount)
    '[
        "Up to 5,000 contacts",
        "25,000 emails per month",
        "1,000 AI interactions",
        "Unlimited campaigns",
        "10 automations",
        "Priority support",
        "Advanced analytics",
        "A/B testing",
        "Custom branding"
    ]'::jsonb,
    '{
        "max_contacts": 5000,
        "max_sends_per_month": 25000,
        "max_ai_calls": 1000,
        "max_campaigns": -1,
        "max_automations": 10,
        "max_team_members": 5
    }'::jsonb
),
(
    'AGENCY',
    'Agency Plan',
    'For agencies managing multiple clients',
    19900,
    214800, -- $2148/year (10% discount)
    '[
        "Unlimited contacts",
        "100,000+ emails per month",
        "10,000 AI interactions",
        "Unlimited campaigns",
        "Unlimited automations",
        "White-label options",
        "Dedicated support",
        "Advanced analytics",
        "A/B testing",
        "Custom branding",
        "API access",
        "Multiple workspaces"
    ]'::jsonb,
    '{
        "max_contacts": -1,
        "max_sends_per_month": 100000,
        "max_ai_calls": 10000,
        "max_campaigns": -1,
        "max_automations": -1,
        "max_team_members": 25
    }'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- HELPER FUNCTION: Initialize Free Subscription
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_free_subscription(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_free_plan_id uuid;
BEGIN
    -- Get FREE plan ID
    SELECT id INTO v_free_plan_id FROM synthex_plans WHERE code = 'FREE';

    -- Create trial subscription
    INSERT INTO synthex_subscriptions (
        tenant_id,
        plan_id,
        status,
        billing_period,
        current_period_start,
        current_period_end
    ) VALUES (
        p_tenant_id,
        v_free_plan_id,
        'trial',
        'monthly',
        now(),
        now() + interval '14 days'
    )
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-create subscription on tenant creation
-- =====================================================
CREATE OR REPLACE FUNCTION auto_create_tenant_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM initialize_free_subscription(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_tenant_created_create_subscription ON synthex_tenants;
CREATE TRIGGER on_tenant_created_create_subscription
    AFTER INSERT ON synthex_tenants
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_tenant_subscription();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_plans IS 'Synthex subscription plans with pricing and limits';
COMMENT ON TABLE synthex_subscriptions IS 'Synthex tenant subscriptions and billing status';
COMMENT ON TABLE synthex_usage_records IS 'Synthex usage tracking for entitlement enforcement';
