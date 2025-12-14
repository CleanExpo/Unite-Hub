-- =====================================================
-- Migration 441: Synthex Credit System
-- Phase D12: Global Rate Limit + Credit System
-- =====================================================
-- Usage tracking, credit management, rate limiting,
-- and billing integration for AI operations.
-- =====================================================

-- =====================================================
-- Table: synthex_library_credit_accounts
-- Credit account for each tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Credit Balance
    credit_balance INTEGER DEFAULT 0, -- Current credits
    lifetime_credits INTEGER DEFAULT 0, -- Total ever purchased/allocated
    lifetime_used INTEGER DEFAULT 0, -- Total ever used

    -- Plan Limits
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN (
        'free', 'starter', 'professional', 'enterprise', 'unlimited'
    )),
    monthly_credit_limit INTEGER DEFAULT 100, -- Monthly allocation
    daily_credit_limit INTEGER, -- Optional daily cap
    credits_reset_at TIMESTAMPTZ, -- When monthly credits reset

    -- Rate Limits
    requests_per_minute INTEGER DEFAULT 10,
    requests_per_hour INTEGER DEFAULT 100,
    requests_per_day INTEGER DEFAULT 1000,
    concurrent_requests INTEGER DEFAULT 3,

    -- Feature Limits
    max_brands INTEGER DEFAULT 1,
    max_templates INTEGER DEFAULT 10,
    max_personas INTEGER DEFAULT 3,
    max_tone_profiles INTEGER DEFAULT 3,
    max_team_members INTEGER DEFAULT 1,

    -- Billing
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    billing_email TEXT,
    billing_status TEXT DEFAULT 'active' CHECK (billing_status IN (
        'active', 'past_due', 'canceled', 'paused'
    )),

    -- Notifications
    low_credit_threshold INTEGER DEFAULT 20, -- Alert when below
    low_credit_notified_at TIMESTAMPTZ,
    exhausted_notified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_credit_accounts IS 'Credit accounts for tenants';

-- =====================================================
-- Table: synthex_library_credit_transactions
-- Credit transaction history
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES synthex_library_credit_accounts(id),

    -- Transaction Details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'purchase', 'allocation', 'usage', 'refund', 'adjustment',
        'monthly_reset', 'bonus', 'expiry', 'transfer'
    )),
    amount INTEGER NOT NULL, -- Positive for credit, negative for debit
    balance_after INTEGER NOT NULL, -- Balance after this transaction

    -- Description
    description TEXT,
    reference_type TEXT, -- 'transformation', 'analysis', 'generation', etc.
    reference_id UUID, -- ID of the related operation

    -- Pricing
    unit_cost NUMERIC(10,4), -- Cost per credit if applicable
    total_cost NUMERIC(10,2), -- Total monetary cost

    -- Billing
    stripe_payment_id TEXT,
    stripe_invoice_id TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_credit_transactions IS 'Credit transaction ledger';

-- =====================================================
-- Table: synthex_library_usage_records
-- Detailed usage tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Operation Details
    operation_type TEXT NOT NULL, -- 'tone_transform', 'persona_generate', etc.
    operation_id UUID, -- Reference to the specific operation
    feature TEXT NOT NULL, -- 'tone', 'persona', 'compliance', etc.

    -- Resource Usage
    credits_used INTEGER DEFAULT 1,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    processing_time_ms INTEGER,

    -- AI Model
    ai_model TEXT,
    ai_provider TEXT DEFAULT 'anthropic',

    -- Request Details
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    endpoint TEXT,

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'completed', 'failed', 'refunded'
    )),
    error_message TEXT,

    -- User
    user_id UUID,
    session_id TEXT,
    ip_address INET,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_usage_records IS 'Detailed usage tracking for billing';

-- =====================================================
-- Table: synthex_library_rate_limit_state
-- Current rate limit state per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Window Tracking
    window_type TEXT NOT NULL CHECK (window_type IN (
        'minute', 'hour', 'day'
    )),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,

    -- Counts
    request_count INTEGER DEFAULT 0,
    request_limit INTEGER NOT NULL,

    -- Status
    is_exceeded BOOLEAN DEFAULT false,
    exceeded_at TIMESTAMPTZ,

    -- Metadata
    last_request_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',

    UNIQUE(tenant_id, window_type)
);

COMMENT ON TABLE synthex_library_rate_limit_state IS 'Rate limit window tracking';

-- =====================================================
-- Table: synthex_library_credit_packages
-- Available credit packages for purchase
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Package Info
    name TEXT NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,

    -- Pricing
    price NUMERIC(10,2) NOT NULL, -- In cents
    currency TEXT DEFAULT 'USD',
    price_per_credit NUMERIC(10,4), -- Calculated

    -- Stripe
    stripe_price_id TEXT,
    stripe_product_id TEXT,

    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_subscription BOOLEAN DEFAULT false, -- Monthly package

    -- Limits
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,

    -- Bonus
    bonus_credits INTEGER DEFAULT 0, -- Extra credits
    bonus_percentage NUMERIC(5,2), -- e.g., 10% extra

    -- Display
    display_order INTEGER DEFAULT 0,
    badge_text TEXT, -- e.g., "Most Popular"

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_credit_packages IS 'Credit packages for purchase';

-- Insert default packages
INSERT INTO synthex_library_credit_packages (name, description, credits, price, is_featured, bonus_credits, badge_text, display_order) VALUES
('Starter Pack', 'Perfect for trying out the platform', 100, 999, false, 0, NULL, 1),
('Growth Pack', 'Most popular for growing businesses', 500, 3999, true, 50, 'Most Popular', 2),
('Professional Pack', 'For power users and agencies', 2000, 12999, false, 300, 'Best Value', 3),
('Enterprise Pack', 'Volume pricing for large teams', 10000, 49999, false, 2000, NULL, 4)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Table: synthex_library_plan_definitions
-- Plan feature definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_plan_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type TEXT NOT NULL UNIQUE,

    -- Display
    name TEXT NOT NULL,
    description TEXT,

    -- Pricing
    monthly_price NUMERIC(10,2) DEFAULT 0,
    annual_price NUMERIC(10,2), -- Yearly rate
    stripe_price_id_monthly TEXT,
    stripe_price_id_annual TEXT,

    -- Credits
    monthly_credits INTEGER DEFAULT 0,
    credit_rollover BOOLEAN DEFAULT false,
    max_rollover_credits INTEGER,

    -- Rate Limits
    requests_per_minute INTEGER DEFAULT 10,
    requests_per_hour INTEGER DEFAULT 100,
    requests_per_day INTEGER DEFAULT 1000,
    concurrent_requests INTEGER DEFAULT 3,

    -- Feature Limits
    max_brands INTEGER DEFAULT 1,
    max_templates INTEGER DEFAULT 10,
    max_personas INTEGER DEFAULT 3,
    max_tone_profiles INTEGER DEFAULT 3,
    max_team_members INTEGER DEFAULT 1,
    max_api_keys INTEGER DEFAULT 1,

    -- Features
    features JSONB DEFAULT '[]', -- [{ name: 'Feature', included: true }]

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_plan_definitions IS 'Plan feature definitions';

-- Insert default plans
INSERT INTO synthex_library_plan_definitions (plan_type, name, description, monthly_price, monthly_credits, requests_per_minute, requests_per_hour, max_brands, max_templates, max_personas, max_tone_profiles, max_team_members, is_default, display_order, features) VALUES
('free', 'Free', 'Get started with basic features', 0, 50, 5, 50, 1, 5, 2, 2, 1, true, 1, '[{"name": "Basic AI features", "included": true}, {"name": "1 brand profile", "included": true}, {"name": "Email support", "included": true}]'),
('starter', 'Starter', 'For individuals and small teams', 2900, 500, 15, 150, 2, 25, 5, 5, 3, false, 2, '[{"name": "All Free features", "included": true}, {"name": "2 brand profiles", "included": true}, {"name": "Advanced analytics", "included": true}, {"name": "Priority support", "included": true}]'),
('professional', 'Professional', 'For growing businesses', 7900, 2000, 30, 300, 5, 100, 15, 10, 10, false, 3, '[{"name": "All Starter features", "included": true}, {"name": "5 brand profiles", "included": true}, {"name": "API access", "included": true}, {"name": "Custom integrations", "included": true}]'),
('enterprise', 'Enterprise', 'For large organizations', 19900, 10000, 100, 1000, -1, -1, -1, -1, -1, false, 4, '[{"name": "All Professional features", "included": true}, {"name": "Unlimited brands", "included": true}, {"name": "SSO/SAML", "included": true}, {"name": "Dedicated support", "included": true}]')
ON CONFLICT (plan_type) DO NOTHING;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_credit_accounts_tenant
    ON synthex_library_credit_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_plan
    ON synthex_library_credit_accounts(plan_type);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_stripe
    ON synthex_library_credit_accounts(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant
    ON synthex_library_credit_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date
    ON synthex_library_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
    ON synthex_library_credit_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_usage_records_tenant
    ON synthex_library_usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_date
    ON synthex_library_usage_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_feature
    ON synthex_library_usage_records(feature, operation_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_user
    ON synthex_library_usage_records(user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tenant_window
    ON synthex_library_rate_limit_state(tenant_id, window_type);

CREATE INDEX IF NOT EXISTS idx_credit_packages_active
    ON synthex_library_credit_packages(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_plan_definitions_active
    ON synthex_library_plan_definitions(is_active) WHERE is_active = true;

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_rate_limit_state ENABLE ROW LEVEL SECURITY;

-- Credit Accounts RLS
DROP POLICY IF EXISTS credit_accounts_tenant_policy ON synthex_library_credit_accounts;
CREATE POLICY credit_accounts_tenant_policy ON synthex_library_credit_accounts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Credit Transactions RLS
DROP POLICY IF EXISTS credit_transactions_tenant_policy ON synthex_library_credit_transactions;
CREATE POLICY credit_transactions_tenant_policy ON synthex_library_credit_transactions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Usage Records RLS
DROP POLICY IF EXISTS usage_records_tenant_policy ON synthex_library_usage_records;
CREATE POLICY usage_records_tenant_policy ON synthex_library_usage_records
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Rate Limit State RLS
DROP POLICY IF EXISTS rate_limit_state_tenant_policy ON synthex_library_rate_limit_state;
CREATE POLICY rate_limit_state_tenant_policy ON synthex_library_rate_limit_state
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_credit_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_credit_account_updated ON synthex_library_credit_accounts;
CREATE TRIGGER trigger_credit_account_updated
    BEFORE UPDATE ON synthex_library_credit_accounts
    FOR EACH ROW EXECUTE FUNCTION update_credit_account_timestamp();

-- =====================================================
-- Function: Check and deduct credits
-- =====================================================
CREATE OR REPLACE FUNCTION check_and_deduct_credits(
    p_tenant_id UUID,
    p_credits INTEGER,
    p_operation_type TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_account synthex_library_credit_accounts%ROWTYPE;
    v_balance_after INTEGER;
BEGIN
    -- Lock the account row
    SELECT * INTO v_account
    FROM synthex_library_credit_accounts
    WHERE tenant_id = p_tenant_id
    FOR UPDATE;

    IF v_account IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Account not found'
        );
    END IF;

    -- Check balance
    IF v_account.credit_balance < p_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'balance', v_account.credit_balance,
            'required', p_credits
        );
    END IF;

    -- Calculate new balance
    v_balance_after := v_account.credit_balance - p_credits;

    -- Update account
    UPDATE synthex_library_credit_accounts
    SET credit_balance = v_balance_after,
        lifetime_used = lifetime_used + p_credits
    WHERE id = v_account.id;

    -- Record transaction
    INSERT INTO synthex_library_credit_transactions (
        tenant_id, account_id, transaction_type, amount,
        balance_after, reference_type, reference_id
    ) VALUES (
        p_tenant_id, v_account.id, 'usage', -p_credits,
        v_balance_after, p_operation_type, p_reference_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_account.credit_balance,
        'balance_after', v_balance_after,
        'deducted', p_credits
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Add credits
-- =====================================================
CREATE OR REPLACE FUNCTION add_credits(
    p_tenant_id UUID,
    p_credits INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_account synthex_library_credit_accounts%ROWTYPE;
    v_balance_after INTEGER;
BEGIN
    -- Lock the account row
    SELECT * INTO v_account
    FROM synthex_library_credit_accounts
    WHERE tenant_id = p_tenant_id
    FOR UPDATE;

    IF v_account IS NULL THEN
        -- Create account if doesn't exist
        INSERT INTO synthex_library_credit_accounts (tenant_id, credit_balance, lifetime_credits)
        VALUES (p_tenant_id, p_credits, p_credits)
        RETURNING * INTO v_account;

        v_balance_after := p_credits;
    ELSE
        v_balance_after := v_account.credit_balance + p_credits;

        UPDATE synthex_library_credit_accounts
        SET credit_balance = v_balance_after,
            lifetime_credits = lifetime_credits + p_credits
        WHERE id = v_account.id;
    END IF;

    -- Record transaction
    INSERT INTO synthex_library_credit_transactions (
        tenant_id, account_id, transaction_type, amount,
        balance_after, description, stripe_payment_id
    ) VALUES (
        p_tenant_id, v_account.id, p_transaction_type, p_credits,
        v_balance_after, p_description, p_stripe_payment_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_account.credit_balance,
        'balance_after', v_balance_after,
        'added', p_credits
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Check rate limit
-- =====================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_tenant_id UUID,
    p_window_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_account synthex_library_credit_accounts%ROWTYPE;
    v_state synthex_library_rate_limit_state%ROWTYPE;
    v_limit INTEGER;
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
BEGIN
    -- Get account limits
    SELECT * INTO v_account
    FROM synthex_library_credit_accounts
    WHERE tenant_id = p_tenant_id;

    IF v_account IS NULL THEN
        RETURN jsonb_build_object('allowed', true, 'remaining', 999);
    END IF;

    -- Determine limit and window
    CASE p_window_type
        WHEN 'minute' THEN
            v_limit := v_account.requests_per_minute;
            v_window_start := date_trunc('minute', now());
            v_window_end := v_window_start + interval '1 minute';
        WHEN 'hour' THEN
            v_limit := v_account.requests_per_hour;
            v_window_start := date_trunc('hour', now());
            v_window_end := v_window_start + interval '1 hour';
        WHEN 'day' THEN
            v_limit := v_account.requests_per_day;
            v_window_start := date_trunc('day', now());
            v_window_end := v_window_start + interval '1 day';
        ELSE
            RETURN jsonb_build_object('allowed', false, 'error', 'Invalid window type');
    END CASE;

    -- Get or create state
    SELECT * INTO v_state
    FROM synthex_library_rate_limit_state
    WHERE tenant_id = p_tenant_id AND window_type = p_window_type
    FOR UPDATE;

    IF v_state IS NULL OR v_state.window_start < v_window_start THEN
        -- New window
        INSERT INTO synthex_library_rate_limit_state (
            tenant_id, window_type, window_start, window_end,
            request_count, request_limit, last_request_at
        ) VALUES (
            p_tenant_id, p_window_type, v_window_start, v_window_end,
            1, v_limit, now()
        )
        ON CONFLICT (tenant_id, window_type) DO UPDATE
        SET window_start = v_window_start,
            window_end = v_window_end,
            request_count = 1,
            request_limit = v_limit,
            is_exceeded = false,
            exceeded_at = NULL,
            last_request_at = now();

        RETURN jsonb_build_object(
            'allowed', true,
            'remaining', v_limit - 1,
            'limit', v_limit,
            'reset_at', v_window_end
        );
    END IF;

    -- Check if exceeded
    IF v_state.request_count >= v_limit THEN
        -- Update exceeded status
        UPDATE synthex_library_rate_limit_state
        SET is_exceeded = true,
            exceeded_at = COALESCE(exceeded_at, now())
        WHERE id = v_state.id;

        RETURN jsonb_build_object(
            'allowed', false,
            'remaining', 0,
            'limit', v_limit,
            'reset_at', v_state.window_end,
            'retry_after', EXTRACT(EPOCH FROM (v_state.window_end - now()))::integer
        );
    END IF;

    -- Increment counter
    UPDATE synthex_library_rate_limit_state
    SET request_count = request_count + 1,
        last_request_at = now()
    WHERE id = v_state.id;

    RETURN jsonb_build_object(
        'allowed', true,
        'remaining', v_limit - v_state.request_count - 1,
        'limit', v_limit,
        'reset_at', v_state.window_end
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get usage summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_usage_summary(
    p_tenant_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT date_trunc('month', now()),
    p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_credits_used', COALESCE(SUM(credits_used), 0),
        'total_tokens', COALESCE(SUM(tokens_total), 0),
        'total_requests', COUNT(*),
        'by_feature', (
            SELECT jsonb_object_agg(feature, usage)
            FROM (
                SELECT feature, jsonb_build_object(
                    'credits', SUM(credits_used),
                    'requests', COUNT(*),
                    'tokens', SUM(tokens_total)
                ) as usage
                FROM synthex_library_usage_records
                WHERE tenant_id = p_tenant_id
                  AND created_at >= p_start_date
                  AND created_at <= p_end_date
                GROUP BY feature
            ) sub
        ),
        'by_day', (
            SELECT jsonb_agg(jsonb_build_object(
                'date', day::date,
                'credits', credits,
                'requests', requests
            ) ORDER BY day)
            FROM (
                SELECT date_trunc('day', created_at) as day,
                       SUM(credits_used) as credits,
                       COUNT(*) as requests
                FROM synthex_library_usage_records
                WHERE tenant_id = p_tenant_id
                  AND created_at >= p_start_date
                  AND created_at <= p_end_date
                GROUP BY date_trunc('day', created_at)
            ) sub
        )
    ) INTO v_result
    FROM synthex_library_usage_records
    WHERE tenant_id = p_tenant_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;
