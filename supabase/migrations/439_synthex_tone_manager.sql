-- =====================================================
-- Migration 439: Synthex AI Tone Manager
-- Phase D10: AI Tone Management
-- =====================================================
-- AI-powered tone profiles for consistent brand voice
-- across all content with transformation capabilities.
-- =====================================================

-- =====================================================
-- Table: synthex_library_tone_profiles
-- Core tone profile definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_tone_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Profile Identity
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT, -- URL-friendly identifier

    -- Tone Characteristics (0.0 - 1.0 scales)
    formality NUMERIC(3,2) DEFAULT 0.50, -- 0=casual, 1=formal
    enthusiasm NUMERIC(3,2) DEFAULT 0.50, -- 0=neutral, 1=enthusiastic
    confidence NUMERIC(3,2) DEFAULT 0.70, -- 0=tentative, 1=assertive
    friendliness NUMERIC(3,2) DEFAULT 0.60, -- 0=professional distance, 1=warm/personal
    humor NUMERIC(3,2) DEFAULT 0.20, -- 0=serious, 1=playful
    urgency NUMERIC(3,2) DEFAULT 0.30, -- 0=relaxed, 1=urgent
    empathy NUMERIC(3,2) DEFAULT 0.50, -- 0=matter-of-fact, 1=empathetic
    authority NUMERIC(3,2) DEFAULT 0.50, -- 0=peer-level, 1=expert

    -- Writing Style Rules
    sentence_length TEXT DEFAULT 'mixed' CHECK (sentence_length IN (
        'short', 'medium', 'long', 'mixed'
    )),
    vocabulary_level TEXT DEFAULT 'intermediate' CHECK (vocabulary_level IN (
        'simple', 'intermediate', 'advanced', 'technical'
    )),
    use_contractions BOOLEAN DEFAULT true,
    use_first_person BOOLEAN DEFAULT true,
    use_second_person BOOLEAN DEFAULT true,
    active_voice_preference NUMERIC(3,2) DEFAULT 0.80, -- 0=passive ok, 1=always active

    -- Word Preferences
    preferred_words TEXT[] DEFAULT '{}', -- Words to favor
    avoided_words TEXT[] DEFAULT '{}', -- Words to avoid
    industry_jargon BOOLEAN DEFAULT false, -- Allow industry-specific terms
    emoji_usage TEXT DEFAULT 'minimal' CHECK (emoji_usage IN (
        'none', 'minimal', 'moderate', 'frequent'
    )),

    -- Example Phrases
    example_greetings TEXT[] DEFAULT '{}', -- e.g., ["Hi there!", "Hello,"]
    example_closings TEXT[] DEFAULT '{}', -- e.g., ["Best regards,", "Cheers,"]
    example_ctas TEXT[] DEFAULT '{}', -- e.g., ["Get started now", "Learn more"]
    example_content TEXT, -- Longer example of on-tone content

    -- AI Context
    ai_instructions TEXT, -- Custom instructions for AI
    negative_examples TEXT, -- What NOT to do

    -- Usage
    use_cases TEXT[] DEFAULT '{}', -- e.g., ['email', 'social', 'blog']
    is_default BOOLEAN DEFAULT false,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'draft', 'archived'
    )),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,

    UNIQUE(tenant_id, slug)
);

COMMENT ON TABLE synthex_library_tone_profiles IS 'AI tone profiles for consistent brand voice';

-- =====================================================
-- Table: synthex_library_tone_transformations
-- Log of tone transformations performed
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_tone_transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tone_profile_id UUID REFERENCES synthex_library_tone_profiles(id) ON DELETE SET NULL,

    -- Input/Output
    original_content TEXT NOT NULL,
    transformed_content TEXT NOT NULL,
    content_type TEXT, -- 'email', 'social', 'ad', etc.

    -- Quality Metrics
    tone_match_score NUMERIC(3,2), -- How well result matches tone (0-1)
    readability_score NUMERIC(3,2),
    confidence NUMERIC(3,2),

    -- Changes Made
    changes_summary TEXT,
    word_count_original INTEGER,
    word_count_transformed INTEGER,

    -- AI Details
    ai_model TEXT,
    tokens_used INTEGER,
    processing_time_ms INTEGER,

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    error_message TEXT,

    -- Feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_tone_transformations IS 'Log of AI tone transformations';

-- =====================================================
-- Table: synthex_library_tone_presets
-- Pre-built tone presets for quick selection
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_tone_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Preset Identity
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'professional', 'casual', 'industry', etc.

    -- Tone Settings (same structure as profiles)
    formality NUMERIC(3,2),
    enthusiasm NUMERIC(3,2),
    confidence NUMERIC(3,2),
    friendliness NUMERIC(3,2),
    humor NUMERIC(3,2),
    urgency NUMERIC(3,2),
    empathy NUMERIC(3,2),
    authority NUMERIC(3,2),

    -- Style
    sentence_length TEXT,
    vocabulary_level TEXT,
    use_contractions BOOLEAN,
    emoji_usage TEXT,

    -- Examples
    example_content TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false, -- Requires paid plan

    -- Metadata
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_tone_presets IS 'Pre-built tone presets';

-- Insert default presets
INSERT INTO synthex_library_tone_presets (name, description, category, formality, enthusiasm, confidence, friendliness, humor, urgency, empathy, authority, sentence_length, vocabulary_level, use_contractions, emoji_usage, example_content) VALUES
('Professional', 'Clean, business-appropriate tone', 'professional', 0.75, 0.40, 0.70, 0.45, 0.10, 0.30, 0.50, 0.65, 'medium', 'intermediate', true, 'none', 'We appreciate your interest in our services. Our team is committed to delivering exceptional results that align with your business objectives.'),
('Friendly Casual', 'Warm and approachable', 'casual', 0.30, 0.70, 0.60, 0.85, 0.40, 0.25, 0.70, 0.30, 'short', 'simple', true, 'moderate', 'Hey! Thanks so much for reaching out. We''d love to help you out with this.'),
('Authoritative Expert', 'Confident thought leadership', 'professional', 0.80, 0.50, 0.90, 0.40, 0.05, 0.40, 0.35, 0.95, 'mixed', 'advanced', false, 'none', 'Based on extensive research and industry analysis, we have identified key factors that drive measurable outcomes.'),
('Empathetic Support', 'Understanding and helpful', 'support', 0.50, 0.45, 0.55, 0.80, 0.10, 0.20, 0.95, 0.40, 'medium', 'simple', true, 'minimal', 'We completely understand how frustrating this must be for you. Let''s work together to find a solution.'),
('Urgent Sales', 'Action-oriented with urgency', 'sales', 0.55, 0.85, 0.85, 0.60, 0.15, 0.90, 0.40, 0.70, 'short', 'simple', true, 'minimal', 'Don''t miss out! This exclusive offer ends soon. Take action now to secure your spot.'),
('Playful Brand', 'Fun and engaging', 'casual', 0.20, 0.90, 0.65, 0.90, 0.80, 0.35, 0.55, 0.25, 'short', 'simple', true, 'frequent', 'Guess what? We''ve got something awesome to share with you! You''re gonna love this.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Table: synthex_library_tone_analysis
-- Analyze existing content for tone
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_tone_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Content Analyzed
    content TEXT NOT NULL,
    content_type TEXT,
    content_id UUID, -- Reference to source

    -- Detected Tone (0.0 - 1.0)
    detected_formality NUMERIC(3,2),
    detected_enthusiasm NUMERIC(3,2),
    detected_confidence NUMERIC(3,2),
    detected_friendliness NUMERIC(3,2),
    detected_humor NUMERIC(3,2),
    detected_urgency NUMERIC(3,2),
    detected_empathy NUMERIC(3,2),
    detected_authority NUMERIC(3,2),

    -- Overall Assessment
    primary_tone TEXT, -- e.g., 'professional', 'casual', 'urgent'
    secondary_tones TEXT[] DEFAULT '{}',
    tone_consistency_score NUMERIC(3,2), -- How consistent is the tone

    -- Readability
    flesch_kincaid_grade NUMERIC(4,2),
    average_sentence_length NUMERIC(5,2),
    vocabulary_complexity TEXT,

    -- Comparison
    closest_profile_id UUID REFERENCES synthex_library_tone_profiles(id),
    profile_match_score NUMERIC(3,2),

    -- AI Details
    ai_model TEXT,
    confidence NUMERIC(3,2),

    -- Metadata
    analyzed_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_tone_analysis IS 'Tone analysis results for content';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tone_profiles_tenant
    ON synthex_library_tone_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tone_profiles_status
    ON synthex_library_tone_profiles(status);
CREATE INDEX IF NOT EXISTS idx_tone_profiles_default
    ON synthex_library_tone_profiles(tenant_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_tone_transformations_tenant
    ON synthex_library_tone_transformations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tone_transformations_profile
    ON synthex_library_tone_transformations(tone_profile_id);
CREATE INDEX IF NOT EXISTS idx_tone_transformations_date
    ON synthex_library_tone_transformations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tone_presets_category
    ON synthex_library_tone_presets(category);
CREATE INDEX IF NOT EXISTS idx_tone_presets_active
    ON synthex_library_tone_presets(is_active);

CREATE INDEX IF NOT EXISTS idx_tone_analysis_tenant
    ON synthex_library_tone_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tone_analysis_content
    ON synthex_library_tone_analysis(content_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_tone_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_tone_transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_tone_analysis ENABLE ROW LEVEL SECURITY;

-- Tone Profiles RLS
DROP POLICY IF EXISTS tone_profiles_tenant_policy ON synthex_library_tone_profiles;
CREATE POLICY tone_profiles_tenant_policy ON synthex_library_tone_profiles
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Transformations RLS
DROP POLICY IF EXISTS tone_transformations_tenant_policy ON synthex_library_tone_transformations;
CREATE POLICY tone_transformations_tenant_policy ON synthex_library_tone_transformations
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Analysis RLS
DROP POLICY IF EXISTS tone_analysis_tenant_policy ON synthex_library_tone_analysis;
CREATE POLICY tone_analysis_tenant_policy ON synthex_library_tone_analysis
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_tone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tone_profiles_updated ON synthex_library_tone_profiles;
CREATE TRIGGER trigger_tone_profiles_updated
    BEFORE UPDATE ON synthex_library_tone_profiles
    FOR EACH ROW EXECUTE FUNCTION update_tone_updated_at();

-- =====================================================
-- Function: Calculate tone similarity
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_tone_similarity(
    p_formality1 NUMERIC, p_enthusiasm1 NUMERIC, p_confidence1 NUMERIC, p_friendliness1 NUMERIC,
    p_formality2 NUMERIC, p_enthusiasm2 NUMERIC, p_confidence2 NUMERIC, p_friendliness2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    diff NUMERIC;
BEGIN
    diff := ABS(COALESCE(p_formality1, 0.5) - COALESCE(p_formality2, 0.5)) +
            ABS(COALESCE(p_enthusiasm1, 0.5) - COALESCE(p_enthusiasm2, 0.5)) +
            ABS(COALESCE(p_confidence1, 0.5) - COALESCE(p_confidence2, 0.5)) +
            ABS(COALESCE(p_friendliness1, 0.5) - COALESCE(p_friendliness2, 0.5));

    -- Convert to 0-1 similarity score (max diff is 4.0)
    RETURN ROUND(1.0 - (diff / 4.0), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
