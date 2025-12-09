-- =====================================================
-- Migration 447: Synthex Multi-Channel Creative Generator
-- Phase D18: AI-Powered Cross-Channel Content Creation
-- =====================================================
-- AI-powered creative generation with variant testing,
-- channel adaptation, and performance tracking.
-- =====================================================

-- =====================================================
-- Table: synthex_library_creative_briefs
-- Creative brief definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Brief Identity
    name TEXT NOT NULL,
    description TEXT,

    -- Campaign Context
    campaign_id UUID,
    campaign_name TEXT,

    -- Objective
    objective TEXT NOT NULL, -- 'awareness', 'engagement', 'conversion', 'retention'
    target_audience TEXT,
    audience_persona_id UUID,

    -- Brand
    brand_id UUID,
    tone_profile_id UUID,

    -- Key Messages
    primary_message TEXT,
    supporting_messages TEXT[],
    call_to_action TEXT,

    -- Visual Direction
    visual_style TEXT, -- 'minimalist', 'bold', 'elegant', 'playful', etc.
    color_scheme JSONB DEFAULT '{}',
    imagery_direction TEXT,

    -- Channels
    target_channels TEXT[] DEFAULT '{}', -- ['email', 'facebook', 'instagram', ...]

    -- References
    inspiration_urls TEXT[],
    competitor_refs TEXT[],
    reference_assets UUID[],

    -- Constraints
    word_limits JSONB DEFAULT '{}', -- { "headline": 60, "body": 200 }
    required_elements TEXT[],
    forbidden_elements TEXT[],

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'approved', 'in_production', 'completed', 'archived'
    )),
    approved_by UUID,
    approved_at TIMESTAMPTZ,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_briefs IS 'Creative brief definitions';

-- =====================================================
-- Table: synthex_library_creative_assets
-- Generated creative assets
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brief_id UUID REFERENCES synthex_library_creative_briefs(id) ON DELETE SET NULL,

    -- Asset Identity
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN (
        'headline', 'body_copy', 'email', 'social_post', 'ad_copy',
        'landing_page', 'video_script', 'podcast_script', 'sms', 'push'
    )),

    -- Channel
    channel TEXT NOT NULL, -- 'email', 'facebook', 'instagram', 'linkedin', 'twitter', 'google_ads', etc.
    format TEXT, -- 'feed', 'story', 'reel', 'carousel', etc.

    -- Content
    headline TEXT,
    subheadline TEXT,
    body TEXT,
    call_to_action TEXT,
    visual_description TEXT, -- For image generation
    hashtags TEXT[],
    mentions TEXT[],
    links JSONB DEFAULT '[]', -- [{ url: '', text: '', tracking: '' }]

    -- Structured Content
    content_blocks JSONB DEFAULT '[]', -- For complex formats
    variables JSONB DEFAULT '{}', -- Personalization variables

    -- Variant
    is_variant BOOLEAN DEFAULT false,
    variant_of UUID REFERENCES synthex_library_creative_assets(id),
    variant_label TEXT, -- 'A', 'B', 'C' or descriptive
    variant_changes TEXT[], -- What's different

    -- AI Generation
    ai_model TEXT,
    ai_prompt TEXT,
    ai_reasoning TEXT,
    generation_params JSONB DEFAULT '{}',
    tokens_used INTEGER,
    generation_time_ms INTEGER,

    -- Quality
    quality_score NUMERIC(4,2), -- 0-100
    readability_score NUMERIC(4,2),
    engagement_prediction NUMERIC(4,2),

    -- Brand Compliance
    brand_compliance_score NUMERIC(4,2),
    compliance_issues JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'published', 'archived'
    )),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,

    -- Performance (post-publish)
    impressions INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    engagement_rate NUMERIC(6,4),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_assets IS 'Generated creative assets';

-- =====================================================
-- Table: synthex_library_creative_templates
-- Reusable creative templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Template Identity
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'promotional', 'educational', 'announcement', etc.

    -- Channel & Type
    channel TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    format TEXT,

    -- Template Content
    headline_template TEXT,
    body_template TEXT,
    cta_template TEXT,
    variables JSONB DEFAULT '[]', -- [{ name: 'product_name', type: 'text', required: true }]

    -- Styling
    tone TEXT,
    style TEXT,

    -- AI Config
    ai_instructions TEXT,
    example_outputs JSONB DEFAULT '[]',

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Stats
    usage_count INTEGER DEFAULT 0,
    avg_quality_score NUMERIC(4,2),
    avg_performance NUMERIC(4,2),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_templates IS 'Reusable creative templates';

-- =====================================================
-- Table: synthex_library_creative_generations
-- Generation history and logs
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Generation Request
    brief_id UUID REFERENCES synthex_library_creative_briefs(id),
    template_id UUID REFERENCES synthex_library_creative_templates(id),

    -- Input
    input_prompt TEXT NOT NULL,
    input_context JSONB DEFAULT '{}',
    channels_requested TEXT[],
    variants_requested INTEGER DEFAULT 1,

    -- Output
    assets_generated UUID[] DEFAULT '{}',
    generation_count INTEGER DEFAULT 0,

    -- AI Details
    ai_model TEXT NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    total_tokens INTEGER,
    cost_estimate NUMERIC(10,6),
    generation_time_ms INTEGER,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'generating', 'completed', 'failed', 'partial'
    )),
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_generations IS 'Generation history and logs';

-- =====================================================
-- Table: synthex_library_creative_feedback
-- User feedback on generated content
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL REFERENCES synthex_library_creative_assets(id) ON DELETE CASCADE,

    -- Feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT CHECK (feedback_type IN (
        'approve', 'reject', 'request_revision', 'flag'
    )),
    feedback_text TEXT,

    -- Specific Issues
    issues JSONB DEFAULT '[]', -- [{ type: 'tone', description: 'too formal' }]

    -- Revision Request
    revision_instructions TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_feedback IS 'User feedback on generated content';

-- =====================================================
-- Table: synthex_library_creative_ab_tests
-- A/B testing for creative assets
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_creative_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Test Identity
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,

    -- Variants
    control_asset_id UUID NOT NULL REFERENCES synthex_library_creative_assets(id),
    variant_asset_ids UUID[] NOT NULL,

    -- Configuration
    channel TEXT NOT NULL,
    traffic_split JSONB NOT NULL, -- { "control": 50, "A": 25, "B": 25 }
    primary_metric TEXT NOT NULL, -- 'ctr', 'conversion', 'engagement'
    secondary_metrics TEXT[],

    -- Targeting
    audience_filter JSONB DEFAULT '{}',
    sample_size_target INTEGER,

    -- Timeline
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    auto_select_winner BOOLEAN DEFAULT false,

    -- Results
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'running', 'paused', 'completed', 'cancelled'
    )),
    winner_asset_id UUID REFERENCES synthex_library_creative_assets(id),
    winning_confidence NUMERIC(5,4),
    results_summary JSONB DEFAULT '{}',
    concluded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_creative_ab_tests IS 'A/B testing for creative assets';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_creative_briefs_tenant
    ON synthex_library_creative_briefs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_briefs_campaign
    ON synthex_library_creative_briefs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_briefs_status
    ON synthex_library_creative_briefs(status);

CREATE INDEX IF NOT EXISTS idx_creative_assets_tenant
    ON synthex_library_creative_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_brief
    ON synthex_library_creative_assets(brief_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_channel
    ON synthex_library_creative_assets(channel);
CREATE INDEX IF NOT EXISTS idx_creative_assets_type
    ON synthex_library_creative_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_creative_assets_status
    ON synthex_library_creative_assets(status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_variant
    ON synthex_library_creative_assets(variant_of);
CREATE INDEX IF NOT EXISTS idx_creative_assets_date
    ON synthex_library_creative_assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creative_templates_tenant
    ON synthex_library_creative_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_templates_channel
    ON synthex_library_creative_templates(channel);
CREATE INDEX IF NOT EXISTS idx_creative_templates_active
    ON synthex_library_creative_templates(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_creative_generations_tenant
    ON synthex_library_creative_generations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_generations_date
    ON synthex_library_creative_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creative_feedback_asset
    ON synthex_library_creative_feedback(asset_id);

CREATE INDEX IF NOT EXISTS idx_creative_ab_tests_tenant
    ON synthex_library_creative_ab_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_ab_tests_status
    ON synthex_library_creative_ab_tests(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_creative_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_creative_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_creative_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_creative_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_creative_ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY creative_briefs_tenant_policy ON synthex_library_creative_briefs
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY creative_assets_tenant_policy ON synthex_library_creative_assets
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY creative_templates_tenant_policy ON synthex_library_creative_templates
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY creative_generations_tenant_policy ON synthex_library_creative_generations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY creative_feedback_tenant_policy ON synthex_library_creative_feedback
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY creative_ab_tests_tenant_policy ON synthex_library_creative_ab_tests
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_creative_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_creative_briefs_updated ON synthex_library_creative_briefs;
CREATE TRIGGER trigger_creative_briefs_updated
    BEFORE UPDATE ON synthex_library_creative_briefs
    FOR EACH ROW EXECUTE FUNCTION update_creative_timestamp();

DROP TRIGGER IF EXISTS trigger_creative_assets_updated ON synthex_library_creative_assets;
CREATE TRIGGER trigger_creative_assets_updated
    BEFORE UPDATE ON synthex_library_creative_assets
    FOR EACH ROW EXECUTE FUNCTION update_creative_timestamp();

DROP TRIGGER IF EXISTS trigger_creative_templates_updated ON synthex_library_creative_templates;
CREATE TRIGGER trigger_creative_templates_updated
    BEFORE UPDATE ON synthex_library_creative_templates
    FOR EACH ROW EXECUTE FUNCTION update_creative_timestamp();

DROP TRIGGER IF EXISTS trigger_creative_ab_tests_updated ON synthex_library_creative_ab_tests;
CREATE TRIGGER trigger_creative_ab_tests_updated
    BEFORE UPDATE ON synthex_library_creative_ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_creative_timestamp();

-- =====================================================
-- Function: Increment template usage
-- =====================================================
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE synthex_library_creative_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_template_usage ON synthex_library_creative_generations;
CREATE TRIGGER trigger_template_usage
    AFTER INSERT ON synthex_library_creative_generations
    FOR EACH ROW EXECUTE FUNCTION increment_template_usage();

-- =====================================================
-- Function: Get channel-specific constraints
-- =====================================================
DROP FUNCTION IF EXISTS get_channel_constraints(TEXT);
CREATE OR REPLACE FUNCTION get_channel_constraints(p_channel TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN CASE p_channel
        WHEN 'twitter' THEN jsonb_build_object(
            'max_chars', 280,
            'max_hashtags', 3,
            'supports_images', true,
            'supports_video', true
        )
        WHEN 'instagram_feed' THEN jsonb_build_object(
            'max_chars', 2200,
            'max_hashtags', 30,
            'supports_images', true,
            'supports_video', true,
            'requires_image', true
        )
        WHEN 'instagram_story' THEN jsonb_build_object(
            'max_chars', 125,
            'supports_images', true,
            'supports_video', true,
            'max_duration', 15
        )
        WHEN 'linkedin' THEN jsonb_build_object(
            'max_chars', 3000,
            'max_hashtags', 5,
            'supports_images', true,
            'supports_video', true
        )
        WHEN 'facebook' THEN jsonb_build_object(
            'max_chars', 63206,
            'optimal_chars', 80,
            'supports_images', true,
            'supports_video', true
        )
        WHEN 'email_subject' THEN jsonb_build_object(
            'max_chars', 60,
            'optimal_chars', 40,
            'supports_emoji', true
        )
        WHEN 'google_ads_headline' THEN jsonb_build_object(
            'max_chars', 30,
            'max_headlines', 15
        )
        WHEN 'google_ads_description' THEN jsonb_build_object(
            'max_chars', 90,
            'max_descriptions', 4
        )
        WHEN 'sms' THEN jsonb_build_object(
            'max_chars', 160,
            'supports_mms', true
        )
        ELSE jsonb_build_object(
            'max_chars', 5000,
            'supports_images', true
        )
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
