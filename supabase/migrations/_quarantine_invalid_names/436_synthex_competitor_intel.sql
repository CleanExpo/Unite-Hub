-- Migration 436: Synthex Competitor Intelligence & Market Radar
-- Phase B30: AI-Powered Competitive Analysis and SERP Monitoring
-- Created: 2025-12-07

-- =====================================================
-- SYNTHEX COMPETITOR PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_competitor_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Competitor identification
    domain text NOT NULL,
    company_name text,
    logo_url text,

    -- Classification
    competitor_type text DEFAULT 'direct' CHECK (competitor_type IN ('direct', 'indirect', 'aspirational', 'emerging')),
    priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

    -- SEO metrics (updated periodically)
    domain_authority integer,
    monthly_traffic_estimate bigint,
    keyword_count integer DEFAULT 0,
    backlink_count integer DEFAULT 0,

    -- Risk assessment
    threat_level text DEFAULT 'moderate' CHECK (threat_level IN ('critical', 'high', 'moderate', 'low', 'minimal')),
    threat_score numeric(5,2) DEFAULT 50 CHECK (threat_score >= 0 AND threat_score <= 100),

    -- Monitoring settings
    is_active boolean DEFAULT true,
    monitor_keywords boolean DEFAULT true,
    monitor_backlinks boolean DEFAULT false,
    monitor_content boolean DEFAULT true,

    -- Last analysis
    last_analyzed_at timestamptz,
    analysis_frequency text DEFAULT 'weekly' CHECK (analysis_frequency IN ('daily', 'weekly', 'monthly')),

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- One profile per domain per tenant
    UNIQUE(tenant_id, domain)
);

-- Indexes for competitor profiles
DROP INDEX IF EXISTS idx_synthex_competitor_profiles_tenant;
CREATE INDEX idx_synthex_competitor_profiles_tenant ON synthex_competitor_profiles(tenant_id);
DROP INDEX IF EXISTS idx_synthex_competitor_profiles_domain;
CREATE INDEX idx_synthex_competitor_profiles_domain ON synthex_competitor_profiles(domain);
DROP INDEX IF EXISTS idx_synthex_competitor_profiles_priority;
CREATE INDEX idx_synthex_competitor_profiles_priority ON synthex_competitor_profiles(tenant_id, priority);
DROP INDEX IF EXISTS idx_synthex_competitor_profiles_threat;
CREATE INDEX idx_synthex_competitor_profiles_threat ON synthex_competitor_profiles(tenant_id, threat_level);
DROP INDEX IF EXISTS idx_synthex_competitor_profiles_active;
CREATE INDEX idx_synthex_competitor_profiles_active ON synthex_competitor_profiles(tenant_id, is_active) WHERE is_active = true;

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_competitor_profiles_updated_at ON synthex_competitor_profiles;
CREATE TRIGGER set_synthex_competitor_profiles_updated_at
    BEFORE UPDATE ON synthex_competitor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_competitor_profiles IS 'Competitor tracking profiles with SEO metrics and threat assessment';

-- =====================================================
-- SYNTHEX COMPETITOR KEYWORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_competitor_keywords (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    competitor_id uuid NOT NULL REFERENCES synthex_competitor_profiles(id) ON DELETE CASCADE,

    -- Keyword data
    keyword text NOT NULL,
    search_volume integer DEFAULT 0,
    keyword_difficulty numeric(5,2),
    cpc_estimate numeric(10,2),

    -- Ranking data
    current_position integer,
    previous_position integer,
    position_change integer GENERATED ALWAYS AS (previous_position - current_position) STORED,
    best_position integer,

    -- Page data
    ranking_url text,
    page_type text, -- 'homepage', 'blog', 'product', 'category', 'landing'

    -- Overlap tracking
    is_shared_keyword boolean DEFAULT false, -- Also targeted by tenant
    tenant_position integer, -- Tenant's position for this keyword
    gap_score numeric(5,2), -- Opportunity score if competitor ranks but tenant doesn't

    -- Timestamps
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),

    -- Track unique keywords per competitor
    UNIQUE(competitor_id, keyword)
);

-- Indexes for competitor keywords
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_tenant;
CREATE INDEX idx_synthex_competitor_keywords_tenant ON synthex_competitor_keywords(tenant_id);
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_competitor;
CREATE INDEX idx_synthex_competitor_keywords_competitor ON synthex_competitor_keywords(competitor_id);
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_keyword;
CREATE INDEX idx_synthex_competitor_keywords_keyword ON synthex_competitor_keywords(keyword);
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_position;
CREATE INDEX idx_synthex_competitor_keywords_position ON synthex_competitor_keywords(competitor_id, current_position);
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_shared;
CREATE INDEX idx_synthex_competitor_keywords_shared ON synthex_competitor_keywords(tenant_id, is_shared_keyword) WHERE is_shared_keyword = true;
DROP INDEX IF EXISTS idx_synthex_competitor_keywords_gap;
CREATE INDEX idx_synthex_competitor_keywords_gap ON synthex_competitor_keywords(tenant_id, gap_score DESC NULLS LAST);

COMMENT ON TABLE synthex_competitor_keywords IS 'Keywords that competitors rank for with position tracking';
COMMENT ON COLUMN synthex_competitor_keywords.gap_score IS 'Opportunity score: high = competitor ranks well, tenant does not';

-- =====================================================
-- SYNTHEX COMPETITOR SERP TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_competitor_serp (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    competitor_id uuid NOT NULL REFERENCES synthex_competitor_profiles(id) ON DELETE CASCADE,

    -- SERP snapshot
    keyword text NOT NULL,
    search_engine text DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo')),
    location text DEFAULT 'us',
    device text DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),

    -- Position data
    position integer NOT NULL,
    url text NOT NULL,
    title text,
    description text,

    -- SERP features
    has_featured_snippet boolean DEFAULT false,
    has_local_pack boolean DEFAULT false,
    has_knowledge_panel boolean DEFAULT false,
    has_video_carousel boolean DEFAULT false,
    serp_features jsonb DEFAULT '[]'::jsonb,

    -- Snapshot timestamp
    captured_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for competitor SERP
DROP INDEX IF EXISTS idx_synthex_competitor_serp_tenant;
CREATE INDEX idx_synthex_competitor_serp_tenant ON synthex_competitor_serp(tenant_id);
DROP INDEX IF EXISTS idx_synthex_competitor_serp_competitor;
CREATE INDEX idx_synthex_competitor_serp_competitor ON synthex_competitor_serp(competitor_id);
DROP INDEX IF EXISTS idx_synthex_competitor_serp_keyword;
CREATE INDEX idx_synthex_competitor_serp_keyword ON synthex_competitor_serp(keyword);
DROP INDEX IF EXISTS idx_synthex_competitor_serp_captured;
CREATE INDEX idx_synthex_competitor_serp_captured ON synthex_competitor_serp(captured_at DESC);
DROP INDEX IF EXISTS idx_synthex_competitor_serp_position;
CREATE INDEX idx_synthex_competitor_serp_position ON synthex_competitor_serp(competitor_id, keyword, captured_at DESC);

COMMENT ON TABLE synthex_competitor_serp IS 'SERP snapshots tracking competitor rankings over time';

-- =====================================================
-- SYNTHEX COMPETITOR ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_competitor_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    competitor_id uuid REFERENCES synthex_competitor_profiles(id) ON DELETE SET NULL,

    -- Alert classification
    alert_type text NOT NULL CHECK (alert_type IN (
        'new_keyword', 'lost_keyword', 'ranking_spike', 'ranking_drop',
        'new_content', 'backlink_change', 'threat_increase', 'opportunity'
    )),
    severity text DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),

    -- Alert content
    title text NOT NULL,
    description text,

    -- Related data
    keyword text,
    old_value text,
    new_value text,
    change_magnitude numeric(10,2),

    -- Recommendations
    ai_recommendation text,
    action_items jsonb DEFAULT '[]'::jsonb,

    -- Status
    status text DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by uuid REFERENCES auth.users(id),
    acknowledged_at timestamptz,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for competitor alerts
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_tenant;
CREATE INDEX idx_synthex_competitor_alerts_tenant ON synthex_competitor_alerts(tenant_id);
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_competitor;
CREATE INDEX idx_synthex_competitor_alerts_competitor ON synthex_competitor_alerts(competitor_id);
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_type;
CREATE INDEX idx_synthex_competitor_alerts_type ON synthex_competitor_alerts(tenant_id, alert_type);
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_severity;
CREATE INDEX idx_synthex_competitor_alerts_severity ON synthex_competitor_alerts(tenant_id, severity);
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_status;
CREATE INDEX idx_synthex_competitor_alerts_status ON synthex_competitor_alerts(tenant_id, status) WHERE status IN ('new', 'acknowledged');
DROP INDEX IF EXISTS idx_synthex_competitor_alerts_created;
CREATE INDEX idx_synthex_competitor_alerts_created ON synthex_competitor_alerts(tenant_id, created_at DESC);

COMMENT ON TABLE synthex_competitor_alerts IS 'Automated alerts for competitor movements and opportunities';

-- =====================================================
-- SYNTHEX COMPETITOR REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_competitor_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    competitor_id uuid REFERENCES synthex_competitor_profiles(id) ON DELETE SET NULL,

    -- Report type
    report_type text NOT NULL CHECK (report_type IN ('single', 'comparison', 'market', 'gap_analysis', 'forecast')),
    title text NOT NULL,

    -- Report content (AI-generated)
    executive_summary text,
    key_findings jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    metrics_snapshot jsonb DEFAULT '{}'::jsonb,

    -- Full report content
    full_report text,

    -- Generation metadata
    model_version text DEFAULT 'claude-sonnet-4-5-20250514',
    tokens_used integer,

    -- Timestamps
    generated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz
);

-- Indexes for competitor reports
DROP INDEX IF EXISTS idx_synthex_competitor_reports_tenant;
CREATE INDEX idx_synthex_competitor_reports_tenant ON synthex_competitor_reports(tenant_id);
DROP INDEX IF EXISTS idx_synthex_competitor_reports_competitor;
CREATE INDEX idx_synthex_competitor_reports_competitor ON synthex_competitor_reports(competitor_id);
DROP INDEX IF EXISTS idx_synthex_competitor_reports_type;
CREATE INDEX idx_synthex_competitor_reports_type ON synthex_competitor_reports(tenant_id, report_type);
DROP INDEX IF EXISTS idx_synthex_competitor_reports_generated;
CREATE INDEX idx_synthex_competitor_reports_generated ON synthex_competitor_reports(tenant_id, generated_at DESC);

COMMENT ON TABLE synthex_competitor_reports IS 'AI-generated competitive analysis reports';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Competitor Profiles RLS
ALTER TABLE synthex_competitor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_competitor_profiles_select" ON synthex_competitor_profiles;
CREATE POLICY "synthex_competitor_profiles_select" ON synthex_competitor_profiles FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_profiles_insert" ON synthex_competitor_profiles;
CREATE POLICY "synthex_competitor_profiles_insert" ON synthex_competitor_profiles FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_profiles_update" ON synthex_competitor_profiles;
CREATE POLICY "synthex_competitor_profiles_update" ON synthex_competitor_profiles FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_profiles_delete" ON synthex_competitor_profiles;
CREATE POLICY "synthex_competitor_profiles_delete" ON synthex_competitor_profiles FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Competitor Keywords RLS
ALTER TABLE synthex_competitor_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_competitor_keywords_select" ON synthex_competitor_keywords;
CREATE POLICY "synthex_competitor_keywords_select" ON synthex_competitor_keywords FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_keywords_insert" ON synthex_competitor_keywords;
CREATE POLICY "synthex_competitor_keywords_insert" ON synthex_competitor_keywords FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_keywords_update" ON synthex_competitor_keywords;
CREATE POLICY "synthex_competitor_keywords_update" ON synthex_competitor_keywords FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_keywords_delete" ON synthex_competitor_keywords;
CREATE POLICY "synthex_competitor_keywords_delete" ON synthex_competitor_keywords FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Competitor SERP RLS
ALTER TABLE synthex_competitor_serp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_competitor_serp_select" ON synthex_competitor_serp;
CREATE POLICY "synthex_competitor_serp_select" ON synthex_competitor_serp FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_serp_insert" ON synthex_competitor_serp;
CREATE POLICY "synthex_competitor_serp_insert" ON synthex_competitor_serp FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_serp_delete" ON synthex_competitor_serp;
CREATE POLICY "synthex_competitor_serp_delete" ON synthex_competitor_serp FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Competitor Alerts RLS
ALTER TABLE synthex_competitor_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_competitor_alerts_select" ON synthex_competitor_alerts;
CREATE POLICY "synthex_competitor_alerts_select" ON synthex_competitor_alerts FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_alerts_insert" ON synthex_competitor_alerts;
CREATE POLICY "synthex_competitor_alerts_insert" ON synthex_competitor_alerts FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_alerts_update" ON synthex_competitor_alerts;
CREATE POLICY "synthex_competitor_alerts_update" ON synthex_competitor_alerts FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_alerts_delete" ON synthex_competitor_alerts;
CREATE POLICY "synthex_competitor_alerts_delete" ON synthex_competitor_alerts FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Competitor Reports RLS
ALTER TABLE synthex_competitor_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_competitor_reports_select" ON synthex_competitor_reports;
CREATE POLICY "synthex_competitor_reports_select" ON synthex_competitor_reports FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_reports_insert" ON synthex_competitor_reports;
CREATE POLICY "synthex_competitor_reports_insert" ON synthex_competitor_reports FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_competitor_reports_delete" ON synthex_competitor_reports;
CREATE POLICY "synthex_competitor_reports_delete" ON synthex_competitor_reports FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_competitor_profiles IS 'Competitor tracking with SEO metrics and threat assessment';
COMMENT ON TABLE synthex_competitor_keywords IS 'Keyword rankings and gap analysis for competitors';
COMMENT ON TABLE synthex_competitor_serp IS 'SERP position history for competitive tracking';
COMMENT ON TABLE synthex_competitor_alerts IS 'Automated competitive intelligence alerts';
COMMENT ON TABLE synthex_competitor_reports IS 'AI-generated competitive analysis reports';
