-- =====================================================
-- Migration 454: Synthex Adaptive Offer Intelligence Engine
-- Phase D25: Adaptive Offer Intelligence
-- =====================================================
-- AI-powered offer optimization with audience segmentation,
-- A/B testing, and dynamic pricing recommendations.
-- =====================================================

-- =====================================================
-- Table: synthex_library_offer_insights
-- AI-generated offer insights per audience segment
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_offer_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Audience Targeting
    audience_segment TEXT NOT NULL,
    segment_size INTEGER DEFAULT 0,
    segment_criteria JSONB DEFAULT '{}',
    -- {
    --   demographic: { age_range: [25, 45], location: ['AU'] },
    --   behavioral: { engagement_score: { min: 60 } },
    --   value: { ltv: { min: 500 } }
    -- }

    -- Offer Details
    offer_type TEXT NOT NULL,
    -- 'discount', 'bundle', 'trial', 'upgrade', 'loyalty', 'referral', 'flash_sale', 'seasonal'
    offer_name TEXT,
    offer_description TEXT,
    offer_value NUMERIC,
    offer_currency TEXT DEFAULT 'AUD',
    offer_config JSONB DEFAULT '{}',
    -- {
    --   discount_percent: 20,
    --   min_purchase: 100,
    --   valid_days: 7,
    --   product_ids: [],
    --   exclusions: []
    -- }

    -- AI Analysis
    confidence NUMERIC DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    reasoning JSONB DEFAULT '{}',
    -- {
    --   factors: ['high engagement', 'purchase history'],
    --   expected_response_rate: 0.35,
    --   risk_level: 'low',
    --   alternative_offers: []
    -- }
    recommendation TEXT,
    priority INTEGER DEFAULT 50,

    -- Performance Predictions
    predicted_conversion_rate NUMERIC,
    predicted_revenue_impact NUMERIC,
    predicted_roi NUMERIC,

    -- Status
    status TEXT DEFAULT 'draft',
    -- 'draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'archived'
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Performance Actuals (updated after campaign)
    actual_impressions INTEGER DEFAULT 0,
    actual_clicks INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_revenue NUMERIC DEFAULT 0,
    actual_roi NUMERIC,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_offer_tests
-- A/B test experiments for offer optimization
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_offer_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Test Configuration
    test_name TEXT NOT NULL,
    test_description TEXT,
    hypothesis TEXT,

    -- Variants
    variant_a JSONB NOT NULL,
    -- {
    --   name: 'Control',
    --   offer_id: 'uuid',
    --   traffic_allocation: 50,
    --   offer_config: { ... }
    -- }
    variant_b JSONB NOT NULL,
    variant_c JSONB,
    variant_d JSONB,

    -- Targeting
    audience_segment TEXT,
    traffic_allocation INTEGER DEFAULT 100,
    -- percentage of segment to include in test

    -- Test Parameters
    min_sample_size INTEGER DEFAULT 100,
    statistical_significance NUMERIC DEFAULT 0.95,
    test_duration_days INTEGER DEFAULT 14,
    primary_metric TEXT DEFAULT 'conversion_rate',
    secondary_metrics TEXT[] DEFAULT '{}',

    -- Results
    result JSONB DEFAULT '{}',
    -- {
    --   winner: 'variant_a',
    --   variant_a: { conversions: 150, revenue: 5000, rate: 0.15 },
    --   variant_b: { conversions: 120, revenue: 4000, rate: 0.12 },
    --   significance: 0.97,
    --   lift: 0.25,
    --   recommendation: 'Deploy variant A'
    -- }
    winner_variant TEXT,
    statistical_significance_achieved BOOLEAN DEFAULT FALSE,

    -- Status & Timing
    status TEXT DEFAULT 'pending',
    -- 'pending', 'running', 'paused', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    auto_deploy_winner BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_offer_redemptions
-- Track offer redemptions and conversions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    offer_insight_id UUID REFERENCES synthex_library_offer_insights(id) ON DELETE SET NULL,
    offer_test_id UUID REFERENCES synthex_library_offer_tests(id) ON DELETE SET NULL,
    variant_id TEXT,
    contact_id UUID,
    lead_id UUID,

    -- Redemption Details
    redemption_code TEXT,
    redemption_channel TEXT,
    -- 'email', 'sms', 'web', 'app', 'in_store', 'phone'
    redemption_value NUMERIC,
    order_value NUMERIC,
    discount_applied NUMERIC,

    -- Attribution
    attribution_source TEXT,
    attribution_medium TEXT,
    attribution_campaign TEXT,
    touchpoint_path JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'redeemed',
    -- 'redeemed', 'completed', 'refunded', 'cancelled'
    completed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_offer_templates
-- Reusable offer templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_offer_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    offer_type TEXT NOT NULL,
    template_config JSONB NOT NULL DEFAULT '{}',
    -- {
    --   default_discount: 15,
    --   default_duration: 7,
    --   messaging: { headline: '', body: '' },
    --   channels: ['email', 'sms'],
    --   rules: []
    -- }

    -- Targeting Defaults
    default_segment TEXT,
    default_criteria JSONB DEFAULT '{}',

    -- Performance Baseline
    avg_conversion_rate NUMERIC,
    avg_revenue_per_redemption NUMERIC,
    usage_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_offer_rules
-- Automated offer triggering rules
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_offer_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Details
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    rule_type TEXT NOT NULL,
    -- 'trigger', 'qualification', 'exclusion', 'priority'

    -- Conditions
    conditions JSONB NOT NULL,
    -- [
    --   { field: 'engagement_score', operator: 'gte', value: 70 },
    --   { field: 'days_since_purchase', operator: 'gte', value: 30 }
    -- ]
    condition_logic TEXT DEFAULT 'AND',

    -- Actions
    actions JSONB NOT NULL,
    -- [
    --   { type: 'apply_offer', offer_template_id: 'uuid' },
    --   { type: 'send_notification', channel: 'email' }
    -- ]

    -- Offer Reference
    offer_template_id UUID REFERENCES synthex_library_offer_templates(id) ON DELETE SET NULL,

    -- Priority & Limits
    priority INTEGER DEFAULT 50,
    max_triggers_per_contact INTEGER,
    cooldown_days INTEGER DEFAULT 7,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    triggered_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_offer_insights_tenant ON synthex_library_offer_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_insights_segment ON synthex_library_offer_insights(tenant_id, audience_segment);
CREATE INDEX IF NOT EXISTS idx_offer_insights_status ON synthex_library_offer_insights(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_offer_insights_type ON synthex_library_offer_insights(tenant_id, offer_type);
CREATE INDEX IF NOT EXISTS idx_offer_insights_created ON synthex_library_offer_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offer_tests_tenant ON synthex_library_offer_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_tests_status ON synthex_library_offer_tests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_offer_tests_created ON synthex_library_offer_tests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offer_redemptions_tenant ON synthex_library_offer_redemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_insight ON synthex_library_offer_redemptions(offer_insight_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_test ON synthex_library_offer_redemptions(offer_test_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_contact ON synthex_library_offer_redemptions(tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_created ON synthex_library_offer_redemptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offer_templates_tenant ON synthex_library_offer_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_templates_type ON synthex_library_offer_templates(tenant_id, offer_type);
CREATE INDEX IF NOT EXISTS idx_offer_templates_active ON synthex_library_offer_templates(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_offer_rules_tenant ON synthex_library_offer_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_rules_active ON synthex_library_offer_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_offer_rules_priority ON synthex_library_offer_rules(tenant_id, priority DESC);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_offer_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_offer_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_offer_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_offer_rules ENABLE ROW LEVEL SECURITY;

-- Policies for offer_insights
CREATE POLICY "tenant_isolation" ON synthex_library_offer_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policies for offer_tests
CREATE POLICY "tenant_isolation" ON synthex_library_offer_tests
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policies for offer_redemptions
CREATE POLICY "tenant_isolation" ON synthex_library_offer_redemptions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policies for offer_templates
CREATE POLICY "tenant_isolation" ON synthex_library_offer_templates
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policies for offer_rules
CREATE POLICY "tenant_isolation" ON synthex_library_offer_rules
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function to update offer insight performance
CREATE OR REPLACE FUNCTION update_offer_insight_performance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE synthex_library_offer_insights
    SET
        actual_impressions = actual_impressions + 1,
        actual_clicks = CASE WHEN NEW.status IN ('redeemed', 'completed') THEN actual_clicks + 1 ELSE actual_clicks END,
        actual_conversions = CASE WHEN NEW.status = 'completed' THEN actual_conversions + 1 ELSE actual_conversions END,
        actual_revenue = CASE WHEN NEW.status = 'completed' THEN actual_revenue + COALESCE(NEW.order_value, 0) ELSE actual_revenue END,
        updated_at = NOW()
    WHERE id = NEW.offer_insight_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for redemption tracking
DROP TRIGGER IF EXISTS trg_offer_redemption_performance ON synthex_library_offer_redemptions;
CREATE TRIGGER trg_offer_redemption_performance
    AFTER INSERT ON synthex_library_offer_redemptions
    FOR EACH ROW
    WHEN (NEW.offer_insight_id IS NOT NULL)
    EXECUTE FUNCTION update_offer_insight_performance();

-- Function to calculate offer ROI
CREATE OR REPLACE FUNCTION calculate_offer_roi(p_offer_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_revenue NUMERIC;
    v_cost NUMERIC;
    v_discount NUMERIC;
BEGIN
    SELECT
        COALESCE(SUM(order_value), 0),
        COALESCE(SUM(discount_applied), 0)
    INTO v_revenue, v_discount
    FROM synthex_library_offer_redemptions
    WHERE offer_insight_id = p_offer_id AND status = 'completed';

    v_cost := v_discount;

    IF v_cost > 0 THEN
        RETURN (v_revenue - v_cost) / v_cost;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check A/B test significance
CREATE OR REPLACE FUNCTION check_ab_test_significance(p_test_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_test RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_test FROM synthex_library_offer_tests WHERE id = p_test_id;

    IF NOT FOUND THEN
        RETURN '{"error": "Test not found"}'::jsonb;
    END IF;

    -- Calculate sample sizes and conversion rates from result JSONB
    -- This is a simplified check - real implementation would use proper statistical tests
    v_result := jsonb_build_object(
        'test_id', p_test_id,
        'status', v_test.status,
        'has_sufficient_sample', (v_test.result->>'total_samples')::int >= v_test.min_sample_size,
        'current_significance', v_test.result->>'significance',
        'target_significance', v_test.statistical_significance
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Default Data
-- =====================================================

-- Insert system offer templates (will be inserted per tenant on first use)
-- This is handled by the service layer initialization
