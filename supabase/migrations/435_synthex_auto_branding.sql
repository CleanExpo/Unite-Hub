-- =====================================================
-- Migration 435: Synthex Auto-Branding Engine
-- Phase D06: Auto-Branding Engine
-- =====================================================
-- AI-powered brand profile generation, voice analysis,
-- style extraction, and brand consistency enforcement.
-- =====================================================

-- =====================================================
-- Table: synthex_library_brand_profiles
-- Core brand identity and styling
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE, -- Singleton per tenant

    -- Basic Identity
    brand_name TEXT NOT NULL,
    tagline TEXT,
    mission TEXT,
    vision TEXT,

    -- Visual Identity
    logo_url TEXT,
    favicon_url TEXT,
    color_primary TEXT NOT NULL DEFAULT '#3B82F6', -- Blue
    color_secondary TEXT DEFAULT '#1E40AF',
    color_accent TEXT DEFAULT '#F59E0B',
    color_background TEXT DEFAULT '#FFFFFF',
    color_text TEXT DEFAULT '#1F2937',
    color_palette JSONB DEFAULT '[]', -- Extended palette

    -- Typography
    font_heading TEXT DEFAULT 'Inter',
    font_body TEXT DEFAULT 'Inter',
    font_accent TEXT,

    -- Voice & Tone
    tone TEXT CHECK (tone IN (
        'professional', 'friendly', 'casual', 'formal',
        'playful', 'authoritative', 'empathetic', 'inspirational'
    )) DEFAULT 'professional',
    voice_attributes TEXT[] DEFAULT '{}', -- e.g., ['confident', 'helpful', 'direct']
    communication_style TEXT,

    -- Persona
    persona_name TEXT, -- e.g., "Alex the Advisor"
    persona_description TEXT,
    persona_avatar_url TEXT,

    -- Target Audience
    target_audience JSONB DEFAULT '{}', -- Demographics, psychographics
    industry TEXT,
    market_position TEXT,

    -- Content Guidelines
    dos TEXT[] DEFAULT '{}', -- Things to do
    donts TEXT[] DEFAULT '{}', -- Things to avoid
    key_phrases TEXT[] DEFAULT '{}', -- Brand phrases to use
    banned_words TEXT[] DEFAULT '{}', -- Words to never use

    -- AI Context
    ai_context TEXT, -- Extended context for AI
    sample_content JSONB DEFAULT '[]', -- Examples of on-brand content

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_complete BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,

    -- Metadata
    generated_by_ai BOOLEAN DEFAULT false,
    ai_model TEXT,
    source_url TEXT, -- If generated from website
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_brand_profiles IS 'Core brand identity and styling for each tenant';

-- =====================================================
-- Table: synthex_library_brand_voice_samples
-- Example content for voice learning
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_voice_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_profile_id UUID REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN (
        'email', 'social', 'website', 'ad', 'blog', 'support', 'sales'
    )),
    source TEXT, -- Where it came from
    source_url TEXT,

    -- Analysis
    is_on_brand BOOLEAN DEFAULT true,
    analyzed BOOLEAN DEFAULT false,
    tone_detected TEXT,
    voice_attributes_detected TEXT[] DEFAULT '{}',
    readability_score NUMERIC(3,2),

    -- Status
    is_approved BOOLEAN DEFAULT true,
    approved_by UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_brand_voice_samples IS 'Example content for training brand voice';

-- =====================================================
-- Table: synthex_library_brand_assets
-- Brand visual assets
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_profile_id UUID REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Asset Details
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN (
        'logo', 'icon', 'banner', 'background', 'pattern',
        'illustration', 'photo', 'video', 'font', 'other'
    )),
    format TEXT, -- png, svg, jpg, etc.
    url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- Dimensions
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- bytes

    -- Usage
    usage_context TEXT[] DEFAULT '{}', -- e.g., ['email_header', 'social_profile']
    is_primary BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_brand_assets IS 'Brand visual assets (logos, images, etc.)';

-- =====================================================
-- Table: synthex_library_brand_consistency
-- Brand consistency validation results
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_consistency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_profile_id UUID REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- What was checked
    content_type TEXT NOT NULL, -- 'template', 'email', 'social_post', etc.
    content_id UUID, -- Reference to the content
    content_preview TEXT,

    -- Results
    is_consistent BOOLEAN NOT NULL,
    overall_score NUMERIC(3,2), -- 0.00 - 1.00
    tone_score NUMERIC(3,2),
    voice_score NUMERIC(3,2),
    style_score NUMERIC(3,2),

    -- Issues Found
    issues JSONB DEFAULT '[]', -- Array of { type, severity, description, suggestion }
    suggestions JSONB DEFAULT '[]',

    -- AI Details
    ai_model TEXT,
    confidence NUMERIC(3,2),

    -- Metadata
    checked_at TIMESTAMPTZ DEFAULT now(),
    checked_by UUID,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_brand_consistency IS 'Brand consistency validation results';

-- =====================================================
-- Table: synthex_library_brand_generation
-- Jobs for generating brand profiles from websites
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Input
    source_url TEXT NOT NULL,
    additional_urls TEXT[] DEFAULT '{}',
    business_description TEXT,
    industry TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    progress INTEGER DEFAULT 0, -- 0-100
    error_message TEXT,

    -- Output
    generated_profile JSONB, -- The generated brand profile data
    preview_colors JSONB,
    preview_tone TEXT,

    -- Execution
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    ai_model TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_brand_generation IS 'Jobs for AI brand profile generation';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brand_profiles_tenant
    ON synthex_library_brand_profiles(tenant_id);

CREATE INDEX IF NOT EXISTS idx_brand_voice_samples_tenant
    ON synthex_library_brand_voice_samples(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_voice_samples_profile
    ON synthex_library_brand_voice_samples(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_brand_voice_samples_type
    ON synthex_library_brand_voice_samples(content_type);

CREATE INDEX IF NOT EXISTS idx_brand_assets_tenant
    ON synthex_library_brand_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_profile
    ON synthex_library_brand_assets(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type
    ON synthex_library_brand_assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_brand_consistency_tenant
    ON synthex_library_brand_consistency(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_consistency_profile
    ON synthex_library_brand_consistency(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_brand_consistency_date
    ON synthex_library_brand_consistency(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_brand_generation_tenant
    ON synthex_library_brand_generation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_generation_status
    ON synthex_library_brand_generation(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_voice_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_consistency ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_generation ENABLE ROW LEVEL SECURITY;

-- Brand Profiles RLS
DROP POLICY IF EXISTS brand_profiles_tenant_policy ON synthex_library_brand_profiles;
CREATE POLICY brand_profiles_tenant_policy ON synthex_library_brand_profiles
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Voice Samples RLS
DROP POLICY IF EXISTS brand_voice_samples_tenant_policy ON synthex_library_brand_voice_samples;
CREATE POLICY brand_voice_samples_tenant_policy ON synthex_library_brand_voice_samples
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assets RLS
DROP POLICY IF EXISTS brand_assets_tenant_policy ON synthex_library_brand_assets;
CREATE POLICY brand_assets_tenant_policy ON synthex_library_brand_assets
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Consistency Checks RLS
DROP POLICY IF EXISTS brand_consistency_tenant_policy ON synthex_library_brand_consistency;
CREATE POLICY brand_consistency_tenant_policy ON synthex_library_brand_consistency
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Generation Jobs RLS
DROP POLICY IF EXISTS brand_generation_tenant_policy ON synthex_library_brand_generation;
CREATE POLICY brand_generation_tenant_policy ON synthex_library_brand_generation
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trigger_brand_profiles_updated ON synthex_library_brand_profiles;
CREATE TRIGGER trigger_brand_profiles_updated
    BEFORE UPDATE ON synthex_library_brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

-- =====================================================
-- Function: Calculate brand profile completion
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_brand_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    profile synthex_library_brand_profiles%ROWTYPE;
    completion INTEGER := 0;
BEGIN
    SELECT * INTO profile FROM synthex_library_brand_profiles WHERE id = profile_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Basic (20%)
    IF profile.brand_name IS NOT NULL THEN completion := completion + 5; END IF;
    IF profile.tagline IS NOT NULL THEN completion := completion + 5; END IF;
    IF profile.mission IS NOT NULL THEN completion := completion + 5; END IF;
    IF profile.logo_url IS NOT NULL THEN completion := completion + 5; END IF;

    -- Colors (20%)
    IF profile.color_primary IS NOT NULL THEN completion := completion + 10; END IF;
    IF profile.color_secondary IS NOT NULL THEN completion := completion + 5; END IF;
    IF profile.color_accent IS NOT NULL THEN completion := completion + 5; END IF;

    -- Voice (30%)
    IF profile.tone IS NOT NULL THEN completion := completion + 10; END IF;
    IF array_length(profile.voice_attributes, 1) > 0 THEN completion := completion + 10; END IF;
    IF profile.persona_description IS NOT NULL THEN completion := completion + 10; END IF;

    -- Guidelines (30%)
    IF array_length(profile.dos, 1) > 0 THEN completion := completion + 10; END IF;
    IF array_length(profile.donts, 1) > 0 THEN completion := completion + 10; END IF;
    IF array_length(profile.key_phrases, 1) > 0 THEN completion := completion + 10; END IF;

    -- Update the profile
    UPDATE synthex_library_brand_profiles
    SET completion_percentage = completion,
        is_complete = (completion >= 80)
    WHERE id = profile_id;

    RETURN completion;
END;
$$ LANGUAGE plpgsql;
