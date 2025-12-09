-- =====================================================
-- Migration 453: Synthex Adaptive Personalisation Engine
-- Phase D24: Adaptive Personalisation Engine (Real-Time)
-- =====================================================
-- Real-time content and experience personalization based
-- on behavioral profiles and AI-driven recommendations.
-- =====================================================

-- =====================================================
-- Table: synthex_library_personalisation_profiles
-- Contact personalization profiles with feature vectors
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL UNIQUE,
    lead_id UUID,
    customer_id UUID,

    -- Profile Vector (behavioral features)
    profile_vector JSONB NOT NULL DEFAULT '{}',
    -- {
    --   engagement_score: 0-100,
    --   content_preferences: { blog: 0.8, video: 0.5, ... },
    --   channel_preferences: { email: 0.9, sms: 0.3, ... },
    --   time_preferences: { morning: 0.7, evening: 0.4, ... },
    --   topic_interests: { seo: 0.9, marketing: 0.7, ... },
    --   buying_stage: 'awareness'|'consideration'|'decision',
    --   persona_match: { ... }
    -- }

    -- Behavioral Signals
    avg_session_duration NUMERIC,
    pages_per_session NUMERIC,
    bounce_rate NUMERIC,
    conversion_rate NUMERIC,
    email_engagement_rate NUMERIC,
    content_consumption_score NUMERIC,

    -- Preferences
    preferred_content_types TEXT[] DEFAULT '{}',
    preferred_channels TEXT[] DEFAULT '{}',
    preferred_topics TEXT[] DEFAULT '{}',
    preferred_times JSONB DEFAULT '{}', -- { dayOfWeek: [hours] }

    -- AI Insights
    predicted_interests TEXT[] DEFAULT '{}',
    predicted_next_action TEXT,
    predicted_lifetime_value NUMERIC,
    churn_probability NUMERIC(4,3),
    upsell_probability NUMERIC(4,3),

    -- Persona
    matched_persona_id UUID,
    persona_confidence NUMERIC(4,3),

    -- A/B Testing
    experiment_groups JSONB DEFAULT '{}', -- { experimentId: variant }

    -- Status
    is_active BOOLEAN DEFAULT true,
    quality_score NUMERIC(4,3), -- Data quality score
    completeness_score NUMERIC(4,3),

    -- Timestamps
    last_activity_at TIMESTAMPTZ,
    last_computed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Metadata
    meta JSONB DEFAULT '{}'
);

-- =====================================================
-- Table: synthex_library_personalisation_events
-- Behavioral events for profile building
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,

    -- Event Details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view', 'content_view', 'email_open', 'email_click',
        'form_submit', 'download', 'video_watch', 'product_view',
        'cart_add', 'purchase', 'search', 'share', 'comment',
        'chat_start', 'support_ticket', 'webinar_attend', 'custom'
    )),
    event_category TEXT,
    event_action TEXT,
    event_label TEXT,
    event_value NUMERIC,

    -- Context
    page_url TEXT,
    referrer_url TEXT,
    content_id TEXT,
    content_type TEXT,
    campaign_id TEXT,
    source TEXT,
    medium TEXT,

    -- Payload
    payload JSONB NOT NULL DEFAULT '{}',

    -- Device/Session
    session_id TEXT,
    device_type TEXT,
    browser TEXT,
    platform TEXT,
    country TEXT,
    city TEXT,

    -- Processing
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    profile_impact JSONB, -- Changes applied to profile

    -- Timestamps
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_personalisation_rules
-- Rules for content personalization
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Identity
    rule_name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'content_recommendation', 'channel_preference', 'timing_optimization',
        'offer_targeting', 'message_adaptation', 'experience_customization'
    )),

    -- Targeting Conditions
    conditions JSONB NOT NULL DEFAULT '[]',
    -- [{ field, operator, value, weight }]
    condition_logic TEXT DEFAULT 'and' CHECK (condition_logic IN ('and', 'or')),

    -- Personalization Actions
    actions JSONB NOT NULL DEFAULT '[]',
    -- [{ type, config }]
    -- type: show_content, hide_content, replace_content, reorder,
    --       send_notification, trigger_workflow, set_attribute

    -- Priority & Exclusivity
    priority INTEGER DEFAULT 100,
    is_exclusive BOOLEAN DEFAULT false,
    exclusion_rules UUID[] DEFAULT '{}',

    -- Performance
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5,4),
    avg_lift NUMERIC(5,2),

    -- Status
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_personalisation_recommendations
-- AI-generated content recommendations
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,

    -- Recommendation
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'content', 'product', 'offer', 'channel', 'timing', 'action'
    )),
    recommended_id TEXT NOT NULL, -- ID of recommended item
    recommended_type TEXT, -- Type of recommended item
    recommendation_reason TEXT,

    -- Scoring
    relevance_score NUMERIC(4,3) NOT NULL,
    confidence_score NUMERIC(4,3),
    predicted_engagement NUMERIC(4,3),

    -- Context
    context JSONB DEFAULT '{}',
    -- { page, session, campaign, trigger }

    -- Source
    algorithm TEXT NOT NULL, -- 'collaborative', 'content_based', 'hybrid', 'ai'
    model_version TEXT,
    features_used JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'served', 'clicked', 'converted', 'dismissed', 'expired'
    )),
    served_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Lifecycle
    expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_personalisation_experiments
-- A/B testing for personalization strategies
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Experiment Identity
    experiment_name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,

    -- Variants
    variants JSONB NOT NULL DEFAULT '[]',
    -- [{ id, name, weight, config }]
    control_variant_id TEXT,

    -- Targeting
    targeting_rules JSONB DEFAULT '[]',
    traffic_allocation NUMERIC(4,3) DEFAULT 1.0, -- 0.0 to 1.0

    -- Goals
    primary_goal TEXT NOT NULL, -- Metric to optimize
    secondary_goals TEXT[] DEFAULT '{}',

    -- Results
    results JSONB DEFAULT '{}',
    -- { variantId: { impressions, conversions, rate, confidence, ... } }
    winner_variant_id TEXT,
    statistical_significance NUMERIC(4,3),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'running', 'paused', 'completed', 'archived'
    )),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_personalisation_personas
-- Predefined customer personas
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Persona Identity
    persona_name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,

    -- Demographics
    age_range TEXT,
    gender TEXT,
    location_type TEXT, -- urban, suburban, rural
    income_level TEXT,
    education_level TEXT,
    job_role TEXT,
    industry TEXT,

    -- Behavioral Traits
    traits JSONB DEFAULT '{}',
    -- {
    --   decision_speed: 'fast'|'medium'|'slow',
    --   risk_tolerance: 'low'|'medium'|'high',
    --   price_sensitivity: 'low'|'medium'|'high',
    --   research_depth: 'surface'|'moderate'|'deep'
    -- }

    -- Content Preferences
    preferred_content_types TEXT[] DEFAULT '{}',
    preferred_content_length TEXT, -- short, medium, long
    preferred_tone TEXT, -- formal, casual, technical
    preferred_channels TEXT[] DEFAULT '{}',

    -- Goals & Pain Points
    goals TEXT[] DEFAULT '{}',
    pain_points TEXT[] DEFAULT '{}',
    objections TEXT[] DEFAULT '{}',

    -- Matching Criteria
    matching_rules JSONB DEFAULT '[]',
    -- [{ field, operator, value, weight }]
    min_match_score NUMERIC(4,3) DEFAULT 0.6,

    -- Performance
    matched_contacts INTEGER DEFAULT 0,
    avg_conversion_rate NUMERIC(5,4),
    avg_lifetime_value NUMERIC,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_personalisation_content
-- Personalized content variants
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personalisation_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Content Identity
    content_key TEXT NOT NULL, -- Unique key for the content slot
    content_name TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN (
        'headline', 'body', 'cta', 'image', 'video', 'offer',
        'testimonial', 'social_proof', 'product', 'layout'
    )),

    -- Variants
    variants JSONB NOT NULL DEFAULT '[]',
    -- [{ id, name, content, targeting_rules, weight }]

    -- Default
    default_variant_id TEXT,

    -- Locations
    locations TEXT[] DEFAULT '{}', -- page URLs or identifiers

    -- Performance
    total_impressions INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, content_key)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pers_profiles_tenant
    ON synthex_library_personalisation_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_profiles_contact
    ON synthex_library_personalisation_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_pers_profiles_persona
    ON synthex_library_personalisation_profiles(matched_persona_id);
CREATE INDEX IF NOT EXISTS idx_pers_profiles_activity
    ON synthex_library_personalisation_profiles(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_pers_events_tenant
    ON synthex_library_personalisation_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_events_contact
    ON synthex_library_personalisation_events(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pers_events_type
    ON synthex_library_personalisation_events(event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_pers_events_unprocessed
    ON synthex_library_personalisation_events(is_processed, occurred_at)
    WHERE is_processed = false;

CREATE INDEX IF NOT EXISTS idx_pers_rules_tenant
    ON synthex_library_personalisation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_rules_type
    ON synthex_library_personalisation_rules(rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_pers_rules_priority
    ON synthex_library_personalisation_rules(priority, is_active);

CREATE INDEX IF NOT EXISTS idx_pers_recommendations_tenant
    ON synthex_library_personalisation_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_recommendations_contact
    ON synthex_library_personalisation_recommendations(contact_id, status);
CREATE INDEX IF NOT EXISTS idx_pers_recommendations_type
    ON synthex_library_personalisation_recommendations(recommendation_type, status);

CREATE INDEX IF NOT EXISTS idx_pers_experiments_tenant
    ON synthex_library_personalisation_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_experiments_status
    ON synthex_library_personalisation_experiments(status, start_date);

CREATE INDEX IF NOT EXISTS idx_pers_personas_tenant
    ON synthex_library_personalisation_personas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_personas_active
    ON synthex_library_personalisation_personas(is_active);

CREATE INDEX IF NOT EXISTS idx_pers_content_tenant
    ON synthex_library_personalisation_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pers_content_key
    ON synthex_library_personalisation_content(content_key, is_active);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_personalisation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_personalisation_content ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_profiles
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_events
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_rules
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_recommendations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_experiments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_personas
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_personalisation_content
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function: Update profile on new event
CREATE OR REPLACE FUNCTION process_personalisation_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last activity on profile
    UPDATE synthex_library_personalisation_profiles
    SET
        last_activity_at = NEW.occurred_at,
        updated_at = now()
    WHERE tenant_id = NEW.tenant_id
      AND contact_id = NEW.contact_id;

    -- If no profile exists, create one
    IF NOT FOUND THEN
        INSERT INTO synthex_library_personalisation_profiles (
            tenant_id, contact_id, last_activity_at
        ) VALUES (
            NEW.tenant_id, NEW.contact_id, NEW.occurred_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_personalisation_event
    AFTER INSERT ON synthex_library_personalisation_events
    FOR EACH ROW
    EXECUTE FUNCTION process_personalisation_event();

-- Function: Calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(
    p_profile_vector JSONB
)
RETURNS NUMERIC AS $$
DECLARE
    total_fields INTEGER := 10;
    filled_fields INTEGER := 0;
BEGIN
    IF p_profile_vector ? 'engagement_score' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'content_preferences' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'channel_preferences' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'time_preferences' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'topic_interests' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'buying_stage' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'persona_match' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'behavior_patterns' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'device_preferences' THEN filled_fields := filled_fields + 1; END IF;
    IF p_profile_vector ? 'location_context' THEN filled_fields := filled_fields + 1; END IF;

    RETURN filled_fields::NUMERIC / total_fields;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Match contact to personas
CREATE OR REPLACE FUNCTION match_contact_to_personas(
    p_tenant_id UUID,
    p_contact_id UUID
)
RETURNS TABLE (
    persona_id UUID,
    persona_name TEXT,
    match_score NUMERIC
) AS $$
BEGIN
    -- Placeholder for persona matching logic
    -- In production, this would evaluate matching rules against profile
    RETURN QUERY
    SELECT
        p.id,
        p.persona_name,
        0.5::NUMERIC as match_score
    FROM synthex_library_personalisation_personas p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
    ORDER BY match_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Default Data: Personas
-- =====================================================
-- Personas are tenant-specific, created via API

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE synthex_library_personalisation_profiles IS 'Contact personalization profiles with behavioral features';
COMMENT ON TABLE synthex_library_personalisation_events IS 'Behavioral events for profile building';
COMMENT ON TABLE synthex_library_personalisation_rules IS 'Rules for content personalization';
COMMENT ON TABLE synthex_library_personalisation_recommendations IS 'AI-generated content recommendations';
COMMENT ON TABLE synthex_library_personalisation_experiments IS 'A/B testing for personalization strategies';
COMMENT ON TABLE synthex_library_personalisation_personas IS 'Predefined customer personas';
COMMENT ON TABLE synthex_library_personalisation_content IS 'Personalized content variants';
