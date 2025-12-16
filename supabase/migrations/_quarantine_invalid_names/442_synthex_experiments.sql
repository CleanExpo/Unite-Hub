-- =====================================================
-- Migration 442: Synthex Experiment Engine
-- Phase D13: Automated Cross-Channel Experiments
-- =====================================================
-- A/B testing, multivariate experiments, and statistical
-- analysis across all marketing channels.
-- =====================================================

-- =====================================================
-- Table: synthex_library_experiments
-- Core experiment definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Experiment Identity
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT, -- What we're testing

    -- Type & Configuration
    experiment_type TEXT DEFAULT 'ab' CHECK (experiment_type IN (
        'ab', 'multivariate', 'bandit', 'holdout'
    )),
    channels TEXT[] DEFAULT '{}', -- ['email', 'social', 'ads']

    -- Targeting
    audience_filter JSONB DEFAULT '{}', -- Audience criteria
    traffic_allocation INTEGER DEFAULT 100, -- % of traffic in experiment
    sample_size_target INTEGER, -- Desired sample size

    -- Timing
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    auto_end_on_significance BOOLEAN DEFAULT false,
    significance_threshold NUMERIC(4,3) DEFAULT 0.95, -- 95%

    -- Primary Metric
    primary_metric TEXT DEFAULT 'conversion_rate', -- What we're optimizing
    secondary_metrics TEXT[] DEFAULT '{}',

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'
    )),

    -- Results
    winner_variant_id UUID,
    winning_confidence NUMERIC(5,4),
    concluded_at TIMESTAMPTZ,
    conclusion_reason TEXT,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_experiments IS 'Cross-channel experiment definitions';

-- =====================================================
-- Table: synthex_library_experiment_variants
-- Experiment variants (A, B, C, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiment_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_library_experiments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Variant Identity
    name TEXT NOT NULL, -- 'Control', 'Variant A', etc.
    label TEXT, -- Short label
    description TEXT,
    is_control BOOLEAN DEFAULT false,

    -- Content Variations
    content JSONB DEFAULT '{}', -- Variant-specific content
    subject_line TEXT, -- For email
    headline TEXT,
    body_text TEXT,
    cta_text TEXT,
    image_url TEXT,

    -- Channel-specific
    channel TEXT, -- Which channel this variant is for
    template_id UUID, -- Reference to template

    -- Traffic
    traffic_split INTEGER DEFAULT 50, -- % of experiment traffic
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_experiment_variants IS 'Experiment variant definitions';

-- =====================================================
-- Table: synthex_library_experiment_assignments
-- User/contact assignments to variants
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_library_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES synthex_library_experiment_variants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Subject
    contact_id UUID,
    session_id TEXT,
    user_id UUID,
    device_fingerprint TEXT,

    -- Assignment
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assignment_reason TEXT, -- 'random', 'sticky', 'manual'

    -- Ensure one assignment per subject per experiment
    UNIQUE(experiment_id, contact_id),
    UNIQUE(experiment_id, session_id)
);

COMMENT ON TABLE synthex_library_experiment_assignments IS 'Variant assignments for subjects';

-- =====================================================
-- Table: synthex_library_experiment_events
-- Raw event tracking for experiments
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_library_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES synthex_library_experiment_variants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Event Details
    event_type TEXT NOT NULL, -- 'impression', 'click', 'conversion', 'revenue'
    event_value NUMERIC, -- For revenue or custom values

    -- Subject
    contact_id UUID,
    session_id TEXT,

    -- Context
    channel TEXT,
    source TEXT,
    device TEXT,
    location JSONB DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_experiment_events IS 'Raw experiment events';

-- =====================================================
-- Table: synthex_library_experiment_results
-- Aggregated results per variant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_library_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES synthex_library_experiment_variants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Counts
    impressions INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Values
    total_revenue NUMERIC DEFAULT 0,
    average_order_value NUMERIC,

    -- Rates
    click_rate NUMERIC(6,5), -- CTR
    conversion_rate NUMERIC(6,5),
    revenue_per_visitor NUMERIC,

    -- Statistical Analysis
    confidence_vs_control NUMERIC(5,4), -- vs control variant
    lift_vs_control NUMERIC(6,4), -- % improvement
    p_value NUMERIC(8,7),
    z_score NUMERIC(8,4),
    standard_error NUMERIC(8,6),

    -- Time-based
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT now(),

    UNIQUE(experiment_id, variant_id, period_start)
);

COMMENT ON TABLE synthex_library_experiment_results IS 'Aggregated experiment results';

-- =====================================================
-- Table: synthex_library_experiment_insights
-- AI-generated insights about experiments
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_experiment_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_library_experiments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Insight
    insight_type TEXT NOT NULL, -- 'winner', 'trend', 'recommendation', 'warning'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence NUMERIC(3,2),

    -- Action
    suggested_action TEXT,
    action_taken BOOLEAN DEFAULT false,
    action_taken_at TIMESTAMPTZ,
    action_taken_by UUID,

    -- AI
    ai_model TEXT,
    ai_reasoning TEXT,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'dismissed', 'actioned'
    )),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_experiment_insights IS 'AI insights about experiments';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_experiments_tenant
    ON synthex_library_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status
    ON synthex_library_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_dates
    ON synthex_library_experiments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_exp_variants_experiment
    ON synthex_library_experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_variants_tenant
    ON synthex_library_experiment_variants(tenant_id);

CREATE INDEX IF NOT EXISTS idx_exp_assignments_experiment
    ON synthex_library_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_contact
    ON synthex_library_experiment_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_session
    ON synthex_library_experiment_assignments(session_id);

CREATE INDEX IF NOT EXISTS idx_exp_events_experiment
    ON synthex_library_experiment_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_events_variant
    ON synthex_library_experiment_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_exp_events_type
    ON synthex_library_experiment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_exp_events_date
    ON synthex_library_experiment_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exp_results_experiment
    ON synthex_library_experiment_results(experiment_id);

CREATE INDEX IF NOT EXISTS idx_exp_insights_experiment
    ON synthex_library_experiment_insights(experiment_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_experiment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_experiment_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY exp_tenant_policy ON synthex_library_experiments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY exp_variants_tenant_policy ON synthex_library_experiment_variants
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY exp_assignments_tenant_policy ON synthex_library_experiment_assignments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY exp_events_tenant_policy ON synthex_library_experiment_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY exp_results_tenant_policy ON synthex_library_experiment_results
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY exp_insights_tenant_policy ON synthex_library_experiment_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_experiment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_experiments_updated ON synthex_library_experiments;
CREATE TRIGGER trigger_experiments_updated
    BEFORE UPDATE ON synthex_library_experiments
    FOR EACH ROW EXECUTE FUNCTION update_experiment_timestamp();

DROP TRIGGER IF EXISTS trigger_exp_variants_updated ON synthex_library_experiment_variants;
CREATE TRIGGER trigger_exp_variants_updated
    BEFORE UPDATE ON synthex_library_experiment_variants
    FOR EACH ROW EXECUTE FUNCTION update_experiment_timestamp();

-- =====================================================
-- Function: Calculate statistical significance
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_experiment_significance(
    p_control_conversions INTEGER,
    p_control_visitors INTEGER,
    p_variant_conversions INTEGER,
    p_variant_visitors INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_control_rate NUMERIC;
    v_variant_rate NUMERIC;
    v_pooled_rate NUMERIC;
    v_standard_error NUMERIC;
    v_z_score NUMERIC;
    v_p_value NUMERIC;
    v_lift NUMERIC;
BEGIN
    -- Avoid division by zero
    IF p_control_visitors = 0 OR p_variant_visitors = 0 THEN
        RETURN jsonb_build_object(
            'significant', false,
            'error', 'Insufficient data'
        );
    END IF;

    -- Calculate rates
    v_control_rate := p_control_conversions::NUMERIC / p_control_visitors;
    v_variant_rate := p_variant_conversions::NUMERIC / p_variant_visitors;

    -- Pooled rate
    v_pooled_rate := (p_control_conversions + p_variant_conversions)::NUMERIC /
                     (p_control_visitors + p_variant_visitors);

    -- Standard error
    v_standard_error := SQRT(
        v_pooled_rate * (1 - v_pooled_rate) *
        (1.0 / p_control_visitors + 1.0 / p_variant_visitors)
    );

    -- Z-score
    IF v_standard_error > 0 THEN
        v_z_score := (v_variant_rate - v_control_rate) / v_standard_error;
    ELSE
        v_z_score := 0;
    END IF;

    -- Approximate p-value (two-tailed)
    -- Using normal distribution approximation
    v_p_value := 2 * (1 - (0.5 * (1 + SIGN(v_z_score) *
        SQRT(1 - EXP(-2 * v_z_score * v_z_score / 3.14159)))));

    -- Lift
    IF v_control_rate > 0 THEN
        v_lift := ((v_variant_rate - v_control_rate) / v_control_rate) * 100;
    ELSE
        v_lift := 0;
    END IF;

    RETURN jsonb_build_object(
        'control_rate', ROUND(v_control_rate, 6),
        'variant_rate', ROUND(v_variant_rate, 6),
        'z_score', ROUND(v_z_score, 4),
        'p_value', ROUND(v_p_value, 6),
        'lift_percent', ROUND(v_lift, 2),
        'significant', v_p_value < 0.05,
        'confidence', ROUND((1 - v_p_value) * 100, 2)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Assign visitor to variant
-- =====================================================
CREATE OR REPLACE FUNCTION assign_experiment_variant(
    p_experiment_id UUID,
    p_tenant_id UUID,
    p_contact_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assignment synthex_library_experiment_assignments%ROWTYPE;
    v_variant_id UUID;
    v_random NUMERIC;
    v_cumulative INTEGER := 0;
BEGIN
    -- Check for existing assignment
    SELECT * INTO v_assignment
    FROM synthex_library_experiment_assignments
    WHERE experiment_id = p_experiment_id
      AND (contact_id = p_contact_id OR session_id = p_session_id)
    LIMIT 1;

    IF v_assignment.id IS NOT NULL THEN
        RETURN v_assignment.variant_id;
    END IF;

    -- Random assignment based on traffic split
    v_random := random() * 100;

    SELECT id INTO v_variant_id
    FROM (
        SELECT id, traffic_split,
               SUM(traffic_split) OVER (ORDER BY created_at) as cumulative
        FROM synthex_library_experiment_variants
        WHERE experiment_id = p_experiment_id AND is_active = true
    ) sub
    WHERE cumulative >= v_random
    ORDER BY cumulative
    LIMIT 1;

    -- Create assignment
    IF v_variant_id IS NOT NULL THEN
        INSERT INTO synthex_library_experiment_assignments (
            experiment_id, variant_id, tenant_id, contact_id, session_id
        ) VALUES (
            p_experiment_id, v_variant_id, p_tenant_id, p_contact_id, p_session_id
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;
