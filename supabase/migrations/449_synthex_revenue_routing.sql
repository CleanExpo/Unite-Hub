-- =====================================================
-- Migration 449: Synthex Multi-Channel Revenue Routing
-- Phase D20: Revenue Attribution & Channel Optimization
-- =====================================================
-- AI-powered revenue tracking with multi-channel attribution,
-- routing rules, and optimization recommendations.
-- =====================================================

-- =====================================================
-- Table: synthex_library_revenue_events
-- Individual revenue events from all channels
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_revenue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Event Identity
    event_type TEXT NOT NULL CHECK (event_type IN (
        'sale', 'subscription', 'renewal', 'upsell', 'cross_sell',
        'refund', 'chargeback', 'credit', 'adjustment'
    )),
    external_id TEXT, -- External transaction ID

    -- Revenue
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'AUD',
    amount_usd NUMERIC, -- Converted for comparison

    -- Attribution
    channel TEXT NOT NULL, -- 'organic', 'paid_search', 'social', 'email', 'referral', 'direct', etc.
    source TEXT, -- Specific source (google, facebook, newsletter, etc.)
    medium TEXT, -- Marketing medium
    campaign_id UUID,
    campaign_name TEXT,

    -- Lead/Customer
    lead_id UUID,
    contact_id UUID,
    customer_id TEXT,
    is_new_customer BOOLEAN DEFAULT true,

    -- Product
    product_id TEXT,
    product_name TEXT,
    product_category TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC,

    -- Attribution Model
    attribution_model TEXT DEFAULT 'last_touch', -- 'first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'
    attribution_weight NUMERIC(4,3) DEFAULT 1.0, -- For multi-touch attribution
    touchpoints JSONB DEFAULT '[]', -- All touchpoints in journey

    -- Cost & Margin
    cost_of_goods NUMERIC,
    gross_margin NUMERIC,
    acquisition_cost NUMERIC,

    -- Timing
    occurred_at TIMESTAMPTZ DEFAULT now(),
    first_touch_at TIMESTAMPTZ,
    days_to_convert INTEGER,

    -- AI Analysis
    predicted_ltv NUMERIC,
    churn_risk NUMERIC(4,3), -- 0-1
    ai_insights JSONB DEFAULT '{}',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_revenue_events IS 'Individual revenue events from all channels';

-- =====================================================
-- Table: synthex_library_revenue_routing
-- Rules for revenue channel routing and optimization
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_revenue_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Identity
    rule_name TEXT NOT NULL,
    description TEXT,

    -- Channels
    source_channels TEXT[] NOT NULL, -- Channels this rule applies to
    target_channel TEXT, -- Channel to route to (if routing)
    action TEXT NOT NULL CHECK (action IN (
        'route', 'boost', 'throttle', 'allocate', 'alert', 'optimize'
    )),

    -- Conditions
    conditions JSONB NOT NULL DEFAULT '[]', -- [{ field, operator, value }]
    min_revenue NUMERIC,
    min_events INTEGER,

    -- Priority & Weighting
    priority INTEGER DEFAULT 1,
    boost_factor NUMERIC(4,2) DEFAULT 1.0, -- Multiplier for boost action
    allocation_percent NUMERIC(5,2), -- For allocate action

    -- Timing
    active_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
    active_hours JSONB DEFAULT '{}', -- { start: 9, end: 17 }
    effective_from TIMESTAMPTZ,
    effective_until TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_automated BOOLEAN DEFAULT false,

    -- Performance
    times_triggered INTEGER DEFAULT 0,
    total_revenue_impacted NUMERIC DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_revenue_routing IS 'Rules for revenue channel routing';

-- =====================================================
-- Table: synthex_library_channel_performance
-- Channel performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_channel_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel
    channel TEXT NOT NULL,
    source TEXT,

    -- Period
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Volume
    event_count INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,

    -- Revenue
    total_revenue NUMERIC DEFAULT 0,
    avg_order_value NUMERIC,
    revenue_per_customer NUMERIC,

    -- Costs
    acquisition_cost NUMERIC,
    cost_per_acquisition NUMERIC,
    marketing_spend NUMERIC,

    -- Efficiency
    roas NUMERIC, -- Return on Ad Spend
    roi NUMERIC, -- Return on Investment
    conversion_rate NUMERIC(6,4),
    margin_rate NUMERIC(5,4),

    -- Comparison
    revenue_change_percent NUMERIC, -- vs previous period
    event_change_percent NUMERIC,
    rank_by_revenue INTEGER,
    rank_by_efficiency INTEGER,

    -- AI Insights
    ai_score NUMERIC(4,2), -- 0-100 channel health
    ai_recommendations TEXT[],
    ai_prediction_next_period NUMERIC,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_channel_performance IS 'Channel performance metrics';

-- =====================================================
-- Table: synthex_library_attribution_paths
-- Multi-touch attribution paths
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_attribution_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Path Identity
    path_hash TEXT NOT NULL, -- Hash of ordered touchpoints
    path_sequence TEXT[] NOT NULL, -- ['email', 'organic', 'paid_search']

    -- Stats
    occurrence_count INTEGER DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    avg_revenue NUMERIC,
    conversion_rate NUMERIC(6,4),

    -- Timing
    avg_path_length_days NUMERIC,
    avg_touchpoint_count NUMERIC,

    -- First/Last
    first_touch_channel TEXT,
    last_touch_channel TEXT,
    converting_channel TEXT,

    -- Period
    period_type TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- AI Analysis
    path_score NUMERIC(4,2), -- 0-100 effectiveness
    is_optimal BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, path_hash, period_type, period_start)
);

COMMENT ON TABLE synthex_library_attribution_paths IS 'Multi-touch attribution paths';

-- =====================================================
-- Table: synthex_library_revenue_forecasts
-- Revenue predictions by channel
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_revenue_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Scope
    channel TEXT, -- null = all channels
    forecast_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'

    -- Period
    forecast_date TIMESTAMPTZ NOT NULL,
    horizon_days INTEGER NOT NULL,

    -- Predictions
    predicted_revenue NUMERIC NOT NULL,
    predicted_events INTEGER,
    confidence_lower NUMERIC,
    confidence_upper NUMERIC,
    confidence_level NUMERIC(4,3) DEFAULT 0.95,

    -- Factors
    contributing_factors JSONB DEFAULT '[]', -- [{ factor, weight, direction }]
    seasonality_adjustment NUMERIC,
    trend_adjustment NUMERIC,

    -- AI Model
    ai_model TEXT,
    model_version TEXT,
    model_accuracy NUMERIC(5,4), -- Historical MAPE

    -- Actuals (filled in later)
    actual_revenue NUMERIC,
    actual_events INTEGER,
    forecast_error NUMERIC,
    was_accurate BOOLEAN,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_revenue_forecasts IS 'Revenue predictions by channel';

-- =====================================================
-- Table: synthex_library_revenue_alerts
-- Revenue-related alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_revenue_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Alert Type
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'revenue_spike', 'revenue_drop', 'channel_anomaly', 'high_value_transaction',
        'refund_spike', 'attribution_issue', 'forecast_miss', 'opportunity'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Related
    channel TEXT,
    revenue_event_id UUID REFERENCES synthex_library_revenue_events(id),

    -- Metrics
    metric_name TEXT,
    metric_value NUMERIC,
    threshold_value NUMERIC,
    change_percent NUMERIC,

    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'acknowledged', 'investigating', 'resolved', 'dismissed'
    )),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_revenue_alerts IS 'Revenue-related alerts';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_revenue_events_tenant
    ON synthex_library_revenue_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_channel
    ON synthex_library_revenue_events(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_revenue_events_date
    ON synthex_library_revenue_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_lead
    ON synthex_library_revenue_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_type
    ON synthex_library_revenue_events(event_type);

CREATE INDEX IF NOT EXISTS idx_revenue_routing_tenant
    ON synthex_library_revenue_routing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_routing_active
    ON synthex_library_revenue_routing(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_channel_performance_tenant
    ON synthex_library_channel_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_performance_channel
    ON synthex_library_channel_performance(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_channel_performance_period
    ON synthex_library_channel_performance(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_attribution_paths_tenant
    ON synthex_library_attribution_paths(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attribution_paths_hash
    ON synthex_library_attribution_paths(path_hash);

CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_tenant
    ON synthex_library_revenue_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_date
    ON synthex_library_revenue_forecasts(forecast_date);

CREATE INDEX IF NOT EXISTS idx_revenue_alerts_tenant
    ON synthex_library_revenue_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_alerts_status
    ON synthex_library_revenue_alerts(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_revenue_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_channel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_attribution_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_revenue_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY revenue_events_tenant_policy ON synthex_library_revenue_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY revenue_routing_tenant_policy ON synthex_library_revenue_routing
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY channel_performance_tenant_policy ON synthex_library_channel_performance
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY attribution_paths_tenant_policy ON synthex_library_attribution_paths
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY revenue_forecasts_tenant_policy ON synthex_library_revenue_forecasts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY revenue_alerts_tenant_policy ON synthex_library_revenue_alerts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_revenue_routing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_revenue_routing_updated ON synthex_library_revenue_routing;
CREATE TRIGGER trigger_revenue_routing_updated
    BEFORE UPDATE ON synthex_library_revenue_routing
    FOR EACH ROW EXECUTE FUNCTION update_revenue_routing_timestamp();

-- =====================================================
-- Function: Update routing stats on trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_routing_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE synthex_library_revenue_routing
    SET
        times_triggered = times_triggered + 1,
        total_revenue_impacted = total_revenue_impacted + NEW.amount,
        last_triggered_at = now()
    WHERE id = (NEW.meta->>'routing_rule_id')::uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Calculate channel ROAS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_channel_roas(
    p_revenue NUMERIC,
    p_spend NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    IF p_spend IS NULL OR p_spend = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(p_revenue / p_spend, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Calculate attribution weight
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_attribution_weight(
    p_model TEXT,
    p_position INTEGER,
    p_total_touches INTEGER
)
RETURNS NUMERIC AS $$
BEGIN
    IF p_total_touches = 0 THEN
        RETURN 0;
    END IF;

    RETURN CASE p_model
        WHEN 'first_touch' THEN
            CASE WHEN p_position = 1 THEN 1.0 ELSE 0.0 END
        WHEN 'last_touch' THEN
            CASE WHEN p_position = p_total_touches THEN 1.0 ELSE 0.0 END
        WHEN 'linear' THEN
            1.0 / p_total_touches
        WHEN 'time_decay' THEN
            -- More weight to recent touches
            POWER(0.5, (p_total_touches - p_position)::NUMERIC / 7)
        WHEN 'position_based' THEN
            -- 40% first, 40% last, 20% middle
            CASE
                WHEN p_position = 1 THEN 0.4
                WHEN p_position = p_total_touches THEN 0.4
                ELSE 0.2 / GREATEST(p_total_touches - 2, 1)
            END
        ELSE
            1.0 / p_total_touches
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
