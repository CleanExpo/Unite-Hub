-- =====================================================
-- Migration 440: Synthex Multi-Brand Profile Engine
-- Phase D11: Multi-Brand Management
-- =====================================================
-- Support for multiple brand profiles per tenant with
-- asset management, guidelines, and brand switching.
-- =====================================================

-- =====================================================
-- CLEANUP: Drop partially created tables to start fresh
-- =====================================================
DROP TABLE IF EXISTS synthex_library_brand_validations CASCADE;
DROP TABLE IF EXISTS synthex_library_brand_switches CASCADE;
DROP TABLE IF EXISTS synthex_library_brand_templates CASCADE;
DROP TABLE IF EXISTS synthex_library_brand_guidelines CASCADE;
DROP TABLE IF EXISTS synthex_library_brand_assets CASCADE;
DROP TABLE IF EXISTS synthex_library_brand_profiles CASCADE;

-- =====================================================
-- Table: synthex_library_brand_profiles
-- Core brand identity definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Brand Identity
    name TEXT NOT NULL,
    slug TEXT, -- URL-friendly identifier
    description TEXT,
    tagline TEXT,

    -- Visual Identity
    logo_url TEXT,
    logo_dark_url TEXT, -- For dark mode
    favicon_url TEXT,
    primary_color TEXT, -- Hex code
    secondary_color TEXT,
    accent_color TEXT,
    text_color TEXT,
    background_color TEXT,
    color_palette JSONB DEFAULT '[]', -- Extended palette

    -- Typography
    heading_font TEXT,
    body_font TEXT,
    font_sizes JSONB DEFAULT '{}', -- { h1: "2.5rem", h2: "2rem", etc. }

    -- Voice & Tone
    tone_profile_id UUID, -- Link to tone profile
    voice_keywords TEXT[] DEFAULT '{}', -- e.g., ['friendly', 'professional']
    personality_traits JSONB DEFAULT '[]', -- e.g., [{ trait: 'innovative', score: 0.8 }]

    -- Messaging
    value_proposition TEXT,
    key_messages TEXT[] DEFAULT '{}',
    elevator_pitch TEXT,
    mission_statement TEXT,
    vision_statement TEXT,

    -- Contact Info
    email TEXT,
    phone TEXT,
    website TEXT,
    address JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}', -- { twitter: "...", linkedin: "..." }

    -- Legal
    legal_name TEXT,
    registration_number TEXT,
    tax_id TEXT,
    copyright_text TEXT,
    privacy_policy_url TEXT,
    terms_url TEXT,

    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    use_for_channels TEXT[] DEFAULT '{}', -- e.g., ['email', 'social']

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,

    UNIQUE(tenant_id, slug)
);

COMMENT ON TABLE synthex_library_brand_profiles IS 'Multi-brand profile definitions';

-- =====================================================
-- Table: synthex_library_brand_assets
-- Brand asset management (logos, images, fonts, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_id UUID NOT NULL REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Asset Info
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN (
        'logo', 'icon', 'image', 'font', 'video',
        'document', 'template', 'illustration', 'pattern'
    )),

    -- File Details
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER, -- bytes
    mime_type TEXT,
    dimensions JSONB DEFAULT '{}', -- { width: 1200, height: 600 }

    -- Variations
    variants JSONB DEFAULT '[]', -- [{ name: 'dark', url: '...', size: 'sm' }]

    -- Usage
    use_cases TEXT[] DEFAULT '{}', -- e.g., ['email-header', 'social-profile']
    usage_guidelines TEXT,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending')),
    is_primary BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID
);

COMMENT ON TABLE synthex_library_brand_assets IS 'Brand asset library';

-- =====================================================
-- Table: synthex_library_brand_guidelines
-- Brand guidelines and rules
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_id UUID NOT NULL REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Guideline Info
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'logo', 'color', 'typography', 'imagery', 'voice',
        'layout', 'spacing', 'iconography', 'motion', 'general'
    )),
    priority INTEGER DEFAULT 0, -- For ordering

    -- Content
    description TEXT,
    dos TEXT[] DEFAULT '{}', -- What to do
    donts TEXT[] DEFAULT '{}', -- What not to do
    examples JSONB DEFAULT '[]', -- { type: 'image', url: '...', caption: '...' }

    -- References
    related_assets UUID[] DEFAULT '{}', -- Asset IDs

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_brand_guidelines IS 'Brand usage guidelines';

-- =====================================================
-- Table: synthex_library_brand_templates
-- Brand-specific templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_id UUID NOT NULL REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN (
        'email', 'social_post', 'ad', 'landing_page',
        'document', 'presentation', 'newsletter', 'signature'
    )),
    channel TEXT, -- e.g., 'twitter', 'linkedin', 'email'

    -- Content
    content JSONB NOT NULL DEFAULT '{}', -- Template structure
    preview_url TEXT,
    thumbnail_url TEXT,

    -- Variables
    variables JSONB DEFAULT '[]', -- [{ name: 'headline', type: 'text', required: true }]

    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Stats
    usage_count INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_brand_templates IS 'Brand-specific templates';

-- =====================================================
-- Table: synthex_library_brand_switches
-- Log of brand switches for auditing
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Switch Details
    from_brand_id UUID REFERENCES synthex_library_brand_profiles(id),
    to_brand_id UUID NOT NULL REFERENCES synthex_library_brand_profiles(id),
    context TEXT, -- e.g., 'campaign_creation', 'template_edit'
    context_id UUID, -- Reference to campaign/template/etc.

    -- User
    switched_by UUID NOT NULL,
    switched_at TIMESTAMPTZ DEFAULT now(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_brand_switches IS 'Brand switch audit log';

-- =====================================================
-- Table: synthex_library_brand_validations
-- Brand compliance validation results
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_brand_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_id UUID NOT NULL REFERENCES synthex_library_brand_profiles(id) ON DELETE CASCADE,

    -- Content Being Validated
    content_type TEXT NOT NULL, -- 'email', 'social_post', 'ad', etc.
    content_id UUID,
    content_snapshot JSONB, -- Snapshot of content at validation time

    -- Validation Results
    is_compliant BOOLEAN NOT NULL DEFAULT true,
    compliance_score NUMERIC(3,2), -- 0.0 - 1.0

    -- Issues Found
    issues JSONB DEFAULT '[]', -- [{ category: 'color', severity: 'warning', message: '...' }]

    -- AI Analysis
    ai_model TEXT,
    ai_suggestions JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),

    -- Metadata
    validated_at TIMESTAMPTZ DEFAULT now(),
    validated_by UUID
);

COMMENT ON TABLE synthex_library_brand_validations IS 'Brand compliance validation results';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brand_profiles_tenant
    ON synthex_library_brand_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_default
    ON synthex_library_brand_profiles(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_brand_profiles_active
    ON synthex_library_brand_profiles(tenant_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_brand_assets_brand
    ON synthex_library_brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type
    ON synthex_library_brand_assets(brand_id, asset_type);

CREATE INDEX IF NOT EXISTS idx_brand_guidelines_brand
    ON synthex_library_brand_guidelines(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_guidelines_category
    ON synthex_library_brand_guidelines(brand_id, category);

CREATE INDEX IF NOT EXISTS idx_brand_templates_brand
    ON synthex_library_brand_templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_templates_type
    ON synthex_library_brand_templates(brand_id, template_type);

CREATE INDEX IF NOT EXISTS idx_brand_switches_tenant
    ON synthex_library_brand_switches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_switches_date
    ON synthex_library_brand_switches(switched_at DESC);

CREATE INDEX IF NOT EXISTS idx_brand_validations_brand
    ON synthex_library_brand_validations(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_validations_date
    ON synthex_library_brand_validations(validated_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_brand_validations ENABLE ROW LEVEL SECURITY;

-- Brand Profiles RLS
DROP POLICY IF EXISTS brand_profiles_tenant_policy ON synthex_library_brand_profiles;
CREATE POLICY brand_profiles_tenant_policy ON synthex_library_brand_profiles
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand Assets RLS
DROP POLICY IF EXISTS brand_assets_tenant_policy ON synthex_library_brand_assets;
CREATE POLICY brand_assets_tenant_policy ON synthex_library_brand_assets
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand Guidelines RLS
DROP POLICY IF EXISTS brand_guidelines_tenant_policy ON synthex_library_brand_guidelines;
CREATE POLICY brand_guidelines_tenant_policy ON synthex_library_brand_guidelines
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand Templates RLS
DROP POLICY IF EXISTS brand_templates_tenant_policy ON synthex_library_brand_templates;
CREATE POLICY brand_templates_tenant_policy ON synthex_library_brand_templates
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand Switches RLS
DROP POLICY IF EXISTS brand_switches_tenant_policy ON synthex_library_brand_switches;
CREATE POLICY brand_switches_tenant_policy ON synthex_library_brand_switches
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand Validations RLS
DROP POLICY IF EXISTS brand_validations_tenant_policy ON synthex_library_brand_validations;
CREATE POLICY brand_validations_tenant_policy ON synthex_library_brand_validations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_brand_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_brand_profiles_updated ON synthex_library_brand_profiles;
CREATE TRIGGER trigger_brand_profiles_updated
    BEFORE UPDATE ON synthex_library_brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_brand_updated_at();

DROP TRIGGER IF EXISTS trigger_brand_assets_updated ON synthex_library_brand_assets;
CREATE TRIGGER trigger_brand_assets_updated
    BEFORE UPDATE ON synthex_library_brand_assets
    FOR EACH ROW EXECUTE FUNCTION update_brand_updated_at();

DROP TRIGGER IF EXISTS trigger_brand_guidelines_updated ON synthex_library_brand_guidelines;
CREATE TRIGGER trigger_brand_guidelines_updated
    BEFORE UPDATE ON synthex_library_brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_brand_updated_at();

DROP TRIGGER IF EXISTS trigger_brand_templates_updated ON synthex_library_brand_templates;
CREATE TRIGGER trigger_brand_templates_updated
    BEFORE UPDATE ON synthex_library_brand_templates
    FOR EACH ROW EXECUTE FUNCTION update_brand_updated_at();

-- =====================================================
-- Function: Get brand context for AI
-- =====================================================
CREATE OR REPLACE FUNCTION get_brand_context(p_brand_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'brand', jsonb_build_object(
            'name', bp.name,
            'tagline', bp.tagline,
            'voice_keywords', bp.voice_keywords,
            'value_proposition', bp.value_proposition,
            'key_messages', bp.key_messages,
            'primary_color', bp.primary_color,
            'secondary_color', bp.secondary_color
        ),
        'tone', CASE WHEN tp.id IS NOT NULL THEN jsonb_build_object(
            'name', tp.name,
            'formality', tp.formality,
            'enthusiasm', tp.enthusiasm,
            'friendliness', tp.friendliness
        ) ELSE NULL END,
        'guidelines', (
            SELECT jsonb_agg(jsonb_build_object(
                'category', bg.category,
                'title', bg.title,
                'dos', bg.dos,
                'donts', bg.donts
            ))
            FROM synthex_library_brand_guidelines bg
            WHERE bg.brand_id = p_brand_id AND bg.is_active = true
        )
    ) INTO v_result
    FROM synthex_library_brand_profiles bp
    LEFT JOIN synthex_library_tone_profiles tp ON bp.tone_profile_id = tp.id
    WHERE bp.id = p_brand_id;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Function: Ensure single default brand per tenant
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_single_default_brand()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE synthex_library_brand_profiles
        SET is_default = false
        WHERE tenant_id = NEW.tenant_id
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_brand ON synthex_library_brand_profiles;
CREATE TRIGGER trigger_single_default_brand
    BEFORE INSERT OR UPDATE OF is_default ON synthex_library_brand_profiles
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_brand();
