-- =====================================================
-- Migration 436: Synthex Auto-Persona Builder
-- Phase D07: AI-Generated Marketing Personas
-- =====================================================
-- Automatically generates detailed buyer personas from
-- audience data, behavior patterns, and industry insights.
-- =====================================================

-- =====================================================
-- Table: synthex_library_personas
-- Core persona definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Basic Identity
    name TEXT NOT NULL, -- e.g., "Tech-Savvy Tim"
    title TEXT, -- e.g., "IT Director"
    avatar_url TEXT,

    -- Demographics
    age_range TEXT, -- e.g., "35-45"
    gender TEXT,
    location TEXT, -- e.g., "Melbourne, Australia"
    income_range TEXT,
    education TEXT,

    -- Professional
    job_titles TEXT[] DEFAULT '{}', -- Possible job titles
    industries TEXT[] DEFAULT '{}', -- Relevant industries
    company_size TEXT, -- e.g., "50-200 employees"
    decision_role TEXT CHECK (decision_role IN (
        'decision_maker', 'influencer', 'user', 'gatekeeper', 'champion'
    )),

    -- Psychographics
    goals TEXT[] DEFAULT '{}', -- What they want to achieve
    challenges TEXT[] DEFAULT '{}', -- Pain points
    motivations TEXT[] DEFAULT '{}', -- What drives them
    fears TEXT[] DEFAULT '{}', -- What they want to avoid
    values TEXT[] DEFAULT '{}', -- What they care about

    -- Behavior
    content_preferences TEXT[] DEFAULT '{}', -- e.g., ['video', 'whitepapers', 'podcasts']
    preferred_channels TEXT[] DEFAULT '{}', -- e.g., ['linkedin', 'email', 'webinars']
    buying_process TEXT, -- How they make decisions
    research_behavior TEXT, -- How they research solutions
    objections TEXT[] DEFAULT '{}', -- Common objections

    -- Messaging
    key_messages TEXT[] DEFAULT '{}', -- Messages that resonate
    tone_preferences TEXT[] DEFAULT '{}', -- e.g., ['data-driven', 'concise', 'professional']
    trigger_phrases TEXT[] DEFAULT '{}', -- Phrases that trigger engagement
    avoid_phrases TEXT[] DEFAULT '{}', -- Phrases to avoid

    -- Journey
    awareness_content JSONB DEFAULT '{}', -- Content for awareness stage
    consideration_content JSONB DEFAULT '{}', -- Content for consideration stage
    decision_content JSONB DEFAULT '{}', -- Content for decision stage

    -- Bio & Story
    bio TEXT, -- Full persona narrative
    typical_day TEXT, -- Day in the life
    quote TEXT, -- Characteristic quote

    -- Scoring & Matching
    priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
    match_score_weight NUMERIC(3,2) DEFAULT 1.0,

    -- AI Generation
    generated_by_ai BOOLEAN DEFAULT false,
    ai_model TEXT,
    generation_prompt TEXT,
    confidence_score NUMERIC(3,2),

    -- Data Sources
    based_on_contacts INTEGER DEFAULT 0, -- Number of contacts analyzed
    based_on_interactions INTEGER DEFAULT 0,
    data_sources JSONB DEFAULT '[]', -- e.g., ['crm', 'analytics', 'surveys']

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'archived'
    )),
    is_primary BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_personas IS 'AI-generated buyer personas for targeted marketing';

-- =====================================================
-- Table: synthex_library_persona_segments
-- Link personas to audience segments
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_persona_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    persona_id UUID NOT NULL REFERENCES synthex_library_personas(id) ON DELETE CASCADE,

    -- Segment Definition
    name TEXT NOT NULL,
    description TEXT,

    -- Criteria
    criteria JSONB NOT NULL DEFAULT '{}', -- e.g., {"industry": ["tech"], "company_size": ["50-200"]}

    -- Stats
    estimated_size INTEGER,
    actual_contacts INTEGER DEFAULT 0,

    -- Performance
    engagement_rate NUMERIC(5,4),
    conversion_rate NUMERIC(5,4),
    avg_deal_size NUMERIC(12,2),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_persona_segments IS 'Audience segments linked to personas';

-- =====================================================
-- Table: synthex_library_persona_content_map
-- Map content recommendations to personas
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_persona_content_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    persona_id UUID NOT NULL REFERENCES synthex_library_personas(id) ON DELETE CASCADE,

    -- Content Reference
    content_type TEXT NOT NULL CHECK (content_type IN (
        'template', 'email', 'landing_page', 'blog', 'video',
        'whitepaper', 'case_study', 'webinar', 'social_post'
    )),
    content_id UUID,
    content_url TEXT,
    content_title TEXT NOT NULL,

    -- Journey Stage
    journey_stage TEXT CHECK (journey_stage IN (
        'awareness', 'consideration', 'decision', 'retention', 'advocacy'
    )),

    -- Effectiveness
    relevance_score NUMERIC(3,2), -- 0.00 - 1.00
    engagement_rate NUMERIC(5,4),
    conversion_rate NUMERIC(5,4),

    -- Recommendation
    recommended_by_ai BOOLEAN DEFAULT false,
    recommendation_reason TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_persona_content_map IS 'Content recommendations mapped to personas';

-- =====================================================
-- Table: synthex_library_persona_insights
-- AI-generated insights about personas
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_persona_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    persona_id UUID NOT NULL REFERENCES synthex_library_personas(id) ON DELETE CASCADE,

    -- Insight
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'behavior_pattern', 'content_gap', 'channel_opportunity',
        'messaging_improvement', 'segment_shift', 'competitive_insight',
        'timing_optimization', 'personalization_opportunity'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Impact
    impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN (
        'low', 'medium', 'high', 'critical'
    )),
    estimated_impact JSONB DEFAULT '{}', -- e.g., {"conversion_lift": 0.15}

    -- Action
    recommended_action TEXT,
    action_priority INTEGER,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'acknowledged', 'implemented', 'dismissed'
    )),
    implemented_at TIMESTAMPTZ,
    implemented_by UUID,

    -- AI
    ai_model TEXT,
    confidence NUMERIC(3,2),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

COMMENT ON TABLE synthex_library_persona_insights IS 'AI-generated insights for personas';

-- =====================================================
-- Table: synthex_library_persona_generation
-- Jobs for AI persona generation
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_persona_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Input
    generation_type TEXT NOT NULL CHECK (generation_type IN (
        'from_scratch', 'from_contacts', 'from_analytics',
        'from_description', 'refine_existing'
    )),
    input_data JSONB DEFAULT '{}', -- e.g., {"industry": "SaaS", "target": "enterprise"}
    source_persona_id UUID REFERENCES synthex_library_personas(id) ON DELETE SET NULL,

    -- Configuration
    num_personas INTEGER DEFAULT 1,
    detail_level TEXT DEFAULT 'standard' CHECK (detail_level IN (
        'basic', 'standard', 'comprehensive'
    )),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    progress INTEGER DEFAULT 0,
    error_message TEXT,

    -- Output
    generated_personas JSONB DEFAULT '[]', -- Array of generated persona data
    preview JSONB DEFAULT '{}', -- Quick preview before full generation

    -- Execution
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    ai_model TEXT,
    tokens_used INTEGER,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_persona_generation IS 'Jobs for AI persona generation';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_personas_tenant
    ON synthex_library_personas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personas_status
    ON synthex_library_personas(status);
CREATE INDEX IF NOT EXISTS idx_personas_primary
    ON synthex_library_personas(tenant_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_personas_priority
    ON synthex_library_personas(priority DESC);

CREATE INDEX IF NOT EXISTS idx_persona_segments_tenant
    ON synthex_library_persona_segments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persona_segments_persona
    ON synthex_library_persona_segments(persona_id);

CREATE INDEX IF NOT EXISTS idx_persona_content_tenant
    ON synthex_library_persona_content_map(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persona_content_persona
    ON synthex_library_persona_content_map(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_content_stage
    ON synthex_library_persona_content_map(journey_stage);

CREATE INDEX IF NOT EXISTS idx_persona_insights_tenant
    ON synthex_library_persona_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persona_insights_persona
    ON synthex_library_persona_insights(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_insights_status
    ON synthex_library_persona_insights(status);

CREATE INDEX IF NOT EXISTS idx_persona_generation_tenant
    ON synthex_library_persona_generation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persona_generation_status
    ON synthex_library_persona_generation(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_persona_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_persona_content_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_persona_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_persona_generation ENABLE ROW LEVEL SECURITY;

-- Personas RLS
DROP POLICY IF EXISTS personas_tenant_policy ON synthex_library_personas;
CREATE POLICY personas_tenant_policy ON synthex_library_personas
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Segments RLS
DROP POLICY IF EXISTS persona_segments_tenant_policy ON synthex_library_persona_segments;
CREATE POLICY persona_segments_tenant_policy ON synthex_library_persona_segments
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Content Map RLS
DROP POLICY IF EXISTS persona_content_tenant_policy ON synthex_library_persona_content_map;
CREATE POLICY persona_content_tenant_policy ON synthex_library_persona_content_map
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Insights RLS
DROP POLICY IF EXISTS persona_insights_tenant_policy ON synthex_library_persona_insights;
CREATE POLICY persona_insights_tenant_policy ON synthex_library_persona_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Generation RLS
DROP POLICY IF EXISTS persona_generation_tenant_policy ON synthex_library_persona_generation;
CREATE POLICY persona_generation_tenant_policy ON synthex_library_persona_generation
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_persona_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_personas_updated ON synthex_library_personas;
CREATE TRIGGER trigger_personas_updated
    BEFORE UPDATE ON synthex_library_personas
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

DROP TRIGGER IF EXISTS trigger_persona_segments_updated ON synthex_library_persona_segments;
CREATE TRIGGER trigger_persona_segments_updated
    BEFORE UPDATE ON synthex_library_persona_segments
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

-- =====================================================
-- Function: Match contact to persona
-- =====================================================
CREATE OR REPLACE FUNCTION match_contact_to_persona(
    p_tenant_id UUID,
    p_contact_data JSONB
)
RETURNS TABLE (
    persona_id UUID,
    persona_name TEXT,
    match_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        (
            -- Industry match
            CASE WHEN p.industries && ARRAY[p_contact_data->>'industry'] THEN 0.3 ELSE 0.0 END +
            -- Job title match
            CASE WHEN p.job_titles && ARRAY[p_contact_data->>'job_title'] THEN 0.25 ELSE 0.0 END +
            -- Company size match
            CASE WHEN p.company_size = p_contact_data->>'company_size' THEN 0.2 ELSE 0.0 END +
            -- Location match
            CASE WHEN p.location ILIKE '%' || (p_contact_data->>'location') || '%' THEN 0.15 ELSE 0.0 END +
            -- Base score
            0.1
        ) * p.match_score_weight AS score
    FROM synthex_library_personas p
    WHERE p.tenant_id = p_tenant_id
      AND p.status = 'active'
    ORDER BY score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
