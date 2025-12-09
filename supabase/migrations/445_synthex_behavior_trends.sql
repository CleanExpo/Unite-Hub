-- =====================================================
-- Migration 445: Synthex Behavioral Trend AI Engine
-- Phase D16: Behavioral Analytics & Trend Detection
-- =====================================================
-- AI-powered behavioral analysis with trend detection,
-- pattern recognition, and predictive insights.
-- =====================================================

-- =====================================================
-- Table: synthex_library_behavior_events
-- Raw behavioral event tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Event Identity
    event_type TEXT NOT NULL, -- 'page_view', 'click', 'conversion', 'engagement', etc.
    event_category TEXT, -- 'navigation', 'interaction', 'transaction', etc.
    event_action TEXT, -- Specific action taken
    event_label TEXT, -- Optional label for grouping

    -- Subject
    contact_id UUID,
    session_id TEXT,
    user_agent TEXT,
    ip_hash TEXT, -- Hashed for privacy

    -- Context
    channel TEXT, -- 'web', 'email', 'social', 'mobile', etc.
    source TEXT, -- Traffic source
    medium TEXT, -- Marketing medium
    campaign_id UUID,
    content_id UUID,

    -- Location
    page_url TEXT,
    referrer TEXT,
    geo_country TEXT,
    geo_region TEXT,
    geo_city TEXT,

    -- Value
    event_value NUMERIC,
    revenue NUMERIC,
    quantity INTEGER,

    -- Device
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,

    -- Metadata
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_behavior_events IS 'Raw behavioral event tracking';

-- =====================================================
-- Table: synthex_library_behavior_sessions
-- Session-level aggregations
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Session Identity
    session_id TEXT NOT NULL,
    contact_id UUID,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Engagement
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    interactions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Journey
    entry_page TEXT,
    exit_page TEXT,
    pages_visited TEXT[] DEFAULT '{}',

    -- Source
    channel TEXT,
    source TEXT,
    medium TEXT,
    campaign_id UUID,

    -- Device
    device_type TEXT,
    browser TEXT,
    os TEXT,

    -- Location
    geo_country TEXT,
    geo_region TEXT,

    -- Scores
    engagement_score NUMERIC(4,2), -- 0-100
    intent_score NUMERIC(4,2), -- 0-100

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, session_id)
);

COMMENT ON TABLE synthex_library_behavior_sessions IS 'Session-level behavior aggregations';

-- =====================================================
-- Table: synthex_library_behavior_trends
-- Detected behavioral trends
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Trend Identity
    name TEXT NOT NULL,
    description TEXT,
    trend_type TEXT NOT NULL CHECK (trend_type IN (
        'emerging', 'declining', 'cyclical', 'anomaly', 'pattern'
    )),

    -- Scope
    event_type TEXT, -- Which event type this trend relates to
    channel TEXT, -- Which channel
    segment TEXT, -- User segment affected

    -- Metrics
    metric_name TEXT NOT NULL, -- What metric is trending
    baseline_value NUMERIC, -- Historical baseline
    current_value NUMERIC, -- Current value
    change_percent NUMERIC, -- % change from baseline
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),

    -- Time Period
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Statistical Confidence
    confidence_score NUMERIC(4,3), -- 0-1
    sample_size INTEGER,
    standard_deviation NUMERIC,

    -- AI Analysis
    ai_summary TEXT,
    ai_insights TEXT[],
    ai_recommendations TEXT[],
    ai_model TEXT,
    analyzed_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'resolved', 'monitoring', 'dismissed'
    )),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Alerts
    alert_triggered BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMPTZ,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_behavior_trends IS 'Detected behavioral trends and patterns';

-- =====================================================
-- Table: synthex_library_behavior_patterns
-- Recurring behavioral patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Pattern Identity
    name TEXT NOT NULL,
    description TEXT,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'journey', 'sequence', 'correlation', 'cohort', 'segment'
    )),

    -- Pattern Definition
    pattern_rules JSONB NOT NULL, -- Rule definitions
    event_sequence TEXT[], -- Ordered events for sequence patterns
    correlation_pairs JSONB, -- Correlated metrics

    -- Frequency
    occurrence_count INTEGER DEFAULT 0,
    last_occurrence TIMESTAMPTZ,
    average_frequency NUMERIC, -- Occurrences per day

    -- Impact
    impact_score NUMERIC(4,2), -- 0-100
    revenue_impact NUMERIC,
    conversion_impact NUMERIC(5,4), -- % impact on conversions

    -- AI Analysis
    ai_explanation TEXT,
    ai_model TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_behavior_patterns IS 'Recurring behavioral patterns';

-- =====================================================
-- Table: synthex_library_behavior_predictions
-- Predictive behavior insights
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Prediction Identity
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'churn_risk', 'conversion_likelihood', 'ltv_forecast',
        'next_action', 'segment_shift', 'engagement_decline'
    )),

    -- Subject
    contact_id UUID,
    segment_id UUID,
    scope TEXT DEFAULT 'individual', -- 'individual', 'segment', 'tenant'

    -- Prediction
    predicted_value NUMERIC,
    predicted_label TEXT,
    probability NUMERIC(4,3), -- 0-1
    confidence_interval JSONB, -- { lower: x, upper: y }

    -- Time Horizon
    prediction_horizon TEXT, -- '7d', '30d', '90d'
    valid_until TIMESTAMPTZ,

    -- Factors
    contributing_factors JSONB DEFAULT '[]', -- [{ factor: 'x', weight: 0.3 }]
    data_points_used INTEGER,

    -- AI Details
    ai_model TEXT,
    ai_reasoning TEXT,
    model_version TEXT,

    -- Outcome (for validation)
    actual_value NUMERIC,
    actual_label TEXT,
    outcome_recorded_at TIMESTAMPTZ,
    was_accurate BOOLEAN,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_behavior_predictions IS 'Predictive behavior insights';

-- =====================================================
-- Table: synthex_library_behavior_alerts
-- Behavioral anomaly alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_behavior_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Alert Identity
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'anomaly', 'threshold', 'trend_change', 'pattern_break', 'prediction'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metric_name TEXT,
    metric_value NUMERIC,
    threshold_value NUMERIC,
    deviation_percent NUMERIC,

    -- Related
    trend_id UUID REFERENCES synthex_library_behavior_trends(id),
    pattern_id UUID REFERENCES synthex_library_behavior_patterns(id),
    prediction_id UUID REFERENCES synthex_library_behavior_predictions(id),

    -- AI Analysis
    ai_analysis TEXT,
    ai_recommendations TEXT[],

    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'
    )),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Notifications
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[] DEFAULT '{}', -- 'email', 'slack', 'webhook'

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_behavior_alerts IS 'Behavioral anomaly and threshold alerts';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_behavior_events_tenant
    ON synthex_library_behavior_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type
    ON synthex_library_behavior_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_date
    ON synthex_library_behavior_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_contact
    ON synthex_library_behavior_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_session
    ON synthex_library_behavior_events(session_id);

CREATE INDEX IF NOT EXISTS idx_behavior_sessions_tenant
    ON synthex_library_behavior_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_sessions_contact
    ON synthex_library_behavior_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_behavior_sessions_date
    ON synthex_library_behavior_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavior_trends_tenant
    ON synthex_library_behavior_trends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_trends_type
    ON synthex_library_behavior_trends(tenant_id, trend_type);
CREATE INDEX IF NOT EXISTS idx_behavior_trends_status
    ON synthex_library_behavior_trends(status);
CREATE INDEX IF NOT EXISTS idx_behavior_trends_period
    ON synthex_library_behavior_trends(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_behavior_patterns_tenant
    ON synthex_library_behavior_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_type
    ON synthex_library_behavior_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_behavior_predictions_tenant
    ON synthex_library_behavior_predictions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_predictions_contact
    ON synthex_library_behavior_predictions(contact_id);
CREATE INDEX IF NOT EXISTS idx_behavior_predictions_type
    ON synthex_library_behavior_predictions(prediction_type);

CREATE INDEX IF NOT EXISTS idx_behavior_alerts_tenant
    ON synthex_library_behavior_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_status
    ON synthex_library_behavior_alerts(status);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_severity
    ON synthex_library_behavior_alerts(severity);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_behavior_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_behavior_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_behavior_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_behavior_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY behavior_events_tenant_policy ON synthex_library_behavior_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY behavior_sessions_tenant_policy ON synthex_library_behavior_sessions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY behavior_trends_tenant_policy ON synthex_library_behavior_trends
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY behavior_patterns_tenant_policy ON synthex_library_behavior_patterns
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY behavior_predictions_tenant_policy ON synthex_library_behavior_predictions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY behavior_alerts_tenant_policy ON synthex_library_behavior_alerts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_behavior_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_behavior_sessions_updated ON synthex_library_behavior_sessions;
CREATE TRIGGER trigger_behavior_sessions_updated
    BEFORE UPDATE ON synthex_library_behavior_sessions
    FOR EACH ROW EXECUTE FUNCTION update_behavior_timestamp();

DROP TRIGGER IF EXISTS trigger_behavior_trends_updated ON synthex_library_behavior_trends;
CREATE TRIGGER trigger_behavior_trends_updated
    BEFORE UPDATE ON synthex_library_behavior_trends
    FOR EACH ROW EXECUTE FUNCTION update_behavior_timestamp();

DROP TRIGGER IF EXISTS trigger_behavior_patterns_updated ON synthex_library_behavior_patterns;
CREATE TRIGGER trigger_behavior_patterns_updated
    BEFORE UPDATE ON synthex_library_behavior_patterns
    FOR EACH ROW EXECUTE FUNCTION update_behavior_timestamp();

-- =====================================================
-- Function: Calculate engagement score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    p_page_views INTEGER,
    p_events_count INTEGER,
    p_interactions INTEGER,
    p_duration_seconds INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC;
BEGIN
    -- Weighted scoring:
    -- Page views: 20% (max 10 pages = 20 points)
    -- Events: 30% (max 20 events = 30 points)
    -- Interactions: 30% (max 10 interactions = 30 points)
    -- Duration: 20% (max 300 seconds = 20 points)

    v_score := 0;

    -- Page views (cap at 10)
    v_score := v_score + LEAST(p_page_views, 10) * 2;

    -- Events (cap at 20)
    v_score := v_score + LEAST(p_events_count, 20) * 1.5;

    -- Interactions (cap at 10)
    v_score := v_score + LEAST(p_interactions, 10) * 3;

    -- Duration (cap at 300 seconds)
    v_score := v_score + LEAST(p_duration_seconds, 300) / 15.0;

    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Detect trend change
-- =====================================================
CREATE OR REPLACE FUNCTION detect_trend_change(
    p_baseline NUMERIC,
    p_current NUMERIC,
    p_threshold NUMERIC DEFAULT 0.2
)
RETURNS JSONB AS $$
DECLARE
    v_change NUMERIC;
    v_direction TEXT;
    v_is_significant BOOLEAN;
BEGIN
    IF p_baseline = 0 THEN
        RETURN jsonb_build_object(
            'change_percent', NULL,
            'direction', 'unknown',
            'is_significant', false
        );
    END IF;

    v_change := (p_current - p_baseline) / p_baseline;

    IF v_change > 0 THEN
        v_direction := 'up';
    ELSIF v_change < 0 THEN
        v_direction := 'down';
    ELSE
        v_direction := 'stable';
    END IF;

    v_is_significant := ABS(v_change) >= p_threshold;

    RETURN jsonb_build_object(
        'change_percent', ROUND(v_change * 100, 2),
        'direction', v_direction,
        'is_significant', v_is_significant
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
