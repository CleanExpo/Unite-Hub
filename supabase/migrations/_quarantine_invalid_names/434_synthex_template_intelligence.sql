-- =====================================================
-- Migration 434: Synthex Template Intelligence
-- Phase D05: Template Intelligence
-- =====================================================
-- AI-powered template analysis, improvement suggestions,
-- performance predictions, and A/B testing support.
-- =====================================================

-- =====================================================
-- Table: synthex_library_insights
-- AI-generated insights for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,

    -- Insight Classification
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'clarity', 'engagement', 'conversion', 'brevity',
        'tone', 'structure', 'personalization', 'cta',
        'grammar', 'readability', 'brand_alignment'
    )),

    -- Insight Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN (
        'critical', 'warning', 'info', 'success'
    )),

    -- Scoring
    score NUMERIC(3,2), -- 0.00 - 1.00
    benchmark_score NUMERIC(3,2), -- Industry average

    -- Improvement Suggestion
    suggestion TEXT,
    suggested_content TEXT, -- AI-suggested replacement
    before_snippet TEXT,
    after_snippet TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'applied', 'dismissed', 'deferred'
    )),
    applied_at TIMESTAMPTZ,
    applied_by UUID,

    -- Metadata
    ai_model TEXT,
    confidence NUMERIC(3,2), -- 0.00 - 1.00
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_insights IS 'AI-generated insights and improvement suggestions';

-- =====================================================
-- Table: synthex_library_scores
-- Aggregated scores for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,

    -- Core Scores (0.00 - 1.00)
    clarity_score NUMERIC(3,2),
    engagement_score NUMERIC(3,2),
    conversion_score NUMERIC(3,2),
    readability_score NUMERIC(3,2),
    brand_alignment_score NUMERIC(3,2),

    -- Overall
    overall_score NUMERIC(3,2),
    grade TEXT CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),

    -- Comparison
    percentile INTEGER, -- 0-100, where template ranks
    industry_benchmark NUMERIC(3,2),

    -- Analysis Details
    word_count INTEGER,
    sentence_count INTEGER,
    avg_sentence_length NUMERIC(5,2),
    flesch_kincaid_grade NUMERIC(4,2),
    variable_count INTEGER,
    cta_count INTEGER,
    personalization_count INTEGER,

    -- Metadata
    ai_model TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',

    UNIQUE(template_id)
);

COMMENT ON TABLE synthex_library_scores IS 'Aggregated quality scores per template';

-- =====================================================
-- Table: synthex_library_predictions
-- Performance predictions for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,

    -- Predicted Metrics
    predicted_open_rate NUMERIC(5,4), -- 0.0000 - 1.0000
    predicted_click_rate NUMERIC(5,4),
    predicted_conversion_rate NUMERIC(5,4),
    predicted_unsubscribe_rate NUMERIC(5,4),
    predicted_engagement_score NUMERIC(3,2),

    -- Confidence
    confidence NUMERIC(3,2),
    confidence_interval_low NUMERIC(5,4),
    confidence_interval_high NUMERIC(5,4),

    -- Based on
    based_on_samples INTEGER, -- Number of similar templates analyzed
    based_on_industry TEXT,
    based_on_type TEXT,

    -- Metadata
    ai_model TEXT,
    predicted_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_predictions IS 'AI-predicted performance metrics';

-- =====================================================
-- Table: synthex_library_ab_tests
-- A/B testing configuration and results
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Test Configuration
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'running', 'paused', 'completed', 'cancelled'
    )),

    -- Variants (references to templates)
    control_template_id UUID NOT NULL REFERENCES synthex_library_templates(id),
    variant_template_id UUID NOT NULL REFERENCES synthex_library_templates(id),

    -- Split Configuration
    split_ratio NUMERIC(3,2) DEFAULT 0.50, -- 50/50 split
    min_sample_size INTEGER DEFAULT 100,
    max_sample_size INTEGER,

    -- Success Metric
    primary_metric TEXT DEFAULT 'click_rate' CHECK (primary_metric IN (
        'open_rate', 'click_rate', 'conversion_rate', 'engagement_score'
    )),
    significance_level NUMERIC(3,2) DEFAULT 0.95,

    -- Results
    winner_template_id UUID REFERENCES synthex_library_templates(id),
    statistical_significance NUMERIC(5,4),
    improvement_percentage NUMERIC(5,2),

    -- Execution Stats
    control_sends INTEGER DEFAULT 0,
    variant_sends INTEGER DEFAULT 0,
    control_conversions INTEGER DEFAULT 0,
    variant_conversions INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_ab_tests IS 'A/B testing for template variants';

-- =====================================================
-- Table: synthex_library_feedback
-- User feedback on templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,

    -- Feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT CHECK (feedback_type IN (
        'quality', 'relevance', 'effectiveness', 'ease_of_use'
    )),
    comment TEXT,

    -- Context
    usage_context TEXT,
    output_id UUID, -- Reference to what was generated

    -- User
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_feedback IS 'User feedback and ratings for templates';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_template_insights_tenant
    ON synthex_library_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_insights_template
    ON synthex_library_insights(template_id);
CREATE INDEX IF NOT EXISTS idx_template_insights_type
    ON synthex_library_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_template_insights_status
    ON synthex_library_insights(status);

CREATE INDEX IF NOT EXISTS idx_template_scores_tenant
    ON synthex_library_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_scores_template
    ON synthex_library_scores(template_id);
CREATE INDEX IF NOT EXISTS idx_template_scores_overall
    ON synthex_library_scores(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_template_predictions_tenant
    ON synthex_library_predictions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_predictions_template
    ON synthex_library_predictions(template_id);

CREATE INDEX IF NOT EXISTS idx_template_ab_tests_tenant
    ON synthex_library_ab_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_status
    ON synthex_library_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_template_feedback_tenant
    ON synthex_library_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_template
    ON synthex_library_feedback(template_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_user
    ON synthex_library_feedback(user_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_feedback ENABLE ROW LEVEL SECURITY;

-- Insights RLS
DROP POLICY IF EXISTS template_insights_tenant_policy ON synthex_library_insights;
CREATE POLICY template_insights_tenant_policy ON synthex_library_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Scores RLS
DROP POLICY IF EXISTS template_scores_tenant_policy ON synthex_library_scores;
CREATE POLICY template_scores_tenant_policy ON synthex_library_scores
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Predictions RLS
DROP POLICY IF EXISTS template_predictions_tenant_policy ON synthex_library_predictions;
CREATE POLICY template_predictions_tenant_policy ON synthex_library_predictions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- A/B Tests RLS
DROP POLICY IF EXISTS template_ab_tests_tenant_policy ON synthex_library_ab_tests;
CREATE POLICY template_ab_tests_tenant_policy ON synthex_library_ab_tests
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Feedback RLS
DROP POLICY IF EXISTS template_feedback_tenant_policy ON synthex_library_feedback;
CREATE POLICY template_feedback_tenant_policy ON synthex_library_feedback
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trigger_ab_tests_updated ON synthex_library_ab_tests;
CREATE TRIGGER trigger_ab_tests_updated
    BEFORE UPDATE ON synthex_library_ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_template_updated_at();

-- =====================================================
-- Function: Calculate template grade from score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_template_grade(score NUMERIC)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN score >= 0.95 THEN 'A+'
        WHEN score >= 0.90 THEN 'A'
        WHEN score >= 0.85 THEN 'B+'
        WHEN score >= 0.80 THEN 'B'
        WHEN score >= 0.75 THEN 'C+'
        WHEN score >= 0.70 THEN 'C'
        WHEN score >= 0.60 THEN 'D'
        ELSE 'F'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
