-- Migration 427: Synthex Reputation & Reviews Engine
-- Phase B21: Review Management and Reputation Monitoring
-- Created: 2025-12-06

-- =====================================================
-- SYNTHEX REVIEWS TABLE
-- Stores reviews from Google, Facebook, Yelp, etc.
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Source information
    source text NOT NULL CHECK (source IN ('google', 'facebook', 'yelp', 'trustpilot', 'custom')),
    source_id text, -- External review ID
    profile_name text, -- Business profile name

    -- Review details
    author_name text NOT NULL,
    author_email text,
    author_avatar_url text,
    rating numeric(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    title text,
    body text NOT NULL,

    -- Response
    response text,
    response_author text,
    responded_at timestamptz,

    -- Review metadata
    external_url text,
    is_verified boolean DEFAULT false,
    is_flagged boolean DEFAULT false,
    flag_reason text,

    -- Timestamps
    created_at timestamptz NOT NULL, -- When review was posted on platform
    ingested_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Additional metadata
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Unique constraint to prevent duplicate ingestion
    UNIQUE(tenant_id, source, source_id)
);

-- Add indexes for performance
DROP INDEX IF EXISTS idx_synthex_reviews_tenant_id;
DROP INDEX IF EXISTS idx_synthex_reviews_source;
DROP INDEX IF EXISTS idx_synthex_reviews_rating;
DROP INDEX IF EXISTS idx_synthex_reviews_created_at;
DROP INDEX IF EXISTS idx_synthex_reviews_tenant_created;
DROP INDEX IF EXISTS idx_synthex_reviews_is_responded;
CREATE INDEX idx_synthex_reviews_tenant_id ON synthex_reviews(tenant_id);
CREATE INDEX idx_synthex_reviews_source ON synthex_reviews(source);
CREATE INDEX idx_synthex_reviews_rating ON synthex_reviews(rating);
CREATE INDEX idx_synthex_reviews_created_at ON synthex_reviews(created_at DESC);
CREATE INDEX idx_synthex_reviews_tenant_created ON synthex_reviews(tenant_id, created_at DESC);
CREATE INDEX idx_synthex_reviews_is_responded ON synthex_reviews(tenant_id, responded_at) WHERE responded_at IS NULL;

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_reviews_updated_at ON synthex_reviews;
drop trigger if exists set_synthex_reviews_updated_at on synthex_reviews;
CREATE TRIGGER set_synthex_reviews_updated_at 
    BEFORE UPDATE ON synthex_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX REPUTATION SUMMARY TABLE
-- Aggregated reputation metrics per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_reputation_summary (
    tenant_id uuid PRIMARY KEY REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Overall metrics
    avg_rating numeric(3,2) NOT NULL DEFAULT 0,
    total_reviews integer NOT NULL DEFAULT 0,

    -- Time-based counts
    review_count_30d integer NOT NULL DEFAULT 0,
    review_count_90d integer NOT NULL DEFAULT 0,
    review_count_365d integer NOT NULL DEFAULT 0,

    -- Rating distribution
    rating_distribution jsonb DEFAULT '{
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0
    }'::jsonb,

    -- Response metrics
    response_rate numeric(5,2) DEFAULT 0, -- Percentage 0-100
    avg_response_time_hours numeric(10,2), -- Average hours to respond

    -- Trend analysis
    trend_score numeric(5,2), -- -100 to 100, negative = declining, positive = improving
    trend_direction text CHECK (trend_direction IN ('improving', 'declining', 'stable')),

    -- Sentiment breakdown (from AI analysis)
    sentiment_breakdown jsonb DEFAULT '{
        "positive": 0,
        "neutral": 0,
        "negative": 0
    }'::jsonb,

    -- Source breakdown
    source_counts jsonb DEFAULT '{
        "google": 0,
        "facebook": 0,
        "yelp": 0,
        "trustpilot": 0,
        "custom": 0
    }'::jsonb,

    -- Last sync info
    last_sync_at timestamptz,
    next_sync_at timestamptz,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_reputation_summary_updated_at ON synthex_reputation_summary;
drop trigger if exists set_synthex_reputation_summary_updated_at on synthex_reputation_summary;
CREATE TRIGGER set_synthex_reputation_summary_updated_at 
    BEFORE UPDATE ON synthex_reputation_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX REVIEW INSIGHTS TABLE
-- AI-generated insights from review analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_review_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    review_id uuid NOT NULL REFERENCES synthex_reviews(id) ON DELETE CASCADE,

    -- AI Analysis
    summary text,
    sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score numeric(5,4) CHECK (sentiment_score >= -1 AND sentiment_score <= 1), -- -1 to 1

    -- Topics and themes
    topics jsonb DEFAULT '[]'::jsonb, -- Array of topic strings
    keywords text[] DEFAULT '{}',
    entities jsonb DEFAULT '{}'::jsonb, -- Named entities

    -- Priority and urgency
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    urgency_score numeric(5,2) DEFAULT 0, -- 0-100
    requires_response boolean DEFAULT false,

    -- Action items
    action_items jsonb DEFAULT '[]'::jsonb, -- Array of {description, type, priority}
    suggested_response text,

    -- Risk flags
    risk_flags jsonb DEFAULT '[]'::jsonb, -- Array of {type, description, severity}
    is_escalated boolean DEFAULT false,
    escalation_reason text,

    -- Model info
    model_version text DEFAULT 'claude-sonnet-4-5-20250514',
    confidence_score numeric(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),

    -- One insight per review
    UNIQUE(review_id)
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_review_insights_tenant_id;
DROP INDEX IF EXISTS idx_synthex_review_insights_review_id;
DROP INDEX IF EXISTS idx_synthex_review_insights_sentiment;
DROP INDEX IF EXISTS idx_synthex_review_insights_priority;
DROP INDEX IF EXISTS idx_synthex_review_insights_requires_response;
CREATE INDEX idx_synthex_review_insights_tenant_id ON synthex_review_insights(tenant_id);
CREATE INDEX idx_synthex_review_insights_review_id ON synthex_review_insights(review_id);
CREATE INDEX idx_synthex_review_insights_sentiment ON synthex_review_insights(sentiment);
CREATE INDEX idx_synthex_review_insights_priority ON synthex_review_insights(priority);
CREATE INDEX idx_synthex_review_insights_requires_response ON synthex_review_insights(tenant_id, requires_response) WHERE requires_response = true;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE synthex_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_reputation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_review_insights ENABLE ROW LEVEL SECURITY;

-- Reviews policies
DROP POLICY IF EXISTS "synthex_reviews_select" ON synthex_reviews;
drop policy if exists "synthex_reviews_select" on synthex_reviews;
CREATE POLICY "synthex_reviews_select" ON synthex_reviews FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reviews_insert" ON synthex_reviews;
drop policy if exists "synthex_reviews_insert" on synthex_reviews;
CREATE POLICY "synthex_reviews_insert" ON synthex_reviews FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reviews_update" ON synthex_reviews;
drop policy if exists "synthex_reviews_update" on synthex_reviews;
CREATE POLICY "synthex_reviews_update" ON synthex_reviews FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reviews_delete" ON synthex_reviews;
drop policy if exists "synthex_reviews_delete" on synthex_reviews;
CREATE POLICY "synthex_reviews_delete" ON synthex_reviews FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Reputation summary policies
DROP POLICY IF EXISTS "synthex_reputation_summary_select" ON synthex_reputation_summary;
drop policy if exists "synthex_reputation_summary_select" on synthex_reputation_summary;
CREATE POLICY "synthex_reputation_summary_select" ON synthex_reputation_summary FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reputation_summary_insert" ON synthex_reputation_summary;
drop policy if exists "synthex_reputation_summary_insert" on synthex_reputation_summary;
CREATE POLICY "synthex_reputation_summary_insert" ON synthex_reputation_summary FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reputation_summary_update" ON synthex_reputation_summary;
drop policy if exists "synthex_reputation_summary_update" on synthex_reputation_summary;
CREATE POLICY "synthex_reputation_summary_update" ON synthex_reputation_summary FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_reputation_summary_delete" ON synthex_reputation_summary;
drop policy if exists "synthex_reputation_summary_delete" on synthex_reputation_summary;
CREATE POLICY "synthex_reputation_summary_delete" ON synthex_reputation_summary FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Review insights policies
DROP POLICY IF EXISTS "synthex_review_insights_select" ON synthex_review_insights;
drop policy if exists "synthex_review_insights_select" on synthex_review_insights;
CREATE POLICY "synthex_review_insights_select" ON synthex_review_insights FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_review_insights_insert" ON synthex_review_insights;
drop policy if exists "synthex_review_insights_insert" on synthex_review_insights;
CREATE POLICY "synthex_review_insights_insert" ON synthex_review_insights FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_review_insights_update" ON synthex_review_insights;
drop policy if exists "synthex_review_insights_update" on synthex_review_insights;
CREATE POLICY "synthex_review_insights_update" ON synthex_review_insights FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_review_insights_delete" ON synthex_review_insights;
drop policy if exists "synthex_review_insights_delete" on synthex_review_insights;
CREATE POLICY "synthex_review_insights_delete" ON synthex_review_insights FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update reputation summary after review changes
CREATE OR REPLACE FUNCTION update_reputation_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update the reputation summary
    INSERT INTO synthex_reputation_summary (
        tenant_id,
        avg_rating,
        total_reviews,
        review_count_30d,
        review_count_90d,
        review_count_365d,
        rating_distribution,
        response_rate
    )
    SELECT
        tenant_id,
        ROUND(AVG(rating)::numeric, 2) as avg_rating,
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as review_count_30d,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '90 days') as review_count_90d,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '365 days') as review_count_365d,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating >= 4.5),
            '4', COUNT(*) FILTER (WHERE rating >= 3.5 AND rating < 4.5),
            '3', COUNT(*) FILTER (WHERE rating >= 2.5 AND rating < 3.5),
            '2', COUNT(*) FILTER (WHERE rating >= 1.5 AND rating < 2.5),
            '1', COUNT(*) FILTER (WHERE rating < 1.5)
        ) as rating_distribution,
        ROUND((COUNT(*) FILTER (WHERE response IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as response_rate
    FROM synthex_reviews
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    GROUP BY tenant_id
    ON CONFLICT (tenant_id)
    DO UPDATE SET
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        review_count_30d = EXCLUDED.review_count_30d,
        review_count_90d = EXCLUDED.review_count_90d,
        review_count_365d = EXCLUDED.review_count_365d,
        rating_distribution = EXCLUDED.rating_distribution,
        response_rate = EXCLUDED.response_rate,
        updated_at = now();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update summary on review insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_reputation_summary ON synthex_reviews;
drop trigger if exists trigger_update_reputation_summary on synthex_reviews;
CREATE TRIGGER trigger_update_reputation_summary 
    AFTER INSERT OR UPDATE OR DELETE ON synthex_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reputation_summary();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_reviews IS 'Customer reviews from various platforms (Google, Facebook, Yelp, etc.)';
COMMENT ON TABLE synthex_reputation_summary IS 'Aggregated reputation metrics and trends per tenant';
COMMENT ON TABLE synthex_review_insights IS 'AI-generated insights and analysis from reviews';
