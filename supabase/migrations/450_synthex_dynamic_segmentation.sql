-- =====================================================
-- Migration 450: Synthex Dynamic Segmentation Engine
-- Phase D21: Behaviour-Based Dynamic Segmentation
-- =====================================================
-- AI-powered audience segmentation with real-time
-- membership evaluation based on behavioral criteria.
-- =====================================================

-- =====================================================
-- Table: synthex_library_dynamic_segments
-- Segment definitions with behavioral criteria
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_dynamic_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Segment Identity
    segment_name TEXT NOT NULL,
    description TEXT,
    segment_type TEXT NOT NULL CHECK (segment_type IN (
        'behavioral', 'demographic', 'transactional',
        'engagement', 'lifecycle', 'predictive', 'custom'
    )),

    -- Criteria (all conditions must be true)
    criteria JSONB NOT NULL DEFAULT '[]', -- [{ field, operator, value, weight }]
    criteria_logic TEXT DEFAULT 'and' CHECK (criteria_logic IN ('and', 'or')),

    -- AI Enhancement
    use_ai_refinement BOOLEAN DEFAULT false,
    ai_confidence_threshold NUMERIC(4,3) DEFAULT 0.7,
    ai_model TEXT,
    last_ai_refined_at TIMESTAMPTZ,

    -- Membership Settings
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval_hours INTEGER DEFAULT 24,
    last_refreshed_at TIMESTAMPTZ,
    next_refresh_at TIMESTAMPTZ,

    -- Membership Stats
    member_count INTEGER DEFAULT 0,
    potential_value NUMERIC DEFAULT 0,
    avg_engagement_score NUMERIC(4,2),

    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,

    -- Display
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Targeting
    exclusion_segment_ids UUID[] DEFAULT '{}',
    inclusion_priority INTEGER DEFAULT 0, -- Higher = added first

    -- Actions
    actions_on_enter JSONB DEFAULT '[]', -- [{ type, config }]
    actions_on_exit JSONB DEFAULT '[]',
    notify_on_size_change_percent NUMERIC(4,2), -- Alert if size changes by X%

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_dynamic_segments IS 'Segment definitions with behavioral criteria';

-- =====================================================
-- Table: synthex_library_segment_membership
-- Track which contacts belong to which segments
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_segment_membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    segment_id UUID NOT NULL REFERENCES synthex_library_dynamic_segments(id) ON DELETE CASCADE,
    contact_id UUID, -- Link to contacts table
    lead_id UUID, -- Link to leads
    customer_id TEXT, -- External customer ID

    -- Match Details
    match_score NUMERIC(4,3) DEFAULT 1.0, -- 0-1 how well they match
    matched_criteria JSONB DEFAULT '[]', -- Which criteria matched
    unmatched_criteria JSONB DEFAULT '[]', -- Which criteria didn't match

    -- AI Analysis
    ai_confidence NUMERIC(4,3),
    ai_reasoning TEXT,
    predicted_value NUMERIC,
    churn_risk NUMERIC(4,3),

    -- Status
    membership_status TEXT DEFAULT 'active' CHECK (membership_status IN (
        'active', 'pending', 'exited', 'excluded'
    )),
    entered_at TIMESTAMPTZ DEFAULT now(),
    exited_at TIMESTAMPTZ,
    exit_reason TEXT,

    -- Engagement in Segment
    activities_since_entry INTEGER DEFAULT 0,
    revenue_since_entry NUMERIC DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, segment_id, contact_id),
    UNIQUE(tenant_id, segment_id, lead_id),
    UNIQUE(tenant_id, segment_id, customer_id)
);

COMMENT ON TABLE synthex_library_segment_membership IS 'Track segment membership for contacts';

-- =====================================================
-- Table: synthex_library_segment_rules
-- Reusable segmentation rules
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_segment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Identity
    rule_name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'engagement', 'value', 'behavior', 'temporal', etc.

    -- Rule Definition
    field TEXT NOT NULL, -- The field to evaluate
    field_source TEXT DEFAULT 'contact', -- 'contact', 'lead', 'order', 'event', 'custom'
    operator TEXT NOT NULL, -- 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'between', 'regex'
    value JSONB NOT NULL, -- The value(s) to compare against
    value_type TEXT DEFAULT 'static', -- 'static', 'dynamic', 'relative'

    -- For temporal/relative values
    relative_period TEXT, -- 'last_7_days', 'last_30_days', 'this_month', etc.
    relative_field TEXT, -- For comparisons like 'greater than field X'

    -- Weight for scoring
    weight NUMERIC(4,3) DEFAULT 1.0,
    is_required BOOLEAN DEFAULT false, -- Must match for segment inclusion

    -- Reusability
    is_template BOOLEAN DEFAULT false,
    template_name TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Stats
    times_used INTEGER DEFAULT 0,
    avg_match_rate NUMERIC(5,4),

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_segment_rules IS 'Reusable segmentation rules';

-- =====================================================
-- Table: synthex_library_segment_snapshots
-- Historical segment composition
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_segment_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Reference
    segment_id UUID NOT NULL REFERENCES synthex_library_dynamic_segments(id) ON DELETE CASCADE,

    -- Snapshot Time
    snapshot_at TIMESTAMPTZ DEFAULT now(),
    snapshot_type TEXT DEFAULT 'scheduled', -- 'scheduled', 'manual', 'event_triggered'

    -- Composition
    member_count INTEGER NOT NULL,
    new_members INTEGER DEFAULT 0,
    exited_members INTEGER DEFAULT 0,
    net_change INTEGER DEFAULT 0,

    -- Value Metrics
    total_value NUMERIC DEFAULT 0,
    avg_value NUMERIC,
    median_value NUMERIC,

    -- Engagement Metrics
    avg_engagement_score NUMERIC(4,2),
    active_rate NUMERIC(5,4), -- % active in last 30 days

    -- Demographics (aggregated)
    demographics JSONB DEFAULT '{}', -- { "age_groups": {...}, "locations": {...} }

    -- AI Insights
    ai_summary TEXT,
    ai_recommendations TEXT[],
    health_score NUMERIC(4,2), -- 0-100

    -- Comparison
    change_from_previous_percent NUMERIC,
    trend_direction TEXT CHECK (trend_direction IN ('growing', 'stable', 'declining')),

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_segment_snapshots IS 'Historical segment composition';

-- =====================================================
-- Table: synthex_library_segment_overlaps
-- Track overlap between segments
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_segment_overlaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Segments
    segment_a_id UUID NOT NULL REFERENCES synthex_library_dynamic_segments(id) ON DELETE CASCADE,
    segment_b_id UUID NOT NULL REFERENCES synthex_library_dynamic_segments(id) ON DELETE CASCADE,

    -- Overlap Stats
    overlap_count INTEGER NOT NULL,
    segment_a_total INTEGER NOT NULL,
    segment_b_total INTEGER NOT NULL,
    overlap_percent_a NUMERIC(5,4), -- % of A that overlaps with B
    overlap_percent_b NUMERIC(5,4), -- % of B that overlaps with A
    jaccard_index NUMERIC(5,4), -- Intersection / Union

    -- Period
    calculated_at TIMESTAMPTZ DEFAULT now(),
    period_type TEXT DEFAULT 'point_in_time',

    -- Recommendations
    should_merge BOOLEAN DEFAULT false,
    merge_recommendation TEXT,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, segment_a_id, segment_b_id, calculated_at)
);

COMMENT ON TABLE synthex_library_segment_overlaps IS 'Track overlap between segments';

-- =====================================================
-- Table: synthex_library_segment_campaigns
-- Link segments to campaigns
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_segment_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- References
    segment_id UUID NOT NULL REFERENCES synthex_library_dynamic_segments(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL,
    campaign_type TEXT, -- 'email', 'sms', 'push', 'social', 'retargeting'

    -- Targeting
    is_inclusion BOOLEAN DEFAULT true, -- true = target, false = exclude
    priority INTEGER DEFAULT 0,

    -- Performance
    members_targeted INTEGER DEFAULT 0,
    members_reached INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_attributed NUMERIC DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'draft', 'active', 'paused', 'completed', 'archived'
    )),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Metadata
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_segment_campaigns IS 'Link segments to campaigns';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_dynamic_segments_tenant
    ON synthex_library_dynamic_segments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_segments_type
    ON synthex_library_dynamic_segments(tenant_id, segment_type);
CREATE INDEX IF NOT EXISTS idx_dynamic_segments_active
    ON synthex_library_dynamic_segments(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dynamic_segments_refresh
    ON synthex_library_dynamic_segments(next_refresh_at) WHERE auto_refresh = true;

CREATE INDEX IF NOT EXISTS idx_segment_membership_tenant
    ON synthex_library_segment_membership(tenant_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_segment
    ON synthex_library_segment_membership(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_contact
    ON synthex_library_segment_membership(contact_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_lead
    ON synthex_library_segment_membership(lead_id);
CREATE INDEX IF NOT EXISTS idx_segment_membership_status
    ON synthex_library_segment_membership(membership_status);

CREATE INDEX IF NOT EXISTS idx_segment_rules_tenant
    ON synthex_library_segment_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_segment_rules_category
    ON synthex_library_segment_rules(category);
CREATE INDEX IF NOT EXISTS idx_segment_rules_template
    ON synthex_library_segment_rules(tenant_id) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_segment_snapshots_tenant
    ON synthex_library_segment_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_segment_snapshots_segment
    ON synthex_library_segment_snapshots(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_snapshots_date
    ON synthex_library_segment_snapshots(snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_segment_overlaps_tenant
    ON synthex_library_segment_overlaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_segment_overlaps_segments
    ON synthex_library_segment_overlaps(segment_a_id, segment_b_id);

CREATE INDEX IF NOT EXISTS idx_segment_campaigns_tenant
    ON synthex_library_segment_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_segment_campaigns_segment
    ON synthex_library_segment_campaigns(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_campaigns_campaign
    ON synthex_library_segment_campaigns(campaign_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_dynamic_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_segment_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_segment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_segment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_segment_overlaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_segment_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY dynamic_segments_tenant_policy ON synthex_library_dynamic_segments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY segment_membership_tenant_policy ON synthex_library_segment_membership
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY segment_rules_tenant_policy ON synthex_library_segment_rules
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY segment_snapshots_tenant_policy ON synthex_library_segment_snapshots
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY segment_overlaps_tenant_policy ON synthex_library_segment_overlaps
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY segment_campaigns_tenant_policy ON synthex_library_segment_campaigns
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_segment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dynamic_segments_updated ON synthex_library_dynamic_segments;
CREATE TRIGGER trigger_dynamic_segments_updated
    BEFORE UPDATE ON synthex_library_dynamic_segments
    FOR EACH ROW EXECUTE FUNCTION update_segment_timestamp();

DROP TRIGGER IF EXISTS trigger_segment_membership_updated ON synthex_library_segment_membership;
CREATE TRIGGER trigger_segment_membership_updated
    BEFORE UPDATE ON synthex_library_segment_membership
    FOR EACH ROW EXECUTE FUNCTION update_segment_timestamp();

DROP TRIGGER IF EXISTS trigger_segment_rules_updated ON synthex_library_segment_rules;
CREATE TRIGGER trigger_segment_rules_updated
    BEFORE UPDATE ON synthex_library_segment_rules
    FOR EACH ROW EXECUTE FUNCTION update_segment_timestamp();

DROP TRIGGER IF EXISTS trigger_segment_campaigns_updated ON synthex_library_segment_campaigns;
CREATE TRIGGER trigger_segment_campaigns_updated
    BEFORE UPDATE ON synthex_library_segment_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_segment_timestamp();

-- =====================================================
-- Function: Update segment member count
-- =====================================================
CREATE OR REPLACE FUNCTION update_segment_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.membership_status = 'active' THEN
        UPDATE synthex_library_dynamic_segments
        SET member_count = member_count + 1
        WHERE id = NEW.segment_id;
    ELSIF TG_OP = 'DELETE' AND OLD.membership_status = 'active' THEN
        UPDATE synthex_library_dynamic_segments
        SET member_count = GREATEST(0, member_count - 1)
        WHERE id = OLD.segment_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.membership_status != 'active' AND NEW.membership_status = 'active' THEN
            UPDATE synthex_library_dynamic_segments
            SET member_count = member_count + 1
            WHERE id = NEW.segment_id;
        ELSIF OLD.membership_status = 'active' AND NEW.membership_status != 'active' THEN
            UPDATE synthex_library_dynamic_segments
            SET member_count = GREATEST(0, member_count - 1)
            WHERE id = NEW.segment_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_segment_count ON synthex_library_segment_membership;
CREATE TRIGGER trigger_update_segment_count
    AFTER INSERT OR UPDATE OR DELETE ON synthex_library_segment_membership
    FOR EACH ROW EXECUTE FUNCTION update_segment_member_count();

-- =====================================================
-- Function: Calculate segment match score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_segment_match_score(
    p_matched_count INTEGER,
    p_total_count INTEGER,
    p_required_matched BOOLEAN
)
RETURNS NUMERIC AS $$
BEGIN
    IF p_total_count = 0 THEN
        RETURN 0;
    END IF;

    IF NOT p_required_matched THEN
        RETURN 0;
    END IF;

    RETURN ROUND((p_matched_count::NUMERIC / p_total_count::NUMERIC), 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Schedule next segment refresh
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_segment_refresh()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auto_refresh AND NEW.refresh_interval_hours IS NOT NULL THEN
        NEW.next_refresh_at = now() + (NEW.refresh_interval_hours || ' hours')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_schedule_refresh ON synthex_library_dynamic_segments;
CREATE TRIGGER trigger_schedule_refresh
    BEFORE INSERT OR UPDATE OF last_refreshed_at ON synthex_library_dynamic_segments
    FOR EACH ROW EXECUTE FUNCTION schedule_segment_refresh();

-- =====================================================
-- Insert default segment templates
-- =====================================================
INSERT INTO synthex_library_segment_rules (tenant_id, rule_name, description, category, field, field_source, operator, value, is_template, template_name)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    rule_name,
    description,
    category,
    field,
    field_source,
    operator,
    value::jsonb,
    true,
    template_name
FROM (VALUES
    ('High Engagement', 'Users with engagement score >= 80', 'engagement', 'engagement_score', 'contact', 'gte', '80', 'high_engagement'),
    ('Recent Purchaser', 'Purchased in last 30 days', 'transactional', 'last_purchase_at', 'contact', 'gte', '"relative:30_days_ago"', 'recent_purchaser'),
    ('High Value Customer', 'Total lifetime value >= $1000', 'transactional', 'lifetime_value', 'contact', 'gte', '1000', 'high_value'),
    ('Dormant User', 'No activity in 60+ days', 'engagement', 'last_activity_at', 'contact', 'lt', '"relative:60_days_ago"', 'dormant'),
    ('Email Subscriber', 'Has opted into email', 'demographic', 'email_opted_in', 'contact', 'eq', 'true', 'email_subscriber'),
    ('Churn Risk', 'AI predicted churn probability >= 70%', 'predictive', 'churn_probability', 'contact', 'gte', '0.7', 'churn_risk'),
    ('New Lead', 'Created in last 7 days', 'lifecycle', 'created_at', 'lead', 'gte', '"relative:7_days_ago"', 'new_lead'),
    ('Qualified Lead', 'Lead status is qualified', 'lifecycle', 'current_state', 'lead', 'eq', '"qualified"', 'qualified_lead')
) AS v(rule_name, description, category, field, field_source, operator, value, template_name)
ON CONFLICT DO NOTHING;
