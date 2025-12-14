-- =====================================================
-- Migration 458: Synthex Attribution Memory Engine v2
-- Phase D29: Contact-Level Attribution Memory
-- =====================================================
-- AI-powered attribution memory with event vectors,
-- channel bias tracking, and journey reconstruction.
-- =====================================================

-- =====================================================
-- Table: synthex_library_attribution_contacts
-- Contact-level attribution profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,
    -- References contacts.id or synthex_library_leads.id

    -- Attribution Profile
    attribution_profile JSONB DEFAULT '{}',
    -- {
    --   primary_channel: 'organic_search',
    --   preferred_channels: ['email', 'social'],
    --   channel_sensitivities: { email: 0.8, social: 0.6 },
    --   response_patterns: { time_of_day: 'morning', day_of_week: 'tuesday' }
    -- }

    -- Channel Weights (learned over time)
    channel_weights JSONB DEFAULT '{}',
    -- { organic_search: 0.35, email: 0.25, social: 0.2, paid_ads: 0.15, direct: 0.05 }

    -- First/Last Touch
    first_touch_channel TEXT,
    first_touch_campaign TEXT,
    first_touch_at TIMESTAMPTZ,
    last_touch_channel TEXT,
    last_touch_campaign TEXT,
    last_touch_at TIMESTAMPTZ,

    -- Attribution Stats
    total_touchpoints INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    avg_time_to_convert INTERVAL,
    avg_touchpoints_to_convert NUMERIC,

    -- AI Predictions
    predicted_next_channel TEXT,
    predicted_conversion_probability NUMERIC DEFAULT 0,
    predicted_lifetime_value NUMERIC,
    ai_persona_type TEXT,
    -- 'quick_decider', 'researcher', 'price_sensitive', 'brand_loyal', 'multi_channel'

    -- Bias Detection
    channel_bias_score NUMERIC DEFAULT 0,
    -- 0 = no bias, 1 = heavily biased toward specific channel
    bias_explanation JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    last_event_at TIMESTAMPTZ,
    last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, contact_id)
);

-- =====================================================
-- Table: synthex_library_attribution_events
-- Individual touchpoint/attribution events
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    attribution_contact_id UUID REFERENCES synthex_library_attribution_contacts(id) ON DELETE CASCADE,

    -- Event Classification
    event_type TEXT NOT NULL,
    -- 'impression', 'click', 'page_view', 'form_submit', 'email_open',
    -- 'email_click', 'call', 'chat', 'demo_request', 'purchase', 'signup'
    event_category TEXT,
    -- 'awareness', 'consideration', 'conversion', 'retention'

    -- Channel Info
    channel TEXT NOT NULL,
    -- 'organic_search', 'paid_search', 'social_organic', 'social_paid',
    -- 'email', 'direct', 'referral', 'display', 'video', 'affiliate'
    sub_channel TEXT,
    -- e.g., 'google', 'facebook', 'linkedin', 'newsletter', 'blog'

    -- Campaign Info
    campaign_id TEXT,
    campaign_name TEXT,
    ad_group TEXT,
    creative_id TEXT,

    -- Source/Medium
    source TEXT,
    medium TEXT,
    content TEXT,
    term TEXT, -- keyword

    -- Page Info
    landing_page TEXT,
    referrer TEXT,

    -- Event Vector (embedding for ML)
    event_vector FLOAT8[] DEFAULT '{}',
    -- 128-dimensional embedding capturing event context

    -- Value Attribution
    attributed_value NUMERIC DEFAULT 0,
    -- Value attributed to this specific touchpoint
    attribution_model TEXT DEFAULT 'data_driven',
    -- 'first_touch', 'last_touch', 'linear', 'time_decay',
    -- 'position_based', 'data_driven', 'markov_chain'
    attribution_weight NUMERIC DEFAULT 0,
    -- Weight of this touchpoint in conversion path

    -- Conversion Info
    is_conversion_event BOOLEAN DEFAULT FALSE,
    conversion_id UUID,
    conversion_value NUMERIC,

    -- Timing
    session_id TEXT,
    session_sequence INTEGER, -- position in session
    journey_sequence INTEGER, -- position in overall journey

    -- Device/Context
    device_type TEXT,
    -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    geo_country TEXT,
    geo_region TEXT,
    geo_city TEXT,

    -- Metadata
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_attribution_journeys
-- Complete customer journeys for analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    attribution_contact_id UUID REFERENCES synthex_library_attribution_contacts(id) ON DELETE CASCADE,

    -- Journey Classification
    journey_type TEXT DEFAULT 'acquisition',
    -- 'acquisition', 'activation', 'retention', 'expansion', 'reactivation'
    journey_status TEXT DEFAULT 'in_progress',
    -- 'in_progress', 'converted', 'abandoned', 'churned'

    -- Journey Timeline
    started_at TIMESTAMPTZ NOT NULL,
    converted_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTERVAL,

    -- Touchpoint Summary
    total_touchpoints INTEGER DEFAULT 0,
    touchpoint_sequence TEXT[] DEFAULT '{}',
    -- ['organic_search', 'email', 'direct', 'purchase']
    channel_sequence TEXT[] DEFAULT '{}',
    unique_channels INTEGER DEFAULT 0,

    -- Conversion Info
    conversion_id UUID,
    conversion_type TEXT,
    -- 'purchase', 'signup', 'demo', 'subscription', 'upgrade'
    conversion_value NUMERIC DEFAULT 0,

    -- Attribution Analysis
    attribution_breakdown JSONB DEFAULT '{}',
    -- {
    --   first_touch: { channel: 'organic_search', weight: 0.4 },
    --   last_touch: { channel: 'direct', weight: 0.4 },
    --   assists: [{ channel: 'email', weight: 0.2 }]
    -- }

    -- AI Analysis
    ai_journey_score NUMERIC DEFAULT 0,
    -- Overall health/efficiency of the journey
    ai_friction_points JSONB DEFAULT '[]',
    -- [{ position: 2, issue: 'long_delay', severity: 0.7 }]
    ai_optimization_suggestions JSONB DEFAULT '[]',
    -- [{ suggestion: 'add_email_touchpoint', expected_lift: 0.15 }]

    -- Comparison to Ideal
    similarity_to_ideal_journey NUMERIC DEFAULT 0,
    deviation_analysis JSONB DEFAULT '{}',

    -- Metadata
    model_version TEXT DEFAULT 'v1',
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_attribution_models
-- Configured attribution models per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Model Info
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    -- 'first_touch', 'last_touch', 'linear', 'time_decay',
    -- 'position_based', 'data_driven', 'markov_chain', 'shapley'
    model_description TEXT,

    -- Model Configuration
    config JSONB DEFAULT '{}',
    -- For time_decay: { half_life_days: 7 }
    -- For position_based: { first: 0.4, last: 0.4, middle: 0.2 }
    -- For data_driven: { min_conversions: 100, lookback_days: 90 }

    -- Model Performance
    model_accuracy NUMERIC,
    model_r_squared NUMERIC,
    last_trained_at TIMESTAMPTZ,
    training_sample_size INTEGER,

    -- Validation
    validation_metrics JSONB DEFAULT '{}',
    -- { mae: 0.12, rmse: 0.18, precision: 0.85, recall: 0.78 }

    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, model_name)
);

-- =====================================================
-- Table: synthex_library_channel_performance
-- Aggregated channel performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_channel_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel Info
    channel TEXT NOT NULL,
    sub_channel TEXT,

    -- Time Period
    period_type TEXT NOT NULL,
    -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Volume Metrics
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,

    -- Engagement Metrics
    click_through_rate NUMERIC DEFAULT 0,
    avg_session_duration INTEGER,
    bounce_rate NUMERIC,
    pages_per_session NUMERIC,

    -- Conversion Metrics
    total_conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    conversion_value NUMERIC DEFAULT 0,
    avg_conversion_value NUMERIC,

    -- Attribution Metrics (by model)
    first_touch_conversions INTEGER DEFAULT 0,
    first_touch_value NUMERIC DEFAULT 0,
    last_touch_conversions INTEGER DEFAULT 0,
    last_touch_value NUMERIC DEFAULT 0,
    linear_conversions NUMERIC DEFAULT 0,
    linear_value NUMERIC DEFAULT 0,
    data_driven_conversions NUMERIC DEFAULT 0,
    data_driven_value NUMERIC DEFAULT 0,

    -- Cost Metrics
    total_spend NUMERIC DEFAULT 0,
    cost_per_click NUMERIC,
    cost_per_conversion NUMERIC,
    return_on_ad_spend NUMERIC,

    -- Position in Journey
    avg_journey_position NUMERIC,
    -- 1 = typically first, 5 = typically last
    assist_rate NUMERIC DEFAULT 0,
    -- How often this channel assists vs converts directly

    -- AI Insights
    ai_channel_score NUMERIC,
    ai_recommendations JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, channel, sub_channel, period_type, period_start)
);

-- =====================================================
-- Table: synthex_library_attribution_insights
-- AI-generated attribution insights
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Insight Classification
    insight_type TEXT NOT NULL,
    -- 'channel_efficiency', 'journey_optimization', 'budget_reallocation',
    -- 'timing_optimization', 'persona_insight', 'anomaly_detection'
    insight_category TEXT,
    -- 'performance', 'opportunity', 'risk', 'trend'

    -- Targeting
    target_channel TEXT,
    target_segment TEXT,
    target_journey_type TEXT,

    -- Scoring
    score NUMERIC DEFAULT 0 CHECK (score >= 0 AND score <= 1),
    confidence NUMERIC DEFAULT 0.7,
    impact_score NUMERIC DEFAULT 0.5,
    urgency_score NUMERIC DEFAULT 0.5,

    -- Insight Content
    headline TEXT NOT NULL,
    description TEXT,
    supporting_data JSONB DEFAULT '{}',
    -- {
    --   current_value: 0.12,
    --   benchmark: 0.18,
    --   trend: 'declining',
    --   affected_contacts: 1500
    -- }

    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    -- [
    --   { action: 'increase_budget', channel: 'email', expected_lift: 0.15 },
    --   { action: 'optimize_timing', details: 'shift to morning sends' }
    -- ]

    -- Status
    status TEXT DEFAULT 'active',
    -- 'active', 'acted_upon', 'dismissed', 'expired'
    acted_upon_at TIMESTAMPTZ,
    outcome JSONB DEFAULT '{}',

    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Metadata
    model_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attr_contacts_tenant ON synthex_library_attribution_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_contacts_contact ON synthex_library_attribution_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_attr_contacts_persona ON synthex_library_attribution_contacts(ai_persona_type);
CREATE INDEX IF NOT EXISTS idx_attr_contacts_last_event ON synthex_library_attribution_contacts(last_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_attr_events_tenant ON synthex_library_attribution_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_events_contact ON synthex_library_attribution_events(attribution_contact_id);
CREATE INDEX IF NOT EXISTS idx_attr_events_channel ON synthex_library_attribution_events(channel);
CREATE INDEX IF NOT EXISTS idx_attr_events_type ON synthex_library_attribution_events(event_type);
CREATE INDEX IF NOT EXISTS idx_attr_events_campaign ON synthex_library_attribution_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attr_events_conversion ON synthex_library_attribution_events(is_conversion_event) WHERE is_conversion_event = TRUE;
CREATE INDEX IF NOT EXISTS idx_attr_events_created ON synthex_library_attribution_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attr_journeys_tenant ON synthex_library_attribution_journeys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_journeys_contact ON synthex_library_attribution_journeys(attribution_contact_id);
CREATE INDEX IF NOT EXISTS idx_attr_journeys_type ON synthex_library_attribution_journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_attr_journeys_status ON synthex_library_attribution_journeys(journey_status);
CREATE INDEX IF NOT EXISTS idx_attr_journeys_converted ON synthex_library_attribution_journeys(converted_at DESC);

CREATE INDEX IF NOT EXISTS idx_attr_models_tenant ON synthex_library_attribution_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_models_type ON synthex_library_attribution_models(model_type);
CREATE INDEX IF NOT EXISTS idx_attr_models_default ON synthex_library_attribution_models(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_channel_perf_tenant ON synthex_library_channel_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_perf_channel ON synthex_library_channel_performance(channel);
CREATE INDEX IF NOT EXISTS idx_channel_perf_period ON synthex_library_channel_performance(period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_attr_insights_tenant ON synthex_library_attribution_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_insights_type ON synthex_library_attribution_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_attr_insights_status ON synthex_library_attribution_insights(status);
CREATE INDEX IF NOT EXISTS idx_attr_insights_score ON synthex_library_attribution_insights(score DESC);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_attribution_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_attribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_attribution_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_attribution_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_channel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_attribution_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attr_contacts_tenant_isolation" ON synthex_library_attribution_contacts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "attr_events_tenant_isolation" ON synthex_library_attribution_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "attr_journeys_tenant_isolation" ON synthex_library_attribution_journeys
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "attr_models_tenant_isolation" ON synthex_library_attribution_models
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "channel_perf_tenant_isolation" ON synthex_library_channel_performance
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "attr_insights_tenant_isolation" ON synthex_library_attribution_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function to calculate attribution for a journey using different models
CREATE OR REPLACE FUNCTION calculate_journey_attribution(
    p_journey_id UUID,
    p_model_type TEXT DEFAULT 'linear'
)
RETURNS JSONB AS $$
DECLARE
    v_journey RECORD;
    v_total_events INTEGER;
    v_channel_weights JSONB := '{}';
    v_event RECORD;
    v_weight NUMERIC;
    v_position INTEGER := 0;
    v_half_life NUMERIC := 7; -- days for time decay
BEGIN
    -- Get journey info
    SELECT * INTO v_journey
    FROM synthex_library_attribution_journeys
    WHERE id = p_journey_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Journey not found');
    END IF;

    -- Get total events count
    SELECT COUNT(*) INTO v_total_events
    FROM synthex_library_attribution_events
    WHERE attribution_contact_id = v_journey.attribution_contact_id
    AND created_at BETWEEN v_journey.started_at AND COALESCE(v_journey.converted_at, v_journey.ended_at, NOW());

    IF v_total_events = 0 THEN
        RETURN jsonb_build_object('error', 'No events found');
    END IF;

    -- Calculate weights based on model type
    FOR v_event IN
        SELECT *
        FROM synthex_library_attribution_events
        WHERE attribution_contact_id = v_journey.attribution_contact_id
        AND created_at BETWEEN v_journey.started_at AND COALESCE(v_journey.converted_at, v_journey.ended_at, NOW())
        ORDER BY created_at
    LOOP
        v_position := v_position + 1;

        CASE p_model_type
            WHEN 'first_touch' THEN
                v_weight := CASE WHEN v_position = 1 THEN 1.0 ELSE 0.0 END;

            WHEN 'last_touch' THEN
                v_weight := CASE WHEN v_position = v_total_events THEN 1.0 ELSE 0.0 END;

            WHEN 'linear' THEN
                v_weight := 1.0 / v_total_events;

            WHEN 'position_based' THEN
                -- 40% first, 40% last, 20% middle (split)
                v_weight := CASE
                    WHEN v_position = 1 THEN 0.4
                    WHEN v_position = v_total_events THEN 0.4
                    ELSE 0.2 / GREATEST(v_total_events - 2, 1)
                END;

            WHEN 'time_decay' THEN
                -- Weight decays as events get older
                v_weight := POWER(2, -EXTRACT(EPOCH FROM (COALESCE(v_journey.converted_at, NOW()) - v_event.created_at)) / (v_half_life * 86400));

            ELSE
                v_weight := 1.0 / v_total_events; -- Default to linear
        END CASE;

        -- Aggregate by channel
        v_channel_weights := v_channel_weights || jsonb_build_object(
            v_event.channel,
            COALESCE((v_channel_weights->>v_event.channel)::numeric, 0) + v_weight
        );
    END LOOP;

    -- Normalize weights for time_decay
    IF p_model_type = 'time_decay' THEN
        DECLARE
            v_total_weight NUMERIC := 0;
            v_channel TEXT;
        BEGIN
            FOR v_channel IN SELECT jsonb_object_keys(v_channel_weights)
            LOOP
                v_total_weight := v_total_weight + (v_channel_weights->>v_channel)::numeric;
            END LOOP;

            IF v_total_weight > 0 THEN
                FOR v_channel IN SELECT jsonb_object_keys(v_channel_weights)
                LOOP
                    v_channel_weights := v_channel_weights || jsonb_build_object(
                        v_channel,
                        ROUND(((v_channel_weights->>v_channel)::numeric / v_total_weight)::numeric, 4)
                    );
                END LOOP;
            END IF;
        END;
    END IF;

    RETURN jsonb_build_object(
        'journey_id', p_journey_id,
        'model_type', p_model_type,
        'total_touchpoints', v_total_events,
        'channel_attribution', v_channel_weights,
        'conversion_value', v_journey.conversion_value
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get attribution summary for a tenant
CREATE OR REPLACE FUNCTION get_attribution_summary(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_contacts INTEGER;
    v_total_events INTEGER;
    v_total_journeys INTEGER;
    v_converted_journeys INTEGER;
    v_total_revenue NUMERIC;
    v_avg_touchpoints NUMERIC;
    v_top_channels JSONB;
BEGIN
    SELECT COUNT(*) INTO v_total_contacts
    FROM synthex_library_attribution_contacts
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    SELECT COUNT(*) INTO v_total_events
    FROM synthex_library_attribution_events
    WHERE tenant_id = p_tenant_id;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE journey_status = 'converted'),
        COALESCE(SUM(conversion_value), 0),
        COALESCE(AVG(total_touchpoints), 0)
    INTO v_total_journeys, v_converted_journeys, v_total_revenue, v_avg_touchpoints
    FROM synthex_library_attribution_journeys
    WHERE tenant_id = p_tenant_id;

    -- Top channels by conversion
    SELECT jsonb_agg(channel_data ORDER BY conversions DESC)
    INTO v_top_channels
    FROM (
        SELECT jsonb_build_object(
            'channel', channel,
            'conversions', COUNT(*) FILTER (WHERE is_conversion_event = TRUE),
            'events', COUNT(*)
        ) as channel_data
        FROM synthex_library_attribution_events
        WHERE tenant_id = p_tenant_id
        GROUP BY channel
        LIMIT 5
    ) sub;

    RETURN jsonb_build_object(
        'total_contacts', v_total_contacts,
        'total_events', v_total_events,
        'total_journeys', v_total_journeys,
        'converted_journeys', v_converted_journeys,
        'conversion_rate', CASE WHEN v_total_journeys > 0
            THEN ROUND((v_converted_journeys::numeric / v_total_journeys)::numeric, 4)
            ELSE 0 END,
        'total_revenue', v_total_revenue,
        'avg_touchpoints_to_convert', ROUND(v_avg_touchpoints::numeric, 2),
        'top_channels', COALESCE(v_top_channels, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;
