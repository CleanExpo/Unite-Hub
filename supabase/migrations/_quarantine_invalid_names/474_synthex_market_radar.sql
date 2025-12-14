/**
 * Synthex Market Radar Migration
 *
 * Phase: D45 - Market Radar (Signals, Competitors, and Pivot Engine)
 *
 * Tables:
 * - synthex_mkt_signals: Market signals and trends
 * - synthex_mkt_competitors: Competitor profiles
 * - synthex_mkt_recommendations: AI-generated market recommendations
 * - synthex_mkt_pivots: Business pivot tracking
 * - synthex_mkt_news: Industry news monitoring
 *
 * Prefix: synthex_mkt_*
 */

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Signal types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_mkt_signal_type') THEN
    CREATE TYPE synthex_mkt_signal_type AS ENUM (
      'trend',
      'opportunity',
      'threat',
      'regulation',
      'technology',
      'competitor',
      'market_shift',
      'consumer_behavior',
      'economic',
      'news'
    );
  END IF;
END $$;

-- Signal source types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_mkt_source_type') THEN
    CREATE TYPE synthex_mkt_source_type AS ENUM (
      'web_scrape',
      'api',
      'social_media',
      'news_feed',
      'industry_report',
      'customer_feedback',
      'internal_data',
      'ai_generated',
      'manual'
    );
  END IF;
END $$;

-- Signal direction
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_mkt_direction') THEN
    CREATE TYPE synthex_mkt_direction AS ENUM (
      'bullish',
      'bearish',
      'neutral',
      'volatile'
    );
  END IF;
END $$;

-- Recommendation priority
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_mkt_priority') THEN
    CREATE TYPE synthex_mkt_priority AS ENUM (
      'critical',
      'high',
      'medium',
      'low',
      'informational'
    );
  END IF;
END $$;

-- Recommendation status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_mkt_rec_status') THEN
    CREATE TYPE synthex_mkt_rec_status AS ENUM (
      'open',
      'in_progress',
      'completed',
      'dismissed',
      'deferred'
    );
  END IF;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Market Signals
CREATE TABLE IF NOT EXISTS synthex_mkt_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  source_type synthex_mkt_source_type NOT NULL DEFAULT 'ai_generated',
  source_ref text, -- URL or reference ID

  signal_type synthex_mkt_signal_type NOT NULL DEFAULT 'trend',
  title text NOT NULL,
  summary text,
  full_content text,

  strength numeric(5,2) DEFAULT 50, -- 0-100 signal strength
  confidence numeric(5,2) DEFAULT 50, -- 0-100 confidence score
  direction synthex_mkt_direction DEFAULT 'neutral',

  impact_score numeric(5,2), -- 0-100 potential business impact
  urgency_score numeric(5,2), -- 0-100 urgency level

  related_industries text[] DEFAULT '{}',
  related_keywords text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',

  expires_at timestamptz,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,

  raw_payload jsonb DEFAULT '{}',
  ai_analysis jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Competitor Profiles
CREATE TABLE IF NOT EXISTS synthex_mkt_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  name text NOT NULL,
  website_url text,
  logo_url text,
  description text,

  region text,
  headquarters text,
  employee_count text, -- 'small', 'medium', 'large', 'enterprise'
  founded_year integer,

  positioning text,
  value_proposition text,
  target_market text,

  strengths jsonb DEFAULT '[]', -- Array of strengths
  weaknesses jsonb DEFAULT '[]', -- Array of weaknesses
  opportunities jsonb DEFAULT '[]', -- SWOT opportunities
  threats jsonb DEFAULT '[]', -- SWOT threats

  pricing_model text,
  pricing_tier text, -- 'low', 'mid', 'premium', 'enterprise'

  products jsonb DEFAULT '[]', -- Array of product offerings
  features jsonb DEFAULT '[]', -- Key features
  differentiators jsonb DEFAULT '[]', -- What makes them different

  social_presence jsonb DEFAULT '{}', -- { twitter: url, linkedin: url, etc }
  traffic_estimate numeric(12,0), -- Monthly traffic estimate
  domain_authority numeric(5,2),

  threat_level numeric(5,2) DEFAULT 50, -- 0-100 competitive threat
  watch_priority synthex_mkt_priority DEFAULT 'medium',

  last_analyzed_at timestamptz,
  ai_summary jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Market Recommendations
CREATE TABLE IF NOT EXISTS synthex_mkt_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  category text NOT NULL, -- 'positioning', 'pricing', 'product', 'marketing', 'operations', 'pivot'
  subcategory text,

  priority synthex_mkt_priority NOT NULL DEFAULT 'medium',
  status synthex_mkt_rec_status NOT NULL DEFAULT 'open',

  title text NOT NULL,
  recommendation text NOT NULL,
  detailed_analysis text,

  expected_impact text,
  estimated_effort text, -- 'low', 'medium', 'high'
  time_horizon text, -- 'immediate', 'short_term', 'medium_term', 'long_term'

  supporting_signals uuid[] DEFAULT '{}', -- References to signals
  related_competitors uuid[] DEFAULT '{}', -- References to competitors

  ai_rationale jsonb DEFAULT '{}',
  implementation_steps jsonb DEFAULT '[]',
  success_metrics jsonb DEFAULT '[]',

  assigned_to uuid,
  due_date date,

  started_at timestamptz,
  completed_at timestamptz,
  dismissed_at timestamptz,
  dismissal_reason text,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Business Pivots (strategic direction changes)
CREATE TABLE IF NOT EXISTS synthex_mkt_pivots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  pivot_name text NOT NULL,
  pivot_type text NOT NULL, -- 'market', 'product', 'pricing', 'channel', 'technology', 'business_model'

  from_state text NOT NULL,
  to_state text NOT NULL,

  rationale text,
  expected_outcomes jsonb DEFAULT '[]',
  risks jsonb DEFAULT '[]',
  success_criteria jsonb DEFAULT '[]',

  status text DEFAULT 'proposed', -- 'proposed', 'approved', 'in_progress', 'completed', 'abandoned'

  proposed_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  started_at timestamptz,
  completed_at timestamptz,

  outcome_summary text,
  lessons_learned jsonb DEFAULT '[]',

  ai_analysis jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Industry News Monitoring
CREATE TABLE IF NOT EXISTS synthex_mkt_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  source_name text NOT NULL,
  source_url text,
  article_url text NOT NULL,

  title text NOT NULL,
  summary text,
  full_content text,
  author text,

  published_at timestamptz,
  discovered_at timestamptz DEFAULT now(),

  categories text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  mentioned_companies text[] DEFAULT '{}',

  sentiment numeric(5,2), -- -100 to 100
  relevance_score numeric(5,2), -- 0-100

  is_read boolean DEFAULT false,
  is_bookmarked boolean DEFAULT false,
  is_archived boolean DEFAULT false,

  ai_summary text,
  ai_analysis jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_signals_tenant_business
  ON synthex_mkt_signals (tenant_id, business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_signals_type
  ON synthex_mkt_signals (tenant_id, signal_type, strength DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_competitors_tenant_business
  ON synthex_mkt_competitors (tenant_id, business_id, name);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_competitors_threat
  ON synthex_mkt_competitors (tenant_id, threat_level DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_recommendations_tenant_status
  ON synthex_mkt_recommendations (tenant_id, business_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_pivots_tenant_business
  ON synthex_mkt_pivots (tenant_id, business_id, status);

CREATE INDEX IF NOT EXISTS idx_synthex_mkt_news_tenant_published
  ON synthex_mkt_news (tenant_id, published_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE synthex_mkt_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_mkt_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_mkt_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_mkt_pivots ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_mkt_news ENABLE ROW LEVEL SECURITY;

-- Signals policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_mkt_signals_tenant_isolation') THEN
    CREATE POLICY synthex_mkt_signals_tenant_isolation ON synthex_mkt_signals
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Competitors policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_mkt_competitors_tenant_isolation') THEN
    CREATE POLICY synthex_mkt_competitors_tenant_isolation ON synthex_mkt_competitors
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Recommendations policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_mkt_recommendations_tenant_isolation') THEN
    CREATE POLICY synthex_mkt_recommendations_tenant_isolation ON synthex_mkt_recommendations
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Pivots policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_mkt_pivots_tenant_isolation') THEN
    CREATE POLICY synthex_mkt_pivots_tenant_isolation ON synthex_mkt_pivots
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- News policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_mkt_news_tenant_isolation') THEN
    CREATE POLICY synthex_mkt_news_tenant_isolation ON synthex_mkt_news
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE OR REPLACE FUNCTION synthex_mkt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_mkt_competitors_updated_at ON synthex_mkt_competitors;
CREATE TRIGGER trg_synthex_mkt_competitors_updated_at
  BEFORE UPDATE ON synthex_mkt_competitors
  FOR EACH ROW
  EXECUTE FUNCTION synthex_mkt_updated_at();

DROP TRIGGER IF EXISTS trg_synthex_mkt_recommendations_updated_at ON synthex_mkt_recommendations;
CREATE TRIGGER trg_synthex_mkt_recommendations_updated_at
  BEFORE UPDATE ON synthex_mkt_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION synthex_mkt_updated_at();

DROP TRIGGER IF EXISTS trg_synthex_mkt_pivots_updated_at ON synthex_mkt_pivots;
CREATE TRIGGER trg_synthex_mkt_pivots_updated_at
  BEFORE UPDATE ON synthex_mkt_pivots
  FOR EACH ROW
  EXECUTE FUNCTION synthex_mkt_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE synthex_mkt_signals IS 'Market signals and trend monitoring (D45)';
COMMENT ON TABLE synthex_mkt_competitors IS 'Competitor profiles and analysis (D45)';
COMMENT ON TABLE synthex_mkt_recommendations IS 'AI-generated market recommendations (D45)';
COMMENT ON TABLE synthex_mkt_pivots IS 'Business pivot tracking (D45)';
COMMENT ON TABLE synthex_mkt_news IS 'Industry news monitoring (D45)';
