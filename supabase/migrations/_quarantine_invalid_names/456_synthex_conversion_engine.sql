-- =====================================================
-- Migration 456: Synthex Multi-Channel Conversion Engine
-- Phase D27: Multi-Channel Conversion Engine
-- =====================================================
-- AI-powered conversion predictions and optimization across
-- multiple channels with strategy generation.
-- =====================================================

-- =====================================================
-- Table: synthex_library_conversion_channels
-- Channel definitions and configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel Info
    channel_name TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    -- 'email', 'sms', 'push', 'web', 'social', 'ads', 'phone', 'chat', 'in_app'
    channel_description TEXT,

    -- Configuration
    channel_config JSONB DEFAULT '{}',
    -- {
    --   provider: 'sendgrid',
    --   api_key_ref: 'secret_id',
    --   daily_limit: 10000,
    --   rate_limit: 100,
    --   templates: []
    -- }

    -- Performance Baselines
    baseline_conversion_rate NUMERIC,
    baseline_open_rate NUMERIC,
    baseline_click_rate NUMERIC,
    baseline_cost_per_conversion NUMERIC,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_conversion_predictions
-- AI predictions for contact conversion likelihood
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID,
    lead_id UUID,
    segment TEXT,

    -- Prediction Details
    channel TEXT NOT NULL,
    prediction_type TEXT DEFAULT 'conversion',
    -- 'conversion', 'engagement', 'churn', 'upsell', 'reactivation'

    -- Scores
    likelihood NUMERIC DEFAULT 0 CHECK (likelihood >= 0 AND likelihood <= 1),
    confidence NUMERIC DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    urgency_score NUMERIC DEFAULT 0.5,
    -- How time-sensitive is this prediction

    -- AI Analysis
    reasoning JSONB DEFAULT '{}',
    -- {
    --   factors: [{ name: 'email_engagement', weight: 0.3, value: 0.8 }],
    --   signals: ['recent_visit', 'cart_abandonment'],
    --   best_time: '14:00',
    --   best_day: 'tuesday',
    --   recommended_content: 'discount_offer'
    -- }

    -- Recommended Actions
    recommended_actions JSONB DEFAULT '[]',
    -- [
    --   { action: 'send_email', template: 'cart_recovery', priority: 1 },
    --   { action: 'retarget', platform: 'facebook', budget: 10 }
    -- ]

    -- Timing
    predicted_conversion_window_hours INTEGER,
    optimal_contact_time TIMESTAMPTZ,

    -- Outcome (after prediction made)
    actual_outcome TEXT,
    -- 'converted', 'engaged', 'no_action', 'churned'
    outcome_recorded_at TIMESTAMPTZ,
    prediction_accuracy NUMERIC,

    -- Status
    status TEXT DEFAULT 'active',
    -- 'active', 'acted_upon', 'expired', 'validated'
    expires_at TIMESTAMPTZ,

    -- Metadata
    model_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_conversion_strategies
-- AI-generated multi-channel conversion strategies
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Strategy Info
    strategy_name TEXT NOT NULL,
    strategy_description TEXT,
    strategy_type TEXT DEFAULT 'multi_channel',
    -- 'single_channel', 'multi_channel', 'sequential', 'adaptive'

    -- Target
    target_segment TEXT,
    target_criteria JSONB DEFAULT '{}',
    target_goal TEXT,
    -- 'conversion', 'engagement', 'retention', 'reactivation', 'upsell'

    -- Channels
    channels TEXT[] NOT NULL,
    channel_sequence JSONB DEFAULT '[]',
    -- [
    --   { channel: 'email', delay_hours: 0, template: 'intro' },
    --   { channel: 'sms', delay_hours: 24, condition: 'no_email_open' },
    --   { channel: 'push', delay_hours: 48, condition: 'no_conversion' }
    -- ]

    -- AI Generation
    ai_generated BOOLEAN DEFAULT TRUE,
    ai_reasoning JSONB DEFAULT '{}',
    ai_confidence NUMERIC DEFAULT 0,

    -- Performance
    predicted_conversion_rate NUMERIC,
    predicted_roi NUMERIC,
    actual_conversion_rate NUMERIC,
    actual_roi NUMERIC,
    total_contacts_targeted INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,

    -- Optimization
    is_optimized BOOLEAN DEFAULT FALSE,
    optimization_history JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'draft',
    -- 'draft', 'approved', 'active', 'paused', 'completed', 'archived'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_conversion_touchpoints
-- Individual touchpoint executions within strategies
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    strategy_id UUID REFERENCES synthex_library_conversion_strategies(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES synthex_library_conversion_predictions(id) ON DELETE SET NULL,
    contact_id UUID,

    -- Touchpoint Details
    channel TEXT NOT NULL,
    touchpoint_type TEXT NOT NULL,
    -- 'initial', 'follow_up', 'reminder', 'rescue', 'celebration'
    sequence_position INTEGER DEFAULT 1,

    -- Content
    content_template TEXT,
    content_personalization JSONB DEFAULT '{}',
    subject_line TEXT,
    message_preview TEXT,

    -- Timing
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delay_from_previous_hours INTEGER DEFAULT 0,

    -- Conditions
    trigger_condition TEXT,
    -- 'time_based', 'no_previous_action', 'cart_abandoned', 'page_visited'
    condition_met BOOLEAN DEFAULT TRUE,

    -- Engagement
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,

    -- Metrics
    conversion_value NUMERIC,
    engagement_score NUMERIC,

    -- Status
    status TEXT DEFAULT 'scheduled',
    -- 'scheduled', 'pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'failed'
    failure_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_conversion_experiments
-- A/B tests for conversion optimization
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Experiment Info
    experiment_name TEXT NOT NULL,
    experiment_description TEXT,
    hypothesis TEXT,

    -- Variants
    variants JSONB NOT NULL,
    -- [
    --   { id: 'control', name: 'Control', strategy_id: 'uuid', allocation: 50 },
    --   { id: 'variant_a', name: 'Variant A', strategy_id: 'uuid', allocation: 50 }
    -- ]
    control_variant_id TEXT,

    -- Targeting
    target_segment TEXT,
    traffic_allocation INTEGER DEFAULT 100,

    -- Metrics
    primary_metric TEXT DEFAULT 'conversion_rate',
    secondary_metrics TEXT[] DEFAULT '{}',
    min_sample_size INTEGER DEFAULT 100,
    statistical_significance NUMERIC DEFAULT 0.95,

    -- Results
    results JSONB DEFAULT '{}',
    winner_variant TEXT,
    lift_percentage NUMERIC,
    significance_achieved BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'draft',
    -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_conversion_metrics
-- Aggregated conversion metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_conversion_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Time Period
    period_type TEXT NOT NULL,
    -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Scope
    channel TEXT,
    strategy_id UUID REFERENCES synthex_library_conversion_strategies(id) ON DELETE SET NULL,
    segment TEXT,

    -- Volume Metrics
    total_predictions INTEGER DEFAULT 0,
    total_touchpoints INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Rate Metrics
    conversion_rate NUMERIC DEFAULT 0,
    prediction_accuracy NUMERIC DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,

    -- Revenue Metrics
    total_revenue NUMERIC DEFAULT 0,
    avg_conversion_value NUMERIC,
    cost_per_conversion NUMERIC,
    roi NUMERIC,

    -- Channel Distribution
    channel_breakdown JSONB DEFAULT '{}',
    -- { email: { sent: 1000, converted: 50 }, sms: { sent: 500, converted: 30 } }

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversion_channels_tenant ON synthex_library_conversion_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_channels_type ON synthex_library_conversion_channels(tenant_id, channel_type);
CREATE INDEX IF NOT EXISTS idx_conversion_channels_active ON synthex_library_conversion_channels(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_conversion_predictions_tenant ON synthex_library_conversion_predictions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_contact ON synthex_library_conversion_predictions(tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_channel ON synthex_library_conversion_predictions(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_likelihood ON synthex_library_conversion_predictions(likelihood DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_status ON synthex_library_conversion_predictions(status);
CREATE INDEX IF NOT EXISTS idx_conversion_predictions_created ON synthex_library_conversion_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_strategies_tenant ON synthex_library_conversion_strategies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_strategies_status ON synthex_library_conversion_strategies(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_conversion_strategies_segment ON synthex_library_conversion_strategies(tenant_id, target_segment);

CREATE INDEX IF NOT EXISTS idx_conversion_touchpoints_tenant ON synthex_library_conversion_touchpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_touchpoints_strategy ON synthex_library_conversion_touchpoints(strategy_id);
CREATE INDEX IF NOT EXISTS idx_conversion_touchpoints_contact ON synthex_library_conversion_touchpoints(tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_conversion_touchpoints_status ON synthex_library_conversion_touchpoints(status);
CREATE INDEX IF NOT EXISTS idx_conversion_touchpoints_scheduled ON synthex_library_conversion_touchpoints(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_conversion_experiments_tenant ON synthex_library_conversion_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_experiments_status ON synthex_library_conversion_experiments(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_conversion_metrics_tenant ON synthex_library_conversion_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversion_metrics_period ON synthex_library_conversion_metrics(tenant_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_metrics_channel ON synthex_library_conversion_metrics(tenant_id, channel);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_conversion_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_conversion_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_conversion_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_conversion_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_conversion_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_conversion_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_channels
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_predictions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_strategies
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_touchpoints
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_experiments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_conversion_metrics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function to calculate prediction accuracy
CREATE OR REPLACE FUNCTION calculate_prediction_accuracy(
    p_tenant_id UUID,
    p_from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS NUMERIC AS $$
DECLARE
    v_total INTEGER;
    v_correct INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE
            (likelihood >= 0.5 AND actual_outcome = 'converted') OR
            (likelihood < 0.5 AND actual_outcome IN ('no_action', 'churned'))
        )
    INTO v_total, v_correct
    FROM synthex_library_conversion_predictions
    WHERE tenant_id = p_tenant_id
      AND actual_outcome IS NOT NULL
      AND created_at >= p_from_date;

    IF v_total > 0 THEN
        RETURN v_correct::numeric / v_total;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get channel performance
CREATE OR REPLACE FUNCTION get_channel_performance(
    p_tenant_id UUID,
    p_from_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
    channel TEXT,
    total_sent INTEGER,
    total_converted INTEGER,
    conversion_rate NUMERIC,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.channel,
        COUNT(*)::integer as total_sent,
        COUNT(*) FILTER (WHERE t.status = 'converted')::integer as total_converted,
        CASE
            WHEN COUNT(*) > 0 THEN
                COUNT(*) FILTER (WHERE t.status = 'converted')::numeric / COUNT(*)
            ELSE 0
        END as conversion_rate,
        COALESCE(SUM(t.conversion_value), 0) as total_revenue
    FROM synthex_library_conversion_touchpoints t
    WHERE t.tenant_id = p_tenant_id
      AND t.created_at >= p_from_date
      AND t.status NOT IN ('scheduled', 'pending')
    GROUP BY t.channel
    ORDER BY conversion_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to validate experiment significance
CREATE OR REPLACE FUNCTION validate_experiment_significance(p_experiment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_experiment RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_experiment
    FROM synthex_library_conversion_experiments
    WHERE id = p_experiment_id;

    IF NOT FOUND THEN
        RETURN '{"error": "Experiment not found"}'::jsonb;
    END IF;

    -- Basic check - real implementation would use proper statistical tests
    v_result := jsonb_build_object(
        'experiment_id', p_experiment_id,
        'status', v_experiment.status,
        'has_sufficient_samples', (v_experiment.results->>'total_samples')::int >= v_experiment.min_sample_size,
        'current_significance', v_experiment.results->>'significance',
        'target_significance', v_experiment.statistical_significance,
        'winner', v_experiment.winner_variant
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
