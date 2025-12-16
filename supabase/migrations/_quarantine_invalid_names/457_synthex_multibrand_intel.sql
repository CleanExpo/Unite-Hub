-- =====================================================
-- Migration 457: Synthex Multi-Brand Cross-Domain Intelligence
-- Phase D28: Multi-Brand Cross-Domain Intelligence Engine
-- =====================================================
-- AI-powered cross-brand analytics, insights sharing, and
-- strategic recommendations across brand portfolios.
-- Note: Uses 'crossbrand' prefix to avoid conflict with D11 tables
-- =====================================================

-- =====================================================
-- Table: synthex_library_crossbrand_profiles
-- Extended brand profiles for cross-domain intelligence
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Link to existing brand (optional)
    brand_profile_id UUID,
    -- References synthex_library_brand_profiles.id from D11

    -- Brand Identity
    brand_name TEXT NOT NULL,
    brand_slug TEXT,
    brand_description TEXT,

    -- Classification
    industry TEXT,
    sub_industry TEXT,
    market_segment TEXT,
    -- 'b2b', 'b2c', 'b2b2c', 'enterprise', 'smb', 'consumer'

    -- Voice & Tone
    tone TEXT,
    -- 'professional', 'casual', 'friendly', 'authoritative', 'playful'
    voice_guidelines JSONB DEFAULT '{}',

    -- Target Audience
    target_demographics JSONB DEFAULT '{}',

    -- Competitive Landscape
    competitors JSONB DEFAULT '[]',
    market_position TEXT,
    -- 'leader', 'challenger', 'niche', 'follower'

    -- Performance Baselines
    baseline_metrics JSONB DEFAULT '{}',

    -- Cross-Brand Settings
    allow_insight_sharing BOOLEAN DEFAULT TRUE,
    insight_sharing_scope TEXT DEFAULT 'portfolio',
    -- 'private', 'portfolio', 'network'

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_crossbrand_domains
-- Domain/website associations for cross-brand analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    crossbrand_id UUID NOT NULL REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE CASCADE,

    -- Domain Info
    domain_name TEXT NOT NULL,
    domain_type TEXT DEFAULT 'primary',
    -- 'primary', 'secondary', 'landing', 'subdomain', 'microsites'

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method TEXT,
    verified_at TIMESTAMPTZ,

    -- Analytics
    analytics_connected BOOLEAN DEFAULT FALSE,
    analytics_provider TEXT,
    analytics_config JSONB DEFAULT '{}',

    -- Performance
    monthly_traffic INTEGER,
    bounce_rate NUMERIC,
    avg_session_duration INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_crossbrand_insights
-- AI-generated cross-brand insights
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Brand References
    source_crossbrand_id UUID NOT NULL REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE CASCADE,
    target_crossbrand_id UUID REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE SET NULL,
    -- NULL target means insight is brand-specific, not cross-brand

    -- Insight Classification
    insight_type TEXT NOT NULL,
    -- 'audience_overlap', 'competitive_gap', 'synergy_opportunity',
    -- 'cannibalization_risk', 'cross_sell', 'market_trend', 'brand_health'
    insight_category TEXT,
    -- 'growth', 'risk', 'optimization', 'competitive', 'market'

    -- Scoring
    score NUMERIC DEFAULT 0 CHECK (score >= 0 AND score <= 1),
    confidence NUMERIC DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
    impact_score NUMERIC DEFAULT 0.5,
    urgency_score NUMERIC DEFAULT 0.5,

    -- AI Analysis
    reasoning JSONB DEFAULT '{}',
    -- {
    --   factors: [{ name: 'audience_similarity', weight: 0.4, value: 0.8 }],
    --   data_sources: ['analytics', 'surveys', 'social'],
    --   model_version: 'v1'
    -- }

    -- Recommendation
    recommendation TEXT,
    recommended_actions JSONB DEFAULT '[]',
    -- [
    --   { action: 'launch_cross_campaign', priority: 1, estimated_impact: 0.15 },
    --   { action: 'adjust_messaging', priority: 2, details: 'Differentiate tone' }
    -- ]

    -- Supporting Data
    supporting_data JSONB DEFAULT '{}',
    -- {
    --   audience_overlap_percent: 0.35,
    --   shared_keywords: ['productivity', 'efficiency'],
    --   competitive_keywords: ['enterprise', 'scalable']
    -- }

    -- Status
    status TEXT DEFAULT 'active',
    -- 'active', 'acted_upon', 'dismissed', 'expired', 'validated'
    acted_upon_at TIMESTAMPTZ,
    outcome TEXT,

    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Metadata
    model_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_crossbrand_synergies
-- Cross-brand synergy tracking and optimization
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Brand Pair
    crossbrand_a_id UUID NOT NULL REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE CASCADE,
    crossbrand_b_id UUID NOT NULL REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE CASCADE,

    -- Synergy Metrics
    synergy_score NUMERIC DEFAULT 0 CHECK (synergy_score >= 0 AND synergy_score <= 1),
    audience_overlap NUMERIC DEFAULT 0,
    messaging_alignment NUMERIC DEFAULT 0,
    channel_overlap NUMERIC DEFAULT 0,
    timing_alignment NUMERIC DEFAULT 0,

    -- Opportunity Analysis
    cross_sell_potential NUMERIC DEFAULT 0,
    bundle_opportunity_score NUMERIC DEFAULT 0,
    shared_campaign_fit NUMERIC DEFAULT 0,

    -- Risk Analysis
    cannibalization_risk NUMERIC DEFAULT 0,
    brand_dilution_risk NUMERIC DEFAULT 0,
    audience_fatigue_risk NUMERIC DEFAULT 0,

    -- AI Recommendations
    ai_recommendation TEXT,
    ai_reasoning JSONB DEFAULT '{}',
    ai_confidence NUMERIC DEFAULT 0.7,

    -- Collaboration History
    total_shared_campaigns INTEGER DEFAULT 0,
    successful_collaborations INTEGER DEFAULT 0,
    last_collaboration_at TIMESTAMPTZ,

    -- Status
    relationship_status TEXT DEFAULT 'potential',
    -- 'potential', 'exploring', 'active', 'paused', 'discontinued'

    -- Metadata
    last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique brand pairs
    UNIQUE (crossbrand_a_id, crossbrand_b_id)
);

-- =====================================================
-- Table: synthex_library_crossbrand_campaigns
-- Cross-brand campaign tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Campaign Info
    campaign_name TEXT NOT NULL,
    campaign_description TEXT,
    campaign_type TEXT DEFAULT 'cross_brand',
    -- 'cross_brand', 'brand_specific', 'portfolio_wide'

    -- Brand Participation
    participating_crossbrands UUID[] NOT NULL,
    lead_crossbrand_id UUID REFERENCES synthex_library_crossbrand_profiles(id),

    -- Goals
    primary_goal TEXT,
    -- 'awareness', 'consideration', 'conversion', 'retention', 'cross_sell'
    target_metrics JSONB DEFAULT '{}',
    -- {
    --   target_reach: 100000,
    --   target_conversions: 500,
    --   target_roi: 3.0
    -- }

    -- Budget & Resources
    total_budget NUMERIC,
    budget_allocation JSONB DEFAULT '{}',
    -- { 'brand_a_id': 5000, 'brand_b_id': 3000 }

    -- Channels
    channels TEXT[] DEFAULT '{}',
    channel_strategy JSONB DEFAULT '{}',

    -- Performance
    actual_reach INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_revenue NUMERIC DEFAULT 0,
    actual_roi NUMERIC,
    brand_performance JSONB DEFAULT '{}',
    -- { 'brand_a_id': { conversions: 250, revenue: 5000 } }

    -- Timing
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'draft',
    -- 'draft', 'planned', 'active', 'paused', 'completed', 'cancelled'

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: synthex_library_crossbrand_metrics
-- Aggregated brand performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_crossbrand_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    crossbrand_id UUID NOT NULL REFERENCES synthex_library_crossbrand_profiles(id) ON DELETE CASCADE,

    -- Time Period
    period_type TEXT NOT NULL,
    -- 'daily', 'weekly', 'monthly', 'quarterly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Traffic Metrics
    total_visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    avg_session_duration INTEGER,
    bounce_rate NUMERIC,

    -- Conversion Metrics
    total_conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    total_revenue NUMERIC DEFAULT 0,
    avg_order_value NUMERIC,

    -- Engagement Metrics
    email_subscribers INTEGER DEFAULT 0,
    social_followers INTEGER DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,

    -- Brand Health
    brand_awareness_score NUMERIC,
    brand_sentiment_score NUMERIC,
    nps_score NUMERIC,

    -- Cross-Brand Metrics
    cross_brand_conversions INTEGER DEFAULT 0,
    cross_brand_revenue NUMERIC DEFAULT 0,
    audience_shared_percent NUMERIC,

    -- AI Analysis
    ai_health_score NUMERIC,
    ai_growth_potential NUMERIC,
    ai_insights JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_crossbrand_profiles_tenant ON synthex_library_crossbrand_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_profiles_industry ON synthex_library_crossbrand_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_crossbrand_profiles_active ON synthex_library_crossbrand_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_crossbrand_profiles_slug ON synthex_library_crossbrand_profiles(brand_slug);

CREATE INDEX IF NOT EXISTS idx_crossbrand_domains_tenant ON synthex_library_crossbrand_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_domains_crossbrand ON synthex_library_crossbrand_domains(crossbrand_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_domains_domain ON synthex_library_crossbrand_domains(domain_name);

CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_tenant ON synthex_library_crossbrand_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_source ON synthex_library_crossbrand_insights(source_crossbrand_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_target ON synthex_library_crossbrand_insights(target_crossbrand_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_type ON synthex_library_crossbrand_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_status ON synthex_library_crossbrand_insights(status);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_score ON synthex_library_crossbrand_insights(score DESC);
CREATE INDEX IF NOT EXISTS idx_crossbrand_insights_created ON synthex_library_crossbrand_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crossbrand_synergies_tenant ON synthex_library_crossbrand_synergies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_synergies_brands ON synthex_library_crossbrand_synergies(crossbrand_a_id, crossbrand_b_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_synergies_score ON synthex_library_crossbrand_synergies(synergy_score DESC);

CREATE INDEX IF NOT EXISTS idx_crossbrand_campaigns_tenant ON synthex_library_crossbrand_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_campaigns_status ON synthex_library_crossbrand_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_crossbrand_campaigns_lead ON synthex_library_crossbrand_campaigns(lead_crossbrand_id);

CREATE INDEX IF NOT EXISTS idx_crossbrand_metrics_tenant ON synthex_library_crossbrand_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_metrics_crossbrand ON synthex_library_crossbrand_metrics(crossbrand_id);
CREATE INDEX IF NOT EXISTS idx_crossbrand_metrics_period ON synthex_library_crossbrand_metrics(period_type, period_start DESC);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_crossbrand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_crossbrand_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_crossbrand_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_crossbrand_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_crossbrand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_crossbrand_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crossbrand_profiles_tenant_isolation" ON synthex_library_crossbrand_profiles
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "crossbrand_domains_tenant_isolation" ON synthex_library_crossbrand_domains
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "crossbrand_insights_tenant_isolation" ON synthex_library_crossbrand_insights
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "crossbrand_synergies_tenant_isolation" ON synthex_library_crossbrand_synergies
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "crossbrand_campaigns_tenant_isolation" ON synthex_library_crossbrand_campaigns
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "crossbrand_metrics_tenant_isolation" ON synthex_library_crossbrand_metrics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function to calculate crossbrand synergy score
CREATE OR REPLACE FUNCTION calculate_crossbrand_synergy(
    p_crossbrand_a_id UUID,
    p_crossbrand_b_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_brand_a RECORD;
    v_brand_b RECORD;
    v_audience_overlap NUMERIC := 0;
    v_industry_match NUMERIC := 0;
    v_tone_match NUMERIC := 0;
    v_synergy_score NUMERIC;
BEGIN
    SELECT * INTO v_brand_a FROM synthex_library_crossbrand_profiles WHERE id = p_crossbrand_a_id;
    SELECT * INTO v_brand_b FROM synthex_library_crossbrand_profiles WHERE id = p_crossbrand_b_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Industry match (same industry = higher synergy potential)
    IF v_brand_a.industry = v_brand_b.industry THEN
        v_industry_match := 0.8;
    ELSIF v_brand_a.sub_industry = v_brand_b.sub_industry THEN
        v_industry_match := 0.5;
    ELSE
        v_industry_match := 0.2;
    END IF;

    -- Tone match
    IF v_brand_a.tone = v_brand_b.tone THEN
        v_tone_match := 0.9;
    ELSE
        v_tone_match := 0.4;
    END IF;

    -- Calculate weighted synergy score
    v_synergy_score := (v_industry_match * 0.4) + (v_tone_match * 0.3) + 0.3;

    RETURN LEAST(v_synergy_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to get crossbrand portfolio health
CREATE OR REPLACE FUNCTION get_crossbrand_portfolio_health(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_brands INTEGER;
    v_active_brands INTEGER;
    v_avg_synergy NUMERIC;
    v_total_insights INTEGER;
    v_actionable_insights INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE is_active = TRUE)
    INTO v_total_brands, v_active_brands
    FROM synthex_library_crossbrand_profiles
    WHERE tenant_id = p_tenant_id;

    SELECT COALESCE(AVG(synergy_score), 0)
    INTO v_avg_synergy
    FROM synthex_library_crossbrand_synergies
    WHERE tenant_id = p_tenant_id;

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active' AND score >= 0.7)
    INTO v_total_insights, v_actionable_insights
    FROM synthex_library_crossbrand_insights
    WHERE tenant_id = p_tenant_id;

    RETURN jsonb_build_object(
        'total_brands', v_total_brands,
        'active_brands', v_active_brands,
        'avg_synergy_score', ROUND(v_avg_synergy, 3),
        'total_insights', v_total_insights,
        'actionable_insights', v_actionable_insights,
        'portfolio_health_score', ROUND(
            CASE
                WHEN v_total_brands = 0 THEN 0
                ELSE (v_active_brands::numeric / v_total_brands * 0.3) +
                     (v_avg_synergy * 0.4) +
                     (CASE WHEN v_total_insights > 0 THEN v_actionable_insights::numeric / v_total_insights * 0.3 ELSE 0.15 END)
            END, 3
        )
    );
END;
$$ LANGUAGE plpgsql;
