-- =====================================================
-- Migration 433: Synthex Template Library
-- Phase D04: Template Library
-- =====================================================
-- Centralized template management system for Synthex
-- with categories, versioning, and variable extraction.
-- NOTE: Uses 'synthex_library_*' prefix to avoid conflict
-- with existing synthex_library_templates table from migration 430.
-- =====================================================

-- =====================================================
-- Table: synthex_library_categories
-- Organize templates by category
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name
    color TEXT, -- Hex color for UI
    parent_id UUID REFERENCES synthex_library_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

COMMENT ON TABLE synthex_library_categories IS 'Template library categories for organization';

-- =====================================================
-- Table: synthex_library_templates
-- Core template storage with versioning
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id UUID REFERENCES synthex_library_categories(id) ON DELETE SET NULL,

    -- Template Identity
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,

    -- Template Type
    template_type TEXT NOT NULL CHECK (template_type IN (
        'email', 'sms', 'social_post', 'landing_page', 'ad_copy',
        'blog_post', 'product_description', 'meta_description',
        'headline', 'cta', 'testimonial', 'case_study', 'custom'
    )),

    -- Content
    content TEXT NOT NULL,
    content_html TEXT, -- Rendered HTML version
    preview_text TEXT, -- Short preview

    -- Variables (extracted placeholders like {{name}}, {{company}})
    variables JSONB DEFAULT '[]', -- Array of {name, type, default, required}

    -- Versioning
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true,
    parent_template_id UUID REFERENCES synthex_library_templates(id) ON DELETE SET NULL,

    -- Usage Stats
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'archived', 'deprecated'
    )),

    -- AI Metadata
    ai_generated BOOLEAN DEFAULT false,
    ai_model TEXT,
    ai_prompt TEXT,

    -- Branding
    brand_voice_score NUMERIC(3,2), -- 0.00 - 1.00 alignment

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, slug, version)
);

COMMENT ON TABLE synthex_library_templates IS 'Core template storage for Synthex';

-- =====================================================
-- Table: synthex_library_versions
-- Full version history for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    variables JSONB DEFAULT '[]',
    change_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(template_id, version)
);

COMMENT ON TABLE synthex_library_versions IS 'Version history for templates';

-- =====================================================
-- Table: synthex_library_usage
-- Track template usage for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,
    used_by UUID,
    used_at TIMESTAMPTZ DEFAULT now(),
    context TEXT, -- Where it was used (campaign, email, etc.)
    context_id UUID, -- Reference to the entity
    variables_used JSONB DEFAULT '{}',
    output_generated TEXT,
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_usage IS 'Template usage tracking for analytics';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_template_categories_tenant
    ON synthex_library_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_categories_parent
    ON synthex_library_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_template_categories_slug
    ON synthex_library_categories(tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_templates_tenant
    ON synthex_library_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_templates_category
    ON synthex_library_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_type
    ON synthex_library_templates(tenant_id, template_type);
CREATE INDEX IF NOT EXISTS idx_templates_status
    ON synthex_library_templates(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_templates_slug
    ON synthex_library_templates(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_templates_latest
    ON synthex_library_templates(tenant_id, is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_templates_tags
    ON synthex_library_templates USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_template_versions_template
    ON synthex_library_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_tenant
    ON synthex_library_versions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_template_usage_tenant
    ON synthex_library_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template
    ON synthex_library_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_date
    ON synthex_library_usage(used_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_usage ENABLE ROW LEVEL SECURITY;

-- Categories RLS
DROP POLICY IF EXISTS template_categories_tenant_policy ON synthex_library_categories;
CREATE POLICY template_categories_tenant_policy ON synthex_library_categories
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Templates RLS
DROP POLICY IF EXISTS templates_tenant_policy ON synthex_library_templates;
CREATE POLICY templates_tenant_policy ON synthex_library_templates
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Versions RLS
DROP POLICY IF EXISTS template_versions_tenant_policy ON synthex_library_versions;
CREATE POLICY template_versions_tenant_policy ON synthex_library_versions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Usage RLS
DROP POLICY IF EXISTS template_usage_tenant_policy ON synthex_library_usage;
CREATE POLICY template_usage_tenant_policy ON synthex_library_usage
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_template_categories_updated ON synthex_library_categories;
CREATE TRIGGER trigger_template_categories_updated
    BEFORE UPDATE ON synthex_library_categories
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

DROP TRIGGER IF EXISTS trigger_templates_updated ON synthex_library_templates;
CREATE TRIGGER trigger_templates_updated
    BEFORE UPDATE ON synthex_library_templates
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

-- =====================================================
-- Function: Increment template usage
-- =====================================================
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE synthex_library_templates
    SET usage_count = usage_count + 1,
        last_used_at = now()
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Seed Default Categories (per tenant on first use)
-- =====================================================
-- Categories will be created by the application on tenant initialization
