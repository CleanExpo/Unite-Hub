-- =====================================================
-- Migration 448: Synthex Lead State Machine Engine
-- Phase D19: Autonomous Lead Lifecycle Management
-- =====================================================
-- AI-powered lead state tracking with automatic transitions,
-- confidence scoring, and lifecycle analytics.
-- =====================================================

-- =====================================================
-- Table: synthex_library_lead_states
-- Current state of each lead
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_lead_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Lead Reference
    lead_id UUID NOT NULL,
    contact_id UUID, -- Optional link to contacts table

    -- State
    current_state TEXT NOT NULL CHECK (current_state IN (
        'new', 'contacted', 'engaged', 'qualified', 'proposal_sent',
        'negotiating', 'won', 'lost', 'churned', 'reactivated', 'dormant'
    )),
    previous_state TEXT,
    state_score NUMERIC(4,2) DEFAULT 0, -- 0-100 confidence in current state

    -- Entry Context
    entered_at TIMESTAMPTZ DEFAULT now(),
    entered_reason TEXT,
    entered_by TEXT, -- 'system', 'user', 'ai', 'automation'

    -- Time in State
    time_in_state_seconds INTEGER,
    expected_transition_at TIMESTAMPTZ,

    -- Engagement
    engagement_level TEXT CHECK (engagement_level IN (
        'cold', 'warming', 'warm', 'hot', 'on_fire'
    )),
    last_activity_at TIMESTAMPTZ,
    activity_count INTEGER DEFAULT 0,

    -- Value
    estimated_value NUMERIC,
    currency TEXT DEFAULT 'AUD',
    probability NUMERIC(5,4), -- 0.0000 to 1.0000

    -- AI Predictions
    next_best_action TEXT,
    predicted_next_state TEXT,
    prediction_confidence NUMERIC(4,3), -- 0-1
    ai_reasoning TEXT,
    ai_model TEXT,
    predicted_at TIMESTAMPTZ,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, lead_id)
);

COMMENT ON TABLE synthex_library_lead_states IS 'Current state of each lead in the lifecycle';

-- =====================================================
-- Table: synthex_library_state_transitions
-- History of all state changes
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Lead Reference
    lead_id UUID NOT NULL,
    lead_state_id UUID REFERENCES synthex_library_lead_states(id) ON DELETE SET NULL,

    -- Transition
    from_state TEXT,
    to_state TEXT NOT NULL,
    transition_type TEXT DEFAULT 'manual' CHECK (transition_type IN (
        'manual', 'automatic', 'ai_triggered', 'rule_based', 'time_based', 'event_based'
    )),

    -- Context
    reason TEXT,
    trigger_event TEXT,
    trigger_data JSONB DEFAULT '{}',

    -- Confidence
    confidence NUMERIC(4,3) DEFAULT 0, -- 0-1
    ai_model TEXT,
    ai_reasoning TEXT,

    -- Actor
    triggered_by TEXT, -- 'system', 'user:{id}', 'ai', 'automation:{name}'
    user_id UUID,

    -- Timing
    duration_in_previous_state_seconds INTEGER,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_state_transitions IS 'History of all lead state changes';

-- =====================================================
-- Table: synthex_library_state_definitions
-- Configurable state definitions per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_state_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- State Identity
    state_key TEXT NOT NULL, -- 'new', 'qualified', etc.
    display_name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Hex color for UI
    icon TEXT, -- Icon name

    -- Position
    stage_order INTEGER DEFAULT 0, -- For funnel visualization
    stage_group TEXT, -- 'top', 'middle', 'bottom', 'closed'

    -- Configuration
    is_terminal BOOLEAN DEFAULT false, -- Won, Lost are terminal
    is_active BOOLEAN DEFAULT true,
    auto_transition_rules JSONB DEFAULT '[]', -- Conditions for automatic transitions

    -- Exit Criteria
    required_actions TEXT[], -- Actions needed before transition
    min_time_in_state_hours INTEGER, -- Minimum time before allowed to transition

    -- Notifications
    notify_on_enter BOOLEAN DEFAULT false,
    notify_on_exit BOOLEAN DEFAULT false,
    notification_channels TEXT[] DEFAULT '{}',

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, state_key)
);

COMMENT ON TABLE synthex_library_state_definitions IS 'Configurable state definitions per tenant';

-- =====================================================
-- Table: synthex_library_transition_rules
-- Rules for automatic state transitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_transition_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Identity
    name TEXT NOT NULL,
    description TEXT,

    -- Trigger
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,

    -- Conditions (all must be true)
    conditions JSONB NOT NULL DEFAULT '[]', -- [{ field, operator, value }]

    -- AI Enhancement
    use_ai_validation BOOLEAN DEFAULT false,
    ai_confidence_threshold NUMERIC(4,3) DEFAULT 0.7,

    -- Configuration
    priority INTEGER DEFAULT 0, -- Higher = evaluated first
    is_active BOOLEAN DEFAULT true,
    cooldown_hours INTEGER DEFAULT 0, -- Prevent rapid re-transitions

    -- Actions on Transition
    actions_on_transition JSONB DEFAULT '[]', -- [{ type, config }]

    -- Stats
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_transition_rules IS 'Rules for automatic state transitions';

-- =====================================================
-- Table: synthex_library_state_metrics
-- Aggregated metrics for state analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_state_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Period
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- State Counts
    state_distribution JSONB DEFAULT '{}', -- { "new": 50, "qualified": 30, ... }
    total_leads INTEGER DEFAULT 0,

    -- Transitions
    transitions_count INTEGER DEFAULT 0,
    transitions_by_type JSONB DEFAULT '{}', -- { "manual": 10, "ai_triggered": 20 }

    -- Velocity
    avg_time_to_qualified_hours NUMERIC,
    avg_time_to_won_hours NUMERIC,
    avg_time_in_each_state JSONB DEFAULT '{}', -- { "new": 24, "qualified": 48, ... }

    -- Conversion
    new_to_qualified_rate NUMERIC(5,4),
    qualified_to_won_rate NUMERIC(5,4),
    overall_conversion_rate NUMERIC(5,4),

    -- Value
    total_pipeline_value NUMERIC,
    weighted_pipeline_value NUMERIC,
    avg_deal_size NUMERIC,

    -- AI Insights
    ai_summary TEXT,
    ai_recommendations TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_state_metrics IS 'Aggregated metrics for state analysis';

-- =====================================================
-- Table: synthex_library_state_alerts
-- Alerts for state-related events
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_state_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Alert Type
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'stuck_lead', 'regression', 'high_value_at_risk', 'conversion_drop',
        'velocity_slowdown', 'unusual_pattern', 'ai_recommendation'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Related
    lead_id UUID,
    lead_state_id UUID REFERENCES synthex_library_lead_states(id),
    transition_id UUID REFERENCES synthex_library_state_transitions(id),

    -- Metrics
    metric_name TEXT,
    metric_value NUMERIC,
    threshold_value NUMERIC,

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

COMMENT ON TABLE synthex_library_state_alerts IS 'Alerts for state-related events';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lead_states_tenant
    ON synthex_library_lead_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_states_lead
    ON synthex_library_lead_states(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_states_current
    ON synthex_library_lead_states(tenant_id, current_state);
CREATE INDEX IF NOT EXISTS idx_lead_states_engagement
    ON synthex_library_lead_states(tenant_id, engagement_level);
CREATE INDEX IF NOT EXISTS idx_lead_states_updated
    ON synthex_library_lead_states(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_state_transitions_tenant
    ON synthex_library_state_transitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_lead
    ON synthex_library_state_transitions(lead_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_date
    ON synthex_library_state_transitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_transitions_states
    ON synthex_library_state_transitions(from_state, to_state);

CREATE INDEX IF NOT EXISTS idx_state_definitions_tenant
    ON synthex_library_state_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_state_definitions_key
    ON synthex_library_state_definitions(tenant_id, state_key);

CREATE INDEX IF NOT EXISTS idx_transition_rules_tenant
    ON synthex_library_transition_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transition_rules_states
    ON synthex_library_transition_rules(from_state, to_state);
CREATE INDEX IF NOT EXISTS idx_transition_rules_active
    ON synthex_library_transition_rules(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_state_metrics_tenant
    ON synthex_library_state_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_state_metrics_period
    ON synthex_library_state_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_state_alerts_tenant
    ON synthex_library_state_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_state_alerts_status
    ON synthex_library_state_alerts(status);
CREATE INDEX IF NOT EXISTS idx_state_alerts_lead
    ON synthex_library_state_alerts(lead_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_lead_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_state_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_transition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_state_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_state_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY lead_states_tenant_policy ON synthex_library_lead_states
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY state_transitions_tenant_policy ON synthex_library_state_transitions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY state_definitions_tenant_policy ON synthex_library_state_definitions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY transition_rules_tenant_policy ON synthex_library_transition_rules
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY state_metrics_tenant_policy ON synthex_library_state_metrics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY state_alerts_tenant_policy ON synthex_library_state_alerts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_lead_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Calculate time in state
    IF OLD.entered_at IS NOT NULL THEN
        NEW.time_in_state_seconds = EXTRACT(EPOCH FROM (now() - OLD.entered_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_states_updated ON synthex_library_lead_states;
CREATE TRIGGER trigger_lead_states_updated
    BEFORE UPDATE ON synthex_library_lead_states
    FOR EACH ROW EXECUTE FUNCTION update_lead_state_timestamp();

DROP TRIGGER IF EXISTS trigger_state_definitions_updated ON synthex_library_state_definitions;
CREATE TRIGGER trigger_state_definitions_updated
    BEFORE UPDATE ON synthex_library_state_definitions
    FOR EACH ROW EXECUTE FUNCTION update_lead_state_timestamp();

DROP TRIGGER IF EXISTS trigger_transition_rules_updated ON synthex_library_transition_rules;
CREATE TRIGGER trigger_transition_rules_updated
    BEFORE UPDATE ON synthex_library_transition_rules
    FOR EACH ROW EXECUTE FUNCTION update_lead_state_timestamp();

-- =====================================================
-- Function: Record state transition
-- =====================================================
CREATE OR REPLACE FUNCTION record_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_state IS DISTINCT FROM NEW.current_state THEN
        INSERT INTO synthex_library_state_transitions (
            tenant_id,
            lead_id,
            lead_state_id,
            from_state,
            to_state,
            transition_type,
            reason,
            duration_in_previous_state_seconds
        ) VALUES (
            NEW.tenant_id,
            NEW.lead_id,
            NEW.id,
            OLD.current_state,
            NEW.current_state,
            COALESCE(NEW.meta->>'transition_type', 'manual'),
            NEW.entered_reason,
            EXTRACT(EPOCH FROM (now() - OLD.entered_at))::INTEGER
        );

        -- Update entered_at for new state
        NEW.entered_at = now();
        NEW.previous_state = OLD.current_state;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_transition ON synthex_library_lead_states;
CREATE TRIGGER trigger_record_transition
    BEFORE UPDATE ON synthex_library_lead_states
    FOR EACH ROW EXECUTE FUNCTION record_state_transition();

-- =====================================================
-- Function: Calculate conversion probability
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_lead_probability(p_state TEXT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE p_state
        WHEN 'new' THEN 0.05
        WHEN 'contacted' THEN 0.10
        WHEN 'engaged' THEN 0.20
        WHEN 'qualified' THEN 0.40
        WHEN 'proposal_sent' THEN 0.60
        WHEN 'negotiating' THEN 0.80
        WHEN 'won' THEN 1.00
        WHEN 'lost' THEN 0.00
        WHEN 'churned' THEN 0.00
        WHEN 'reactivated' THEN 0.15
        WHEN 'dormant' THEN 0.02
        ELSE 0.05
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Insert default state definitions
-- =====================================================
INSERT INTO synthex_library_state_definitions (tenant_id, state_key, display_name, description, color, stage_order, stage_group, is_terminal)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    state_key,
    display_name,
    description,
    color,
    stage_order,
    stage_group,
    is_terminal
FROM (VALUES
    ('new', 'New', 'Newly captured lead', '#6B7280', 1, 'top', false),
    ('contacted', 'Contacted', 'Initial contact made', '#3B82F6', 2, 'top', false),
    ('engaged', 'Engaged', 'Lead is responding', '#8B5CF6', 3, 'middle', false),
    ('qualified', 'Qualified', 'Meets qualification criteria', '#F59E0B', 4, 'middle', false),
    ('proposal_sent', 'Proposal Sent', 'Proposal delivered', '#EC4899', 5, 'bottom', false),
    ('negotiating', 'Negotiating', 'In active negotiation', '#EF4444', 6, 'bottom', false),
    ('won', 'Won', 'Deal closed successfully', '#10B981', 7, 'closed', true),
    ('lost', 'Lost', 'Deal lost', '#6B7280', 8, 'closed', true),
    ('churned', 'Churned', 'Customer churned', '#DC2626', 9, 'closed', true),
    ('reactivated', 'Reactivated', 'Previously lost, now re-engaged', '#14B8A6', 10, 'middle', false),
    ('dormant', 'Dormant', 'No activity for extended period', '#9CA3AF', 11, 'closed', false)
) AS v(state_key, display_name, description, color, stage_order, stage_group, is_terminal)
ON CONFLICT (tenant_id, state_key) DO NOTHING;
