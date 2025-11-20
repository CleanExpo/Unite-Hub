-- Migration: Enterprise Billing & Metering
-- Phase 12 Week 5-6: Billing plans, subscriptions, usage metering, and invoicing
-- Created: 2025-11-20

-- =============================================================================
-- BILLING PLANS
-- =============================================================================

-- Table: billing_plans
-- Defines available subscription plans
CREATE TABLE IF NOT EXISTS billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'professional', 'enterprise', 'custom')),
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',

    -- Limits
    max_workspaces INTEGER DEFAULT 1,
    max_users_per_workspace INTEGER DEFAULT 5,
    max_contacts INTEGER DEFAULT 1000,
    max_emails_per_month INTEGER DEFAULT 1000,
    max_ai_requests_per_month INTEGER DEFAULT 100,
    max_storage_gb DECIMAL(10,2) DEFAULT 1,
    max_campaigns INTEGER DEFAULT 5,
    max_reports_per_month INTEGER DEFAULT 10,

    -- Features
    features JSONB DEFAULT '[]',

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing plans
INSERT INTO billing_plans (name, display_name, description, tier, price_monthly, price_yearly,
    max_workspaces, max_users_per_workspace, max_contacts, max_emails_per_month,
    max_ai_requests_per_month, max_storage_gb, max_campaigns, max_reports_per_month, features, sort_order)
VALUES
('free', 'Free', 'Get started with basic features', 'free', 0, 0,
    1, 3, 500, 500, 50, 0.5, 2, 5,
    '["basic_crm", "email_sync", "basic_reports"]', 1),
('starter', 'Starter', 'For small teams getting started', 'starter', 29, 290,
    2, 10, 5000, 5000, 500, 5, 10, 25,
    '["basic_crm", "email_sync", "basic_reports", "drip_campaigns", "lead_scoring", "api_access"]', 2),
('professional', 'Professional', 'For growing businesses', 'professional', 99, 990,
    5, 25, 25000, 25000, 2500, 25, 50, 100,
    '["basic_crm", "email_sync", "basic_reports", "drip_campaigns", "lead_scoring", "api_access", "advanced_analytics", "ai_insights", "priority_support", "custom_fields"]', 3),
('enterprise', 'Enterprise', 'For large organizations', 'enterprise', 299, 2990,
    -1, -1, -1, -1, -1, -1, -1, -1,
    '["basic_crm", "email_sync", "basic_reports", "drip_campaigns", "lead_scoring", "api_access", "advanced_analytics", "ai_insights", "priority_support", "custom_fields", "sso", "audit_logs", "dedicated_support", "sla", "custom_integrations"]', 4)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================

-- Table: subscriptions
-- Organization subscriptions to billing plans
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused', 'expired')),

    -- Billing cycle
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,

    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Payment
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Metadata
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(org_id)
);

-- =============================================================================
-- USAGE METERING
-- =============================================================================

-- Table: usage_events
-- Individual usage events for metering
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN ('ai_request', 'email_sent', 'contact_created', 'storage', 'report_generated', 'campaign_step', 'api_call')),
    quantity INTEGER DEFAULT 1,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: metering_counters
-- Aggregated usage counters per billing period
CREATE TABLE IF NOT EXISTS metering_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Counter type
    counter_type TEXT NOT NULL,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Counts
    count INTEGER DEFAULT 0,
    limit_value INTEGER,

    -- Status
    warning_sent BOOLEAN DEFAULT FALSE,
    limit_reached BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(org_id, counter_type, period_start)
);

-- =============================================================================
-- INVOICES
-- =============================================================================

-- Table: invoice_history
-- Invoice records for billing
CREATE TABLE IF NOT EXISTS invoice_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'failed', 'void', 'refunded')),

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',

    -- Dates
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    -- Payment
    stripe_invoice_id TEXT,
    payment_method TEXT,

    -- Line items
    line_items JSONB DEFAULT '[]',

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: plan_overages
-- Track overage charges
CREATE TABLE IF NOT EXISTS plan_overages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Overage details
    overage_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,4) NOT NULL,
    total_charge DECIMAL(10,2) NOT NULL,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Status
    invoiced BOOLEAN DEFAULT FALSE,
    invoice_id UUID REFERENCES invoice_history(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_usage_events_org ON usage_events(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_category ON usage_events(event_category);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_org_category_created ON usage_events(org_id, event_category, created_at);

CREATE INDEX IF NOT EXISTS idx_metering_counters_org ON metering_counters(org_id);
CREATE INDEX IF NOT EXISTS idx_metering_counters_period ON metering_counters(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_invoice_history_org ON invoice_history(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_history_status ON invoice_history(status);
CREATE INDEX IF NOT EXISTS idx_invoice_history_date ON invoice_history(invoice_date);

CREATE INDEX IF NOT EXISTS idx_plan_overages_org ON plan_overages(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_overages_period ON plan_overages(period_start);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- billing_plans policies (public read, admin write)
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public plans"
ON billing_plans FOR SELECT
USING (is_public = TRUE AND is_active = TRUE);

-- subscriptions policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's subscription"
ON subscriptions FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage subscriptions"
ON subscriptions FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- usage_events policies
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's usage"
ON usage_events FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "System can insert usage events"
ON usage_events FOR INSERT
WITH CHECK (TRUE);

-- metering_counters policies
ALTER TABLE metering_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's metering"
ON metering_counters FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- invoice_history policies
ALTER TABLE invoice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's invoices"
ON invoice_history FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage invoices"
ON invoice_history FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- plan_overages policies
ALTER TABLE plan_overages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's overages"
ON plan_overages FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Get org's current subscription with plan details
CREATE OR REPLACE FUNCTION get_org_subscription(p_org_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_tier TEXT,
    status TEXT,
    billing_cycle TEXT,
    current_period_end TIMESTAMPTZ,
    max_workspaces INTEGER,
    max_users_per_workspace INTEGER,
    max_contacts INTEGER,
    max_emails_per_month INTEGER,
    max_ai_requests_per_month INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        bp.name,
        bp.tier,
        s.status,
        s.billing_cycle,
        s.current_period_end,
        bp.max_workspaces,
        bp.max_users_per_workspace,
        bp.max_contacts,
        bp.max_emails_per_month,
        bp.max_ai_requests_per_month,
        bp.features
    FROM subscriptions s
    JOIN billing_plans bp ON bp.id = s.plan_id
    WHERE s.org_id = p_org_id
      AND s.status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get usage for current period
CREATE OR REPLACE FUNCTION get_current_usage(p_org_id UUID, p_counter_type TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_period_start TIMESTAMPTZ;
BEGIN
    -- Get current period start from subscription
    SELECT current_period_start INTO v_period_start
    FROM subscriptions
    WHERE org_id = p_org_id AND status IN ('active', 'trialing');

    IF v_period_start IS NULL THEN
        v_period_start := date_trunc('month', NOW());
    END IF;

    -- Get count from metering_counters
    SELECT count INTO v_count
    FROM metering_counters
    WHERE org_id = p_org_id
      AND counter_type = p_counter_type
      AND period_start = v_period_start;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    p_org_id UUID,
    p_counter_type TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_new_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get current period from subscription
    SELECT current_period_start, current_period_end
    INTO v_period_start, v_period_end
    FROM subscriptions
    WHERE org_id = p_org_id AND status IN ('active', 'trialing');

    IF v_period_start IS NULL THEN
        v_period_start := date_trunc('month', NOW());
        v_period_end := v_period_start + INTERVAL '1 month';
    END IF;

    -- Get limit from plan
    SELECT
        CASE p_counter_type
            WHEN 'emails' THEN bp.max_emails_per_month
            WHEN 'ai_requests' THEN bp.max_ai_requests_per_month
            WHEN 'contacts' THEN bp.max_contacts
            WHEN 'reports' THEN bp.max_reports_per_month
            ELSE NULL
        END INTO v_limit
    FROM subscriptions s
    JOIN billing_plans bp ON bp.id = s.plan_id
    WHERE s.org_id = p_org_id;

    -- Upsert counter
    INSERT INTO metering_counters (org_id, counter_type, period_start, period_end, count, limit_value)
    VALUES (p_org_id, p_counter_type, v_period_start, v_period_end, p_amount, v_limit)
    ON CONFLICT (org_id, counter_type, period_start)
    DO UPDATE SET
        count = metering_counters.count + p_amount,
        updated_at = NOW()
    RETURNING count INTO v_new_count;

    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if within limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_org_id UUID,
    p_counter_type TEXT
)
RETURNS TABLE (
    current_usage INTEGER,
    limit_value INTEGER,
    percentage_used DECIMAL,
    is_within_limit BOOLEAN,
    is_warning BOOLEAN
) AS $$
DECLARE
    v_current INTEGER;
    v_limit INTEGER;
    v_percentage DECIMAL;
BEGIN
    -- Get current usage
    v_current := get_current_usage(p_org_id, p_counter_type);

    -- Get limit from plan
    SELECT
        CASE p_counter_type
            WHEN 'emails' THEN bp.max_emails_per_month
            WHEN 'ai_requests' THEN bp.max_ai_requests_per_month
            WHEN 'contacts' THEN bp.max_contacts
            WHEN 'reports' THEN bp.max_reports_per_month
            WHEN 'campaigns' THEN bp.max_campaigns
            WHEN 'workspaces' THEN bp.max_workspaces
            ELSE NULL
        END INTO v_limit
    FROM subscriptions s
    JOIN billing_plans bp ON bp.id = s.plan_id
    WHERE s.org_id = p_org_id AND s.status IN ('active', 'trialing');

    -- Calculate percentage (handle -1 for unlimited)
    IF v_limit IS NULL OR v_limit = -1 THEN
        v_percentage := 0;
        RETURN QUERY SELECT v_current, v_limit, v_percentage, TRUE, FALSE;
    ELSE
        v_percentage := (v_current::DECIMAL / v_limit::DECIMAL) * 100;
        RETURN QUERY SELECT
            v_current,
            v_limit,
            v_percentage,
            v_current < v_limit,
            v_percentage >= 80 AND v_percentage < 100;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_seq INTEGER;
BEGIN
    v_year := to_char(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_seq
    FROM invoice_history
    WHERE invoice_number LIKE 'INV-' || v_year || '-%';

    RETURN 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_billing_plans_updated_at
    BEFORE UPDATE ON billing_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metering_counters_updated_at
    BEFORE UPDATE ON metering_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_history_updated_at
    BEFORE UPDATE ON invoice_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE billing_plans IS 'Available subscription plans with features and limits';
COMMENT ON TABLE subscriptions IS 'Organization subscriptions to billing plans';
COMMENT ON TABLE usage_events IS 'Individual usage events for detailed metering';
COMMENT ON TABLE metering_counters IS 'Aggregated usage counters per billing period';
COMMENT ON TABLE invoice_history IS 'Invoice records for billing and payments';
COMMENT ON TABLE plan_overages IS 'Overage charges when limits are exceeded';

COMMENT ON FUNCTION get_org_subscription IS 'Returns current subscription with plan details';
COMMENT ON FUNCTION get_current_usage IS 'Returns current usage count for a counter type';
COMMENT ON FUNCTION increment_usage IS 'Increments usage counter and returns new count';
COMMENT ON FUNCTION check_usage_limit IS 'Checks usage against plan limits';
COMMENT ON FUNCTION generate_invoice_number IS 'Generates sequential invoice numbers';
