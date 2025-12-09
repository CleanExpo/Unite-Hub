-- =====================================================
-- Migration 444: Synthex Localization Engine
-- Phase D15: Multi-Language AI Localization
-- =====================================================
-- AI-powered translation and localization with cultural
-- adaptation, glossary management, and quality scoring.
-- =====================================================

-- =====================================================
-- Table: synthex_library_languages
-- Supported languages and their configurations
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Language Info
    code TEXT NOT NULL UNIQUE, -- ISO 639-1 (e.g., 'en', 'es', 'zh')
    name TEXT NOT NULL, -- English name
    native_name TEXT, -- Native name
    direction TEXT DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),

    -- Regional Variants
    region_code TEXT, -- ISO 3166-1 (e.g., 'US', 'GB', 'ES')
    full_code TEXT, -- Combined (e.g., 'en-US', 'es-ES')

    -- Features
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    supports_formal_informal BOOLEAN DEFAULT false, -- For languages with formal/informal

    -- AI Config
    ai_model_preference TEXT, -- Preferred model for this language
    cultural_notes TEXT, -- Notes for AI about cultural nuances

    -- Stats
    usage_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_languages IS 'Supported languages configuration';

-- Insert common languages
INSERT INTO synthex_library_languages (code, name, native_name, direction, supports_formal_informal) VALUES
('en', 'English', 'English', 'ltr', false),
('es', 'Spanish', 'Español', 'ltr', true),
('fr', 'French', 'Français', 'ltr', true),
('de', 'German', 'Deutsch', 'ltr', true),
('it', 'Italian', 'Italiano', 'ltr', true),
('pt', 'Portuguese', 'Português', 'ltr', false),
('nl', 'Dutch', 'Nederlands', 'ltr', true),
('pl', 'Polish', 'Polski', 'ltr', true),
('ru', 'Russian', 'Русский', 'ltr', true),
('ja', 'Japanese', '日本語', 'ltr', true),
('zh', 'Chinese', '中文', 'ltr', false),
('ko', 'Korean', '한국어', 'ltr', true),
('ar', 'Arabic', 'العربية', 'rtl', false),
('he', 'Hebrew', 'עברית', 'rtl', false),
('hi', 'Hindi', 'हिन्दी', 'ltr', false),
('th', 'Thai', 'ไทย', 'ltr', false),
('vi', 'Vietnamese', 'Tiếng Việt', 'ltr', false),
('tr', 'Turkish', 'Türkçe', 'ltr', true),
('sv', 'Swedish', 'Svenska', 'ltr', false),
('da', 'Danish', 'Dansk', 'ltr', false)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Table: synthex_library_glossaries
-- Brand-specific terminology glossaries
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_glossaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    brand_id UUID, -- Optional brand association

    -- Glossary Info
    name TEXT NOT NULL,
    description TEXT,
    source_language TEXT NOT NULL DEFAULT 'en',

    -- Settings
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority = override others

    -- Stats
    term_count INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_glossaries IS 'Brand-specific terminology glossaries';

-- =====================================================
-- Table: synthex_library_glossary_terms
-- Individual glossary terms and translations
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_glossary_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glossary_id UUID NOT NULL REFERENCES synthex_library_glossaries(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Term Info
    source_term TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'en',

    -- Context
    context TEXT, -- Usage context
    part_of_speech TEXT, -- noun, verb, adjective, etc.
    notes TEXT, -- Translator notes

    -- Settings
    case_sensitive BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    do_not_translate BOOLEAN DEFAULT false, -- Keep original (brand names, etc.)

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,

    UNIQUE(glossary_id, source_term, source_language)
);

COMMENT ON TABLE synthex_library_glossary_terms IS 'Glossary source terms';

-- =====================================================
-- Table: synthex_library_term_translations
-- Translations for glossary terms
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_term_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES synthex_library_glossary_terms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Translation
    target_language TEXT NOT NULL,
    translation TEXT NOT NULL,

    -- Variants
    formal_translation TEXT, -- For formal register
    informal_translation TEXT, -- For informal register

    -- Quality
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(term_id, target_language)
);

COMMENT ON TABLE synthex_library_term_translations IS 'Term translations per language';

-- =====================================================
-- Table: synthex_library_translations
-- Content translations (full texts)
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Source Content
    source_content TEXT NOT NULL,
    source_language TEXT NOT NULL,
    source_content_type TEXT, -- 'email', 'social', 'template', etc.
    source_content_id UUID, -- Reference to original content

    -- Target
    target_language TEXT NOT NULL,

    -- Translation
    translated_content TEXT NOT NULL,

    -- Options Used
    formality TEXT CHECK (formality IN ('formal', 'informal', 'auto')),
    preserve_formatting BOOLEAN DEFAULT true,
    cultural_adaptation BOOLEAN DEFAULT true,

    -- Quality
    quality_score NUMERIC(3,2), -- 0.0 - 1.0
    fluency_score NUMERIC(3,2),
    accuracy_score NUMERIC(3,2),
    cultural_appropriateness NUMERIC(3,2),

    -- AI Details
    ai_model TEXT,
    ai_reasoning TEXT, -- Why certain choices were made
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    -- Glossary
    glossary_id UUID REFERENCES synthex_library_glossaries(id),
    terms_applied INTEGER DEFAULT 0, -- Number of glossary terms used

    -- Review
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'processing', 'completed', 'review_needed', 'approved', 'rejected'
    )),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Edits
    was_edited BOOLEAN DEFAULT false,
    edited_content TEXT,
    edited_by UUID,
    edited_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_translations IS 'Content translations';

-- =====================================================
-- Table: synthex_library_translation_memory
-- Translation memory for reuse
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Source
    source_segment TEXT NOT NULL,
    source_language TEXT NOT NULL,
    source_hash TEXT NOT NULL, -- For fast lookup

    -- Target
    target_language TEXT NOT NULL,
    target_segment TEXT NOT NULL,

    -- Quality
    match_score NUMERIC(3,2) DEFAULT 1.0, -- 1.0 = exact match
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT now(),

    -- Source
    source_translation_id UUID REFERENCES synthex_library_translations(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, source_hash, source_language, target_language)
);

COMMENT ON TABLE synthex_library_translation_memory IS 'Translation memory for segment reuse';

-- =====================================================
-- Table: synthex_library_localization_projects
-- Multi-content localization projects
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_localization_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Project Info
    name TEXT NOT NULL,
    description TEXT,
    source_language TEXT NOT NULL DEFAULT 'en',
    target_languages TEXT[] NOT NULL,

    -- Content
    content_type TEXT, -- 'campaign', 'template', 'website', etc.
    content_ids UUID[] DEFAULT '{}', -- References to content

    -- Settings
    glossary_id UUID REFERENCES synthex_library_glossaries(id),
    default_formality TEXT DEFAULT 'auto',
    cultural_adaptation BOOLEAN DEFAULT true,

    -- Progress
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'in_progress', 'review', 'completed', 'cancelled'
    )),
    total_segments INTEGER DEFAULT 0,
    translated_segments INTEGER DEFAULT 0,
    approved_segments INTEGER DEFAULT 0,

    -- Timeline
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_localization_projects IS 'Localization projects';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_glossaries_tenant
    ON synthex_library_glossaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_glossaries_brand
    ON synthex_library_glossaries(brand_id);

CREATE INDEX IF NOT EXISTS idx_glossary_terms_glossary
    ON synthex_library_glossary_terms(glossary_id);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_source
    ON synthex_library_glossary_terms(source_term);

CREATE INDEX IF NOT EXISTS idx_term_translations_term
    ON synthex_library_term_translations(term_id);
CREATE INDEX IF NOT EXISTS idx_term_translations_lang
    ON synthex_library_term_translations(target_language);

CREATE INDEX IF NOT EXISTS idx_translations_tenant
    ON synthex_library_translations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_translations_source_content
    ON synthex_library_translations(source_content_id);
CREATE INDEX IF NOT EXISTS idx_translations_languages
    ON synthex_library_translations(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_translations_date
    ON synthex_library_translations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translation_memory_lookup
    ON synthex_library_translation_memory(tenant_id, source_hash, source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_translation_memory_usage
    ON synthex_library_translation_memory(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_localization_projects_tenant
    ON synthex_library_localization_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_localization_projects_status
    ON synthex_library_localization_projects(status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_glossaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_term_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_localization_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY glossaries_tenant_policy ON synthex_library_glossaries
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY glossary_terms_tenant_policy ON synthex_library_glossary_terms
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY term_translations_tenant_policy ON synthex_library_term_translations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY translations_tenant_policy ON synthex_library_translations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY translation_memory_tenant_policy ON synthex_library_translation_memory
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY localization_projects_tenant_policy ON synthex_library_localization_projects
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_localization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_glossaries_updated ON synthex_library_glossaries;
CREATE TRIGGER trigger_glossaries_updated
    BEFORE UPDATE ON synthex_library_glossaries
    FOR EACH ROW EXECUTE FUNCTION update_localization_timestamp();

DROP TRIGGER IF EXISTS trigger_glossary_terms_updated ON synthex_library_glossary_terms;
CREATE TRIGGER trigger_glossary_terms_updated
    BEFORE UPDATE ON synthex_library_glossary_terms
    FOR EACH ROW EXECUTE FUNCTION update_localization_timestamp();

DROP TRIGGER IF EXISTS trigger_term_translations_updated ON synthex_library_term_translations;
CREATE TRIGGER trigger_term_translations_updated
    BEFORE UPDATE ON synthex_library_term_translations
    FOR EACH ROW EXECUTE FUNCTION update_localization_timestamp();

DROP TRIGGER IF EXISTS trigger_localization_projects_updated ON synthex_library_localization_projects;
CREATE TRIGGER trigger_localization_projects_updated
    BEFORE UPDATE ON synthex_library_localization_projects
    FOR EACH ROW EXECUTE FUNCTION update_localization_timestamp();

-- =====================================================
-- Function: Update glossary term count
-- =====================================================
CREATE OR REPLACE FUNCTION update_glossary_term_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE synthex_library_glossaries
        SET term_count = term_count + 1
        WHERE id = NEW.glossary_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE synthex_library_glossaries
        SET term_count = term_count - 1
        WHERE id = OLD.glossary_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_glossary_term_count ON synthex_library_glossary_terms;
CREATE TRIGGER trigger_glossary_term_count
    AFTER INSERT OR DELETE ON synthex_library_glossary_terms
    FOR EACH ROW EXECUTE FUNCTION update_glossary_term_count();

-- =====================================================
-- Function: Generate source hash for translation memory
-- =====================================================
CREATE OR REPLACE FUNCTION generate_translation_hash(p_text TEXT, p_lang TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Simple hash: lowercase, trim, normalize whitespace
    RETURN md5(lower(regexp_replace(trim(p_text), '\s+', ' ', 'g')) || '|' || p_lang);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Find translation memory matches
-- =====================================================
CREATE OR REPLACE FUNCTION find_translation_memory(
    p_tenant_id UUID,
    p_source_text TEXT,
    p_source_lang TEXT,
    p_target_lang TEXT,
    p_threshold NUMERIC DEFAULT 0.8
)
RETURNS TABLE(
    segment TEXT,
    translation TEXT,
    match_score NUMERIC
) AS $$
DECLARE
    v_hash TEXT;
BEGIN
    v_hash := generate_translation_hash(p_source_text, p_source_lang);

    -- Exact match
    RETURN QUERY
    SELECT tm.source_segment, tm.target_segment, tm.match_score
    FROM synthex_library_translation_memory tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.source_hash = v_hash
      AND tm.source_language = p_source_lang
      AND tm.target_language = p_target_lang
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;
