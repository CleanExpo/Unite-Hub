-- =====================================================
-- Migration 455: Synthex Funnel Drop-Off Detection Engine
-- Phase D26: Funnel Drop-Off Detection Engine
-- =====================================================
-- AI-powered funnel analysis with drop-off detection,
-- recovery recommendations, and optimization insights.
-- =====================================================

-- =====================================================
-- Table: synthex_library_funnel_definitions
-- Funnel structure definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Funnel Info
    funnel_name TEXT NOT NULL,
    funnel_description TEXT,
    funnel_type TEXT NOT NULL,
    -- 'sales', 'onboarding', 'signup', 'checkout', 'engagement', 'custom'

    -- Stages Configuration
    stages JSONB NOT NULL DEFAULT '[]',
    -- [
    --   { id: 'awareness', name: 'Awareness', position: 1, expected_conversion: 0.5 },
    --   { id: 'interest', name: 'Interest', position: 2, expected_conversion: 0.4 },
    --   { id: 'consideration', name: 'Consideration', position: 3, expected_conversion: 0.3 },
    --   { id: 'conversion', name: 'Conversion', position: 4, expected_conversion: 0.2 }
    -- ]

    -- Configuration
    tracking_window_days INTEGER DEFAULT 30,
    attribution_model TEXT DEFAULT 'first_touch',
    -- 'first_touch', 'last_touch', 'linear', 'time_decay'

    -- Targets
    target_conversion_rate NUMERIC,
    target_time_to_convert_hours INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_funnel_events
-- Individual funnel stage events
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    funnel_id UUID REFERENCES synthex_library_funnel_definitions(id) ON DELETE CASCADE,
    contact_id UUID,
    lead_id UUID,
    session_id TEXT,

    -- Event Details
    stage TEXT NOT NULL,
    stage_position INTEGER,
    previous_stage TEXT,
    event_type TEXT DEFAULT 'enter',
    -- 'enter', 'exit', 'complete', 'drop_off', 'skip'

    -- Timing
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    exited_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Attribution
    source TEXT,
    medium TEXT,
    campaign TEXT,
    channel TEXT,

    -- Context
    page_url TEXT,
    referrer_url TEXT,
    device_type TEXT,
    browser TEXT,
    country TEXT,
    city TEXT,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_funnel_dropoffs
-- Detected drop-off points with AI analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_dropoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    funnel_id UUID REFERENCES synthex_library_funnel_definitions(id) ON DELETE CASCADE,

    -- Drop-off Point
    stage TEXT NOT NULL,
    next_stage TEXT,
    stage_position INTEGER,

    -- Metrics
    dropoff_rate NUMERIC DEFAULT 0 CHECK (dropoff_rate >= 0 AND dropoff_rate <= 1),
    dropoff_count INTEGER DEFAULT 0,
    total_entered INTEGER DEFAULT 0,
    avg_time_before_dropoff_seconds INTEGER,

    -- Comparison
    benchmark_dropoff_rate NUMERIC,
    variance_from_benchmark NUMERIC,
    is_above_threshold BOOLEAN DEFAULT FALSE,
    alert_threshold NUMERIC DEFAULT 0.3,

    -- AI Analysis
    ai_recommendation TEXT,
    ai_confidence NUMERIC DEFAULT 0,
    ai_analysis JSONB DEFAULT '{}',
    -- {
    --   primary_reasons: ['price_objection', 'complexity'],
    --   suggested_actions: ['simplify_form', 'add_trust_signals'],
    --   estimated_improvement: 0.15,
    --   priority: 'high'
    -- }

    -- Recovery Suggestions
    recovery_actions JSONB DEFAULT '[]',
    -- [
    --   { type: 'email', template: 'cart_abandonment', delay_hours: 2 },
    --   { type: 'retargeting', audience: 'dropoff_stage_3' }
    -- ]

    -- Time Window
    analysis_period_start TIMESTAMPTZ,
    analysis_period_end TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'detected',
    -- 'detected', 'analyzing', 'action_recommended', 'action_taken', 'resolved', 'ignored'
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_funnel_recovery_actions
-- Recovery action tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_recovery_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    dropoff_id UUID REFERENCES synthex_library_funnel_dropoffs(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES synthex_library_funnel_definitions(id) ON DELETE SET NULL,
    contact_id UUID,

    -- Action Details
    action_type TEXT NOT NULL,
    -- 'email', 'sms', 'push', 'retargeting', 'popup', 'discount', 'support_call'
    action_config JSONB DEFAULT '{}',
    action_message TEXT,

    -- Timing
    scheduled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    delay_hours INTEGER DEFAULT 0,

    -- Results
    status TEXT DEFAULT 'pending',
    -- 'pending', 'scheduled', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed'
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    conversion_value NUMERIC,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_funnel_metrics
-- Aggregated funnel performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    funnel_id UUID REFERENCES synthex_library_funnel_definitions(id) ON DELETE CASCADE,

    -- Time Period
    period_type TEXT NOT NULL,
    -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Overall Metrics
    total_entries INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    overall_conversion_rate NUMERIC DEFAULT 0,
    avg_time_to_convert_seconds INTEGER,

    -- Stage Metrics
    stage_metrics JSONB DEFAULT '{}',
    -- {
    --   awareness: { entries: 1000, exits: 500, conversion_rate: 0.5, avg_duration: 120 },
    --   interest: { entries: 500, exits: 300, conversion_rate: 0.4, avg_duration: 180 }
    -- }

    -- Drop-off Summary
    total_dropoffs INTEGER DEFAULT 0,
    primary_dropoff_stage TEXT,
    dropoff_distribution JSONB DEFAULT '{}',

    -- Revenue (if applicable)
    total_revenue NUMERIC DEFAULT 0,
    avg_order_value NUMERIC,
    revenue_per_entry NUMERIC,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_funnel_alerts
-- Funnel performance alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_funnel_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    funnel_id UUID REFERENCES synthex_library_funnel_definitions(id) ON DELETE CASCADE,
    dropoff_id UUID REFERENCES synthex_library_funnel_dropoffs(id) ON DELETE SET NULL,

    -- Alert Details
    alert_type TEXT NOT NULL,
    -- 'dropoff_spike', 'conversion_drop', 'time_anomaly', 'volume_drop', 'goal_miss'
    severity TEXT DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    message TEXT,

    -- Metrics
    current_value NUMERIC,
    expected_value NUMERIC,
    threshold_value NUMERIC,
    variance_percent NUMERIC,

    -- Context
    affected_stage TEXT,
    affected_period_start TIMESTAMPTZ,
    affected_period_end TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'new',
    -- 'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_funnel_definitions_tenant ON synthex_library_funnel_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_definitions_active ON synthex_library_funnel_definitions(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_funnel_definitions_type ON synthex_library_funnel_definitions(tenant_id, funnel_type);

CREATE INDEX IF NOT EXISTS idx_funnel_events_tenant ON synthex_library_funnel_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON synthex_library_funnel_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_contact ON synthex_library_funnel_events(tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_stage ON synthex_library_funnel_events(funnel_id, stage);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON synthex_library_funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON synthex_library_funnel_events(session_id);

CREATE INDEX IF NOT EXISTS idx_funnel_dropoffs_tenant ON synthex_library_funnel_dropoffs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_dropoffs_funnel ON synthex_library_funnel_dropoffs(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_dropoffs_stage ON synthex_library_funnel_dropoffs(funnel_id, stage);
CREATE INDEX IF NOT EXISTS idx_funnel_dropoffs_status ON synthex_library_funnel_dropoffs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_funnel_dropoffs_rate ON synthex_library_funnel_dropoffs(dropoff_rate DESC);

CREATE INDEX IF NOT EXISTS idx_funnel_recovery_tenant ON synthex_library_funnel_recovery_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_recovery_dropoff ON synthex_library_funnel_recovery_actions(dropoff_id);
CREATE INDEX IF NOT EXISTS idx_funnel_recovery_status ON synthex_library_funnel_recovery_actions(status);

CREATE INDEX IF NOT EXISTS idx_funnel_metrics_tenant ON synthex_library_funnel_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_funnel ON synthex_library_funnel_metrics(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_period ON synthex_library_funnel_metrics(funnel_id, period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_funnel_alerts_tenant ON synthex_library_funnel_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funnel_alerts_funnel ON synthex_library_funnel_alerts(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_alerts_status ON synthex_library_funnel_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_funnel_alerts_severity ON synthex_library_funnel_alerts(tenant_id, severity);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_funnel_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_funnel_dropoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_funnel_recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_funnel_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_definitions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_dropoffs
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_recovery_actions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_metrics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_funnel_alerts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function to calculate funnel stage metrics
CREATE OR REPLACE FUNCTION calculate_funnel_stage_metrics(
    p_funnel_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_metrics JSONB := '{}';
    v_stage RECORD;
BEGIN
    FOR v_stage IN
        SELECT
            stage,
            COUNT(*) FILTER (WHERE event_type = 'enter') as entries,
            COUNT(*) FILTER (WHERE event_type IN ('exit', 'drop_off')) as exits,
            COUNT(*) FILTER (WHERE event_type = 'complete') as completions,
            AVG(duration_seconds) as avg_duration
        FROM synthex_library_funnel_events
        WHERE funnel_id = p_funnel_id
          AND created_at >= p_start_date
          AND created_at < p_end_date
        GROUP BY stage
    LOOP
        v_metrics := v_metrics || jsonb_build_object(
            v_stage.stage, jsonb_build_object(
                'entries', COALESCE(v_stage.entries, 0),
                'exits', COALESCE(v_stage.exits, 0),
                'completions', COALESCE(v_stage.completions, 0),
                'conversion_rate', CASE
                    WHEN v_stage.entries > 0 THEN (v_stage.completions::numeric / v_stage.entries)
                    ELSE 0
                END,
                'avg_duration', COALESCE(v_stage.avg_duration, 0)
            )
        );
    END LOOP;

    RETURN v_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to detect drop-off anomalies
CREATE OR REPLACE FUNCTION detect_funnel_dropoff_anomalies(
    p_funnel_id UUID,
    p_threshold NUMERIC DEFAULT 0.3
)
RETURNS TABLE (
    stage TEXT,
    dropoff_rate NUMERIC,
    is_anomaly BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH stage_stats AS (
        SELECT
            e.stage,
            COUNT(*) FILTER (WHERE e.event_type = 'enter') as entries,
            COUNT(*) FILTER (WHERE e.event_type IN ('drop_off', 'exit')) as dropoffs
        FROM synthex_library_funnel_events e
        WHERE e.funnel_id = p_funnel_id
          AND e.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY e.stage
    )
    SELECT
        s.stage,
        CASE WHEN s.entries > 0 THEN s.dropoffs::numeric / s.entries ELSE 0 END as dropoff_rate,
        CASE WHEN s.entries > 0 THEN (s.dropoffs::numeric / s.entries) > p_threshold ELSE FALSE END as is_anomaly
    FROM stage_stats s
    ORDER BY s.stage;
END;
$$ LANGUAGE plpgsql;

-- Function to update funnel metrics on event insert
CREATE OR REPLACE FUNCTION update_funnel_dropoff_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a drop-off event, update the dropoff record
    IF NEW.event_type = 'drop_off' THEN
        INSERT INTO synthex_library_funnel_dropoffs (
            tenant_id,
            funnel_id,
            stage,
            next_stage,
            stage_position,
            dropoff_count,
            total_entered,
            analysis_period_start,
            analysis_period_end
        )
        VALUES (
            NEW.tenant_id,
            NEW.funnel_id,
            NEW.stage,
            NULL,
            NEW.stage_position,
            1,
            1,
            DATE_TRUNC('day', NOW()),
            DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        )
        ON CONFLICT (tenant_id, funnel_id, stage, DATE_TRUNC('day', NOW()))
        DO UPDATE SET
            dropoff_count = synthex_library_funnel_dropoffs.dropoff_count + 1,
            total_entered = synthex_library_funnel_dropoffs.total_entered + 1,
            dropoff_rate = (synthex_library_funnel_dropoffs.dropoff_count + 1)::numeric /
                          (synthex_library_funnel_dropoffs.total_entered + 1),
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger creation commented out to avoid constraint issues
-- DROP TRIGGER IF EXISTS trg_funnel_dropoff_metrics ON synthex_library_funnel_events;
-- CREATE TRIGGER trg_funnel_dropoff_metrics
--     AFTER INSERT ON synthex_library_funnel_events
--     FOR EACH ROW
--     EXECUTE FUNCTION update_funnel_dropoff_metrics();
