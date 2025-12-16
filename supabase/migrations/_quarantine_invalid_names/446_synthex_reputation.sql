-- =====================================================
-- Migration 446: Synthex Reputation Intelligence Engine
-- Phase D17: Review Monitoring & Sentiment Analysis
-- =====================================================
-- AI-powered reputation monitoring with sentiment analysis,
-- review aggregation, and response recommendations.
-- =====================================================

-- =====================================================
-- Table: synthex_library_reputation_sources
-- External review sources configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Source Identity
    name TEXT NOT NULL, -- 'Google', 'Yelp', 'TrustPilot', etc.
    source_type TEXT NOT NULL CHECK (source_type IN (
        'google', 'yelp', 'trustpilot', 'facebook', 'tripadvisor',
        'g2', 'capterra', 'glassdoor', 'custom'
    )),
    source_url TEXT,

    -- Connection
    api_key_encrypted TEXT,
    business_id TEXT, -- External business/place ID
    is_connected BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'

    -- Stats
    total_reviews INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2),
    rating_distribution JSONB DEFAULT '{}', -- { "5": 100, "4": 50, ... }

    -- Settings
    auto_respond BOOLEAN DEFAULT false,
    notification_enabled BOOLEAN DEFAULT true,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_reputation_sources IS 'External review source configurations';

-- =====================================================
-- Table: synthex_library_reputation_reviews
-- Individual reviews from all sources
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    source_id UUID REFERENCES synthex_library_reputation_sources(id) ON DELETE SET NULL,

    -- Review Identity
    external_id TEXT, -- ID from the source platform
    source_type TEXT NOT NULL,
    source_url TEXT,

    -- Reviewer
    reviewer_name TEXT,
    reviewer_avatar TEXT,
    reviewer_profile_url TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,

    -- Rating
    rating NUMERIC(3,2), -- 1-5 scale
    rating_max NUMERIC(3,2) DEFAULT 5,
    recommend BOOLEAN,

    -- Content
    title TEXT,
    review_text TEXT NOT NULL,
    language TEXT DEFAULT 'en',

    -- Response
    has_response BOOLEAN DEFAULT false,
    response_text TEXT,
    response_by UUID,
    responded_at TIMESTAMPTZ,

    -- AI Analysis
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score NUMERIC(4,3), -- -1 to 1
    emotions JSONB DEFAULT '[]', -- ['happy', 'frustrated', ...]
    topics JSONB DEFAULT '[]', -- ['service', 'quality', 'price', ...]
    key_phrases TEXT[],
    ai_summary TEXT,
    ai_model TEXT,
    analyzed_at TIMESTAMPTZ,

    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    requires_attention BOOLEAN DEFAULT false,

    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'read', 'responded', 'flagged', 'archived'
    )),

    -- Dates
    review_date TIMESTAMPTZ NOT NULL,
    imported_at TIMESTAMPTZ DEFAULT now(),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, source_type, external_id)
);

COMMENT ON TABLE synthex_library_reputation_reviews IS 'Individual reviews from all sources';

-- =====================================================
-- Table: synthex_library_reputation_responses
-- Response templates and history
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Template or Actual
    is_template BOOLEAN DEFAULT false,
    template_name TEXT,

    -- Target Review (if actual response)
    review_id UUID REFERENCES synthex_library_reputation_reviews(id) ON DELETE SET NULL,

    -- Response Content
    response_text TEXT NOT NULL,

    -- AI Generation
    is_ai_generated BOOLEAN DEFAULT false,
    ai_model TEXT,
    ai_prompt TEXT,
    generation_params JSONB DEFAULT '{}',

    -- Personalization
    variables_used JSONB DEFAULT '{}', -- { "customer_name": "John" }
    tone TEXT, -- 'professional', 'friendly', 'empathetic', etc.

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_approval', 'approved', 'published', 'rejected'
    )),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Performance (for templates)
    usage_count INTEGER DEFAULT 0,
    effectiveness_score NUMERIC(4,2), -- Based on subsequent interactions

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_reputation_responses IS 'Response templates and history';

-- =====================================================
-- Table: synthex_library_reputation_metrics
-- Aggregated reputation metrics over time
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Period
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Source (null = all sources)
    source_id UUID REFERENCES synthex_library_reputation_sources(id) ON DELETE SET NULL,
    source_type TEXT,

    -- Volume
    total_reviews INTEGER DEFAULT 0,
    new_reviews INTEGER DEFAULT 0,
    responded_reviews INTEGER DEFAULT 0,

    -- Ratings
    average_rating NUMERIC(3,2),
    rating_distribution JSONB DEFAULT '{}',
    rating_trend NUMERIC, -- Change from previous period

    -- Sentiment
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    average_sentiment NUMERIC(4,3),
    sentiment_trend NUMERIC,

    -- Response
    response_rate NUMERIC(5,2), -- Percentage
    avg_response_time_hours NUMERIC,

    -- Topics (top mentioned)
    top_topics JSONB DEFAULT '[]',
    top_positive_topics JSONB DEFAULT '[]',
    top_negative_topics JSONB DEFAULT '[]',

    -- AI Insights
    ai_summary TEXT,
    ai_recommendations TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_reputation_metrics IS 'Aggregated reputation metrics';

-- =====================================================
-- Table: synthex_library_reputation_alerts
-- Reputation alerts and notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Alert Type
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'negative_review', 'rating_drop', 'volume_spike', 'keyword_mention',
        'competitor_mention', 'response_overdue', 'sentiment_shift'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Related
    review_id UUID REFERENCES synthex_library_reputation_reviews(id),
    source_id UUID REFERENCES synthex_library_reputation_sources(id),

    -- Metrics
    metric_name TEXT,
    metric_value NUMERIC,
    threshold_value NUMERIC,

    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'acknowledged', 'resolved', 'dismissed'
    )),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,

    -- Notifications
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[] DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_reputation_alerts IS 'Reputation alerts and notifications';

-- =====================================================
-- Table: synthex_library_reputation_competitors
-- Competitor reputation tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reputation_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Competitor Info
    name TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,

    -- Sources
    google_place_id TEXT,
    yelp_id TEXT,
    trustpilot_id TEXT,
    other_sources JSONB DEFAULT '{}',

    -- Current Metrics
    average_rating NUMERIC(3,2),
    total_reviews INTEGER,
    sentiment_score NUMERIC(4,3),
    last_updated TIMESTAMPTZ,

    -- Comparison
    rating_difference NUMERIC, -- vs our rating
    review_velocity NUMERIC, -- Reviews per month
    sentiment_comparison NUMERIC,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_reputation_competitors IS 'Competitor reputation tracking';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reputation_sources_tenant
    ON synthex_library_reputation_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_sources_type
    ON synthex_library_reputation_sources(source_type);

CREATE INDEX IF NOT EXISTS idx_reputation_reviews_tenant
    ON synthex_library_reputation_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_source
    ON synthex_library_reputation_reviews(source_id);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_sentiment
    ON synthex_library_reputation_reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_rating
    ON synthex_library_reputation_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_date
    ON synthex_library_reputation_reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_status
    ON synthex_library_reputation_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reputation_reviews_priority
    ON synthex_library_reputation_reviews(priority) WHERE requires_attention = true;

CREATE INDEX IF NOT EXISTS idx_reputation_responses_tenant
    ON synthex_library_reputation_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_responses_review
    ON synthex_library_reputation_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_reputation_responses_template
    ON synthex_library_reputation_responses(tenant_id, is_template) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_reputation_metrics_tenant
    ON synthex_library_reputation_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_metrics_period
    ON synthex_library_reputation_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_reputation_alerts_tenant
    ON synthex_library_reputation_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reputation_alerts_status
    ON synthex_library_reputation_alerts(status);

CREATE INDEX IF NOT EXISTS idx_reputation_competitors_tenant
    ON synthex_library_reputation_competitors(tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_reputation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reputation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reputation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reputation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reputation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reputation_competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY reputation_sources_tenant_policy ON synthex_library_reputation_sources
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY reputation_reviews_tenant_policy ON synthex_library_reputation_reviews
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY reputation_responses_tenant_policy ON synthex_library_reputation_responses
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY reputation_metrics_tenant_policy ON synthex_library_reputation_metrics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY reputation_alerts_tenant_policy ON synthex_library_reputation_alerts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY reputation_competitors_tenant_policy ON synthex_library_reputation_competitors
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_reputation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reputation_sources_updated ON synthex_library_reputation_sources;
CREATE TRIGGER trigger_reputation_sources_updated
    BEFORE UPDATE ON synthex_library_reputation_sources
    FOR EACH ROW EXECUTE FUNCTION update_reputation_timestamp();

DROP TRIGGER IF EXISTS trigger_reputation_reviews_updated ON synthex_library_reputation_reviews;
CREATE TRIGGER trigger_reputation_reviews_updated
    BEFORE UPDATE ON synthex_library_reputation_reviews
    FOR EACH ROW EXECUTE FUNCTION update_reputation_timestamp();

DROP TRIGGER IF EXISTS trigger_reputation_competitors_updated ON synthex_library_reputation_competitors;
CREATE TRIGGER trigger_reputation_competitors_updated
    BEFORE UPDATE ON synthex_library_reputation_competitors
    FOR EACH ROW EXECUTE FUNCTION update_reputation_timestamp();

-- =====================================================
-- Function: Update source stats after review insert
-- =====================================================
CREATE OR REPLACE FUNCTION update_source_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE synthex_library_reputation_sources
    SET
        total_reviews = (
            SELECT COUNT(*) FROM synthex_library_reputation_reviews
            WHERE source_id = NEW.source_id
        ),
        average_rating = (
            SELECT AVG(rating) FROM synthex_library_reputation_reviews
            WHERE source_id = NEW.source_id AND rating IS NOT NULL
        ),
        rating_distribution = (
            SELECT jsonb_object_agg(rating::text, cnt)
            FROM (
                SELECT FLOOR(rating)::int as rating, COUNT(*) as cnt
                FROM synthex_library_reputation_reviews
                WHERE source_id = NEW.source_id AND rating IS NOT NULL
                GROUP BY FLOOR(rating)
            ) sub
        ),
        updated_at = now()
    WHERE id = NEW.source_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_source_stats ON synthex_library_reputation_reviews;
CREATE TRIGGER trigger_update_source_stats
    AFTER INSERT ON synthex_library_reputation_reviews
    FOR EACH ROW
    WHEN (NEW.source_id IS NOT NULL)
    EXECUTE FUNCTION update_source_review_stats();

-- =====================================================
-- Function: Calculate reputation health score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_reputation_health(
    p_avg_rating NUMERIC,
    p_review_count INTEGER,
    p_sentiment_score NUMERIC,
    p_response_rate NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC;
BEGIN
    -- Weighted scoring:
    -- Rating: 40% (normalized to 100)
    -- Review count: 15% (log scale, max 100 reviews)
    -- Sentiment: 30% (normalized from -1..1 to 0..100)
    -- Response rate: 15%

    v_score := 0;

    -- Rating (40% weight, 5-point scale)
    v_score := v_score + (COALESCE(p_avg_rating, 3) / 5.0) * 40;

    -- Review count (15% weight, log scale capped at 100)
    v_score := v_score + LEAST(LN(GREATEST(p_review_count, 1) + 1) / LN(101), 1) * 15;

    -- Sentiment (30% weight, -1 to 1 normalized)
    v_score := v_score + ((COALESCE(p_sentiment_score, 0) + 1) / 2.0) * 30;

    -- Response rate (15% weight)
    v_score := v_score + (COALESCE(p_response_rate, 0) / 100.0) * 15;

    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
