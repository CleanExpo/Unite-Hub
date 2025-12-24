-- =====================================================
-- Migration: 464_synthex_attribution_v3.sql
-- Phase: D35 - Attribution Engine v3 (Cross-Channel + Multi-Touch LTV)
-- Description: Cross-channel attribution paths, multi-touch models, LTV calculation
-- =====================================================

-- =====================================================
-- DEPENDENCY CHECK: Create synthex_tenants if missing
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENUMS (with safe creation)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_attr_v3_model') THEN
    CREATE TYPE synthex_attr_v3_model AS ENUM (
      'first_touch',
      'last_touch',
      'linear',
      'time_decay',
      'position_based',
      'data_driven',
      'custom',
      'ai_optimized'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_attr_v3_touchpoint') THEN
    CREATE TYPE synthex_attr_v3_touchpoint AS ENUM (
      'impression',
      'click',
      'view',
      'engagement',
      'form_submit',
      'email_open',
      'email_click',
      'call',
      'chat',
      'meeting',
      'demo',
      'trial_start',
      'purchase',
      'referral',
      'organic_search',
      'paid_search',
      'social_organic',
      'social_paid',
      'direct',
      'affiliate',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_attr_v3_conversion') THEN
    CREATE TYPE synthex_attr_v3_conversion AS ENUM (
      'lead',
      'mql',
      'sql',
      'opportunity',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
      'expansion',
      'renewal',
      'churn',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_attr_v3_status') THEN
    CREATE TYPE synthex_attr_v3_status AS ENUM (
      'pending',
      'processing',
      'attributed',
      'validated',
      'adjusted',
      'archived'
    );
  END IF;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Attribution touchpoints - individual customer interactions
CREATE TABLE IF NOT EXISTS synthex_attr_v3_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Identity linkage (optional - no FK to avoid dependency issues)
  unified_profile_id UUID,
  identity_node_id UUID,
  anonymous_id TEXT,

  -- Touchpoint details
  tp_type synthex_attr_v3_touchpoint NOT NULL,
  touchpoint_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Channel info
  channel TEXT NOT NULL,
  sub_channel TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_id TEXT,
  creative_id TEXT,
  keyword TEXT,

  -- Source tracking
  source TEXT,
  medium TEXT,
  content TEXT,
  term TEXT,
  referrer_url TEXT,
  landing_page TEXT,

  -- Engagement metrics
  session_id TEXT,
  page_views INTEGER DEFAULT 0,
  time_on_site INTEGER DEFAULT 0,
  scroll_depth NUMERIC(5, 2),
  engagement_score NUMERIC(5, 2) DEFAULT 0,

  -- Device & location
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  region TEXT,
  city TEXT,

  -- Cost data
  cost NUMERIC(12, 4) DEFAULT 0,
  cost_currency TEXT DEFAULT 'AUD',

  -- Additional attributes
  attributes JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution conversions - conversion events
CREATE TABLE IF NOT EXISTS synthex_attr_v3_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Identity linkage (optional)
  unified_profile_id UUID,
  identity_node_id UUID,

  -- Conversion details
  conv_type synthex_attr_v3_conversion NOT NULL,
  conversion_name TEXT,
  conversion_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Value
  conversion_value NUMERIC(14, 4) DEFAULT 0,
  conversion_currency TEXT DEFAULT 'AUD',
  quantity INTEGER DEFAULT 1,

  -- Related entities
  opportunity_id TEXT,
  deal_id TEXT,
  order_id TEXT,
  subscription_id TEXT,

  -- Product info
  product_ids TEXT[],
  product_categories TEXT[],

  -- Attribution window
  lookback_window_days INTEGER DEFAULT 30,
  attribution_window_start TIMESTAMPTZ,
  attribution_window_end TIMESTAMPTZ,

  -- Status
  conv_status synthex_attr_v3_status DEFAULT 'pending',

  -- Additional data
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution paths - customer journeys leading to conversion
CREATE TABLE IF NOT EXISTS synthex_attr_v3_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Links
  conversion_id UUID NOT NULL REFERENCES synthex_attr_v3_conversions(id) ON DELETE CASCADE,
  unified_profile_id UUID,

  -- Path details
  path_name TEXT,
  path_description TEXT,

  -- Path metrics
  path_length INTEGER DEFAULT 0,
  time_to_conversion_hours NUMERIC(10, 2),
  unique_channels INTEGER DEFAULT 0,
  unique_touchpoints INTEGER DEFAULT 0,

  -- Path sequence (ordered touchpoint IDs)
  touchpoint_sequence UUID[] DEFAULT '{}',
  channel_sequence TEXT[] DEFAULT '{}',

  -- Path analysis
  first_touchpoint_id UUID,
  last_touchpoint_id UUID,

  -- Cost aggregation
  total_cost NUMERIC(14, 4) DEFAULT 0,

  -- AI insights
  ai_path_analysis JSONB DEFAULT '{}'::JSONB,
  path_pattern_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution credits - credit allocation per touchpoint
CREATE TABLE IF NOT EXISTS synthex_attr_v3_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Links
  path_id UUID NOT NULL REFERENCES synthex_attr_v3_paths(id) ON DELETE CASCADE,
  touchpoint_id UUID NOT NULL REFERENCES synthex_attr_v3_touchpoints(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL REFERENCES synthex_attr_v3_conversions(id) ON DELETE CASCADE,

  -- Model used
  attr_model synthex_attr_v3_model NOT NULL,
  model_version TEXT DEFAULT 'v3.0',

  -- Credit allocation
  credit_percentage NUMERIC(7, 4) NOT NULL CHECK (credit_percentage >= 0 AND credit_percentage <= 100),
  credit_value NUMERIC(14, 4) DEFAULT 0,
  credit_currency TEXT DEFAULT 'AUD',

  -- Position in path
  position_in_path INTEGER NOT NULL,
  is_first_touch BOOLEAN DEFAULT FALSE,
  is_last_touch BOOLEAN DEFAULT FALSE,
  is_conversion_touch BOOLEAN DEFAULT FALSE,

  -- Time factors
  days_before_conversion NUMERIC(10, 2),
  time_decay_factor NUMERIC(7, 4) DEFAULT 1.0,

  -- AI adjustments
  ai_weight_adjustment NUMERIC(7, 4) DEFAULT 0,
  ai_reasoning TEXT,

  -- Confidence
  confidence_score NUMERIC(5, 4) DEFAULT 0.5,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution models configuration
CREATE TABLE IF NOT EXISTS synthex_attr_v3_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Model details
  model_name TEXT NOT NULL,
  model_description TEXT,
  model_type synthex_attr_v3_model NOT NULL,

  -- Configuration
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Model parameters
  lookback_window_days INTEGER DEFAULT 30,
  time_decay_half_life_days NUMERIC(5, 2) DEFAULT 7,
  position_weights JSONB DEFAULT '{"first": 0.4, "middle": 0.2, "last": 0.4}'::JSONB,
  channel_weights JSONB DEFAULT '{}'::JSONB,
  touchpoint_weights JSONB DEFAULT '{}'::JSONB,

  -- Custom model config
  custom_rules JSONB DEFAULT '[]'::JSONB,

  -- AI model parameters
  ai_model_id TEXT,
  ai_training_date TIMESTAMPTZ,
  ai_accuracy_score NUMERIC(5, 4),
  ai_model_params JSONB DEFAULT '{}'::JSONB,

  -- Audit
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LTV calculations
CREATE TABLE IF NOT EXISTS synthex_attr_v3_ltv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Profile link (no FK to avoid dependency)
  unified_profile_id UUID NOT NULL,

  -- LTV metrics
  total_revenue NUMERIC(14, 4) DEFAULT 0,
  total_cost NUMERIC(14, 4) DEFAULT 0,
  gross_margin NUMERIC(14, 4) DEFAULT 0,
  currency TEXT DEFAULT 'AUD',

  -- Time-based LTV
  ltv_30_days NUMERIC(14, 4) DEFAULT 0,
  ltv_90_days NUMERIC(14, 4) DEFAULT 0,
  ltv_365_days NUMERIC(14, 4) DEFAULT 0,
  ltv_lifetime NUMERIC(14, 4) DEFAULT 0,

  -- Predicted LTV
  predicted_ltv_1yr NUMERIC(14, 4),
  predicted_ltv_3yr NUMERIC(14, 4),
  predicted_ltv_lifetime NUMERIC(14, 4),
  prediction_confidence NUMERIC(5, 4),
  prediction_model_version TEXT,

  -- Customer metrics
  first_purchase_date TIMESTAMPTZ,
  last_purchase_date TIMESTAMPTZ,
  purchase_count INTEGER DEFAULT 0,
  avg_order_value NUMERIC(12, 4),
  purchase_frequency_days NUMERIC(10, 2),

  -- Retention
  months_active INTEGER DEFAULT 0,
  churn_probability NUMERIC(5, 4),
  retention_score NUMERIC(5, 4),

  -- Acquisition
  acquisition_channel TEXT,
  acquisition_cost NUMERIC(12, 4) DEFAULT 0,
  cac_ltv_ratio NUMERIC(8, 4),
  payback_period_days INTEGER,

  -- Cohort
  cohort_month TEXT,
  cohort_segment TEXT,

  -- AI insights
  ai_ltv_factors JSONB DEFAULT '{}'::JSONB,
  ai_recommendations JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, unified_profile_id)
);

-- Channel performance aggregates
CREATE TABLE IF NOT EXISTS synthex_attr_v3_channel_perf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'daily',

  -- Channel
  channel TEXT NOT NULL,
  sub_channel TEXT,

  -- Attribution model used
  attr_model synthex_attr_v3_model NOT NULL,

  -- Volume metrics
  touchpoint_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,

  -- Attribution metrics
  attributed_revenue NUMERIC(14, 4) DEFAULT 0,
  attributed_conversions NUMERIC(10, 2) DEFAULT 0,

  -- Cost metrics
  total_cost NUMERIC(14, 4) DEFAULT 0,

  -- Calculated metrics
  roas NUMERIC(10, 4),
  cpa NUMERIC(12, 4),
  conversion_rate NUMERIC(7, 4),
  avg_time_to_conversion_hours NUMERIC(10, 2),

  -- Comparison
  revenue_change_pct NUMERIC(7, 2),
  conversion_change_pct NUMERIC(7, 2),

  -- AI insights
  channel_effectiveness_score NUMERIC(5, 4),
  ai_channel_insights JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index for channel performance (allows COALESCE expression)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attr_v3_channel_perf_unique
  ON synthex_attr_v3_channel_perf(tenant_id, period_start, period_end, period_type, channel, COALESCE(sub_channel, ''), attr_model);

-- Path patterns (common conversion paths)
CREATE TABLE IF NOT EXISTS synthex_attr_v3_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Pattern definition
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  channel_sequence TEXT[] NOT NULL,

  -- Metrics
  occurrence_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_revenue NUMERIC(14, 4) DEFAULT 0,
  avg_conversion_value NUMERIC(12, 4),
  conversion_rate NUMERIC(7, 4),
  avg_path_length INTEGER,
  avg_time_to_conversion_hours NUMERIC(10, 2),

  -- Effectiveness
  effectiveness_score NUMERIC(5, 4),

  -- AI analysis
  ai_pattern_insights JSONB DEFAULT '{}'::JSONB,
  recommended_optimizations JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution reports
CREATE TABLE IF NOT EXISTS synthex_attr_v3_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Report details
  report_name TEXT NOT NULL,
  report_description TEXT,
  report_type TEXT DEFAULT 'standard',

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Configuration
  attribution_models TEXT[] DEFAULT '{}',
  channels TEXT[],
  conversion_types TEXT[],

  -- Report data
  summary_metrics JSONB DEFAULT '{}'::JSONB,
  channel_breakdown JSONB DEFAULT '[]'::JSONB,
  model_comparison JSONB DEFAULT '[]'::JSONB,
  top_paths JSONB DEFAULT '[]'::JSONB,

  -- AI insights
  ai_executive_summary TEXT,
  ai_key_findings JSONB DEFAULT '[]'::JSONB,
  ai_recommendations JSONB DEFAULT '[]'::JSONB,

  -- Audit
  created_by UUID,

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_tenant ON synthex_attr_v3_touchpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_profile ON synthex_attr_v3_touchpoints(unified_profile_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_timestamp ON synthex_attr_v3_touchpoints(touchpoint_timestamp);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_channel ON synthex_attr_v3_touchpoints(channel);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_campaign ON synthex_attr_v3_touchpoints(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_session ON synthex_attr_v3_touchpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_tp_anon ON synthex_attr_v3_touchpoints(anonymous_id);

CREATE INDEX IF NOT EXISTS idx_attr_v3_conv_tenant ON synthex_attr_v3_conversions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_conv_profile ON synthex_attr_v3_conversions(unified_profile_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_conv_timestamp ON synthex_attr_v3_conversions(conversion_timestamp);
CREATE INDEX IF NOT EXISTS idx_attr_v3_conv_type ON synthex_attr_v3_conversions(conv_type);
CREATE INDEX IF NOT EXISTS idx_attr_v3_conv_status ON synthex_attr_v3_conversions(conv_status);

CREATE INDEX IF NOT EXISTS idx_attr_v3_path_tenant ON synthex_attr_v3_paths(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_path_conv ON synthex_attr_v3_paths(conversion_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_path_profile ON synthex_attr_v3_paths(unified_profile_id);

CREATE INDEX IF NOT EXISTS idx_attr_v3_credit_tenant ON synthex_attr_v3_credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_credit_path ON synthex_attr_v3_credits(path_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_credit_tp ON synthex_attr_v3_credits(touchpoint_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_credit_conv ON synthex_attr_v3_credits(conversion_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_credit_model ON synthex_attr_v3_credits(attr_model);

CREATE INDEX IF NOT EXISTS idx_attr_v3_ltv_tenant ON synthex_attr_v3_ltv(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_ltv_profile ON synthex_attr_v3_ltv(unified_profile_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_ltv_cohort ON synthex_attr_v3_ltv(cohort_month);

CREATE INDEX IF NOT EXISTS idx_attr_v3_ch_perf_tenant ON synthex_attr_v3_channel_perf(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_ch_perf_period ON synthex_attr_v3_channel_perf(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_attr_v3_ch_perf_channel ON synthex_attr_v3_channel_perf(channel);

CREATE INDEX IF NOT EXISTS idx_attr_v3_patterns_tenant ON synthex_attr_v3_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attr_v3_patterns_effect ON synthex_attr_v3_patterns(effectiveness_score DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_attr_v3_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_ltv ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_channel_perf ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_attr_v3_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies then create
DROP POLICY IF EXISTS "attr_v3_touchpoints_tenant" ON synthex_attr_v3_touchpoints;
CREATE POLICY "attr_v3_touchpoints_tenant" ON synthex_attr_v3_touchpoints
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_conversions_tenant" ON synthex_attr_v3_conversions;
CREATE POLICY "attr_v3_conversions_tenant" ON synthex_attr_v3_conversions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_paths_tenant" ON synthex_attr_v3_paths;
CREATE POLICY "attr_v3_paths_tenant" ON synthex_attr_v3_paths
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_credits_tenant" ON synthex_attr_v3_credits;
CREATE POLICY "attr_v3_credits_tenant" ON synthex_attr_v3_credits
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_models_tenant" ON synthex_attr_v3_models;
CREATE POLICY "attr_v3_models_tenant" ON synthex_attr_v3_models
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_ltv_tenant" ON synthex_attr_v3_ltv;
CREATE POLICY "attr_v3_ltv_tenant" ON synthex_attr_v3_ltv
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_channel_perf_tenant" ON synthex_attr_v3_channel_perf;
CREATE POLICY "attr_v3_channel_perf_tenant" ON synthex_attr_v3_channel_perf
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_patterns_tenant" ON synthex_attr_v3_patterns;
CREATE POLICY "attr_v3_patterns_tenant" ON synthex_attr_v3_patterns
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "attr_v3_reports_tenant" ON synthex_attr_v3_reports;
CREATE POLICY "attr_v3_reports_tenant" ON synthex_attr_v3_reports
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get attribution stats
CREATE OR REPLACE FUNCTION get_attr_v3_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_touchpoints', (SELECT COUNT(*) FROM synthex_attr_v3_touchpoints WHERE tenant_id = p_tenant_id),
    'total_conversions', (SELECT COUNT(*) FROM synthex_attr_v3_conversions WHERE tenant_id = p_tenant_id),
    'total_paths', (SELECT COUNT(*) FROM synthex_attr_v3_paths WHERE tenant_id = p_tenant_id),
    'total_revenue', (SELECT COALESCE(SUM(conversion_value), 0) FROM synthex_attr_v3_conversions WHERE tenant_id = p_tenant_id),
    'avg_path_length', (SELECT COALESCE(AVG(path_length), 0) FROM synthex_attr_v3_paths WHERE tenant_id = p_tenant_id),
    'avg_time_to_conversion', (SELECT COALESCE(AVG(time_to_conversion_hours), 0) FROM synthex_attr_v3_paths WHERE tenant_id = p_tenant_id),
    'touchpoints_by_channel', (
      SELECT COALESCE(jsonb_object_agg(channel, cnt), '{}'::JSONB)
      FROM (
        SELECT channel, COUNT(*) as cnt
        FROM synthex_attr_v3_touchpoints
        WHERE tenant_id = p_tenant_id
        GROUP BY channel
      ) sub
    ),
    'conversions_by_type', (
      SELECT COALESCE(jsonb_object_agg(conv_type::TEXT, cnt), '{}'::JSONB)
      FROM (
        SELECT conv_type, COUNT(*) as cnt
        FROM synthex_attr_v3_conversions
        WHERE tenant_id = p_tenant_id
        GROUP BY conv_type
      ) sub
    ),
    'total_ltv_profiles', (SELECT COUNT(*) FROM synthex_attr_v3_ltv WHERE tenant_id = p_tenant_id),
    'avg_ltv', (SELECT COALESCE(AVG(ltv_lifetime), 0) FROM synthex_attr_v3_ltv WHERE tenant_id = p_tenant_id),
    'total_acquisition_cost', (SELECT COALESCE(SUM(acquisition_cost), 0) FROM synthex_attr_v3_ltv WHERE tenant_id = p_tenant_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate attribution credits for a conversion
CREATE OR REPLACE FUNCTION calculate_attr_v3_credits(
  p_path_id UUID,
  p_model_type synthex_attr_v3_model DEFAULT 'linear'
)
RETURNS TABLE (
  credit_id UUID,
  touchpoint_id UUID,
  credit_percentage NUMERIC,
  credit_value NUMERIC,
  position_in_path INTEGER
) AS $$
DECLARE
  v_path RECORD;
  v_tp_id UUID;
  v_position INTEGER := 0;
  v_path_length INTEGER;
  v_credit_pct NUMERIC(7, 4);
  v_conversion_value NUMERIC(14, 4);
  v_new_id UUID;
BEGIN
  -- Get path info
  SELECT
    ap.*,
    ac.conversion_value,
    ac.conversion_timestamp
  INTO v_path
  FROM synthex_attr_v3_paths ap
  JOIN synthex_attr_v3_conversions ac ON ap.conversion_id = ac.id
  WHERE ap.id = p_path_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_path_length := COALESCE(array_length(v_path.touchpoint_sequence, 1), 0);
  v_conversion_value := COALESCE(v_path.conversion_value, 0);

  IF v_path_length = 0 THEN
    RETURN;
  END IF;

  -- Calculate credits based on model
  FOREACH v_tp_id IN ARRAY v_path.touchpoint_sequence
  LOOP
    v_position := v_position + 1;

    -- Calculate credit percentage based on model
    CASE p_model_type
      WHEN 'first_touch' THEN
        v_credit_pct := CASE WHEN v_position = 1 THEN 100 ELSE 0 END;
      WHEN 'last_touch' THEN
        v_credit_pct := CASE WHEN v_position = v_path_length THEN 100 ELSE 0 END;
      WHEN 'linear' THEN
        v_credit_pct := 100.0 / v_path_length;
      WHEN 'time_decay' THEN
        v_credit_pct := POWER(0.5, (v_path_length - v_position)::NUMERIC / 7) * (100.0 / v_path_length);
      WHEN 'position_based' THEN
        IF v_position = 1 THEN
          v_credit_pct := 40;
        ELSIF v_position = v_path_length THEN
          v_credit_pct := 40;
        ELSE
          v_credit_pct := 20.0 / GREATEST(v_path_length - 2, 1);
        END IF;
      ELSE
        v_credit_pct := 100.0 / v_path_length;
    END CASE;

    -- Insert credit record
    INSERT INTO synthex_attr_v3_credits (
      tenant_id,
      path_id,
      touchpoint_id,
      conversion_id,
      attr_model,
      credit_percentage,
      credit_value,
      credit_currency,
      position_in_path,
      is_first_touch,
      is_last_touch,
      is_conversion_touch,
      confidence_score
    )
    VALUES (
      v_path.tenant_id,
      p_path_id,
      v_tp_id,
      v_path.conversion_id,
      p_model_type,
      v_credit_pct,
      v_conversion_value * (v_credit_pct / 100),
      'AUD',
      v_position,
      v_position = 1,
      v_position = v_path_length,
      v_position = v_path_length,
      0.8
    )
    RETURNING id INTO v_new_id;

    credit_id := v_new_id;
    touchpoint_id := v_tp_id;
    credit_percentage := v_credit_pct;
    credit_value := v_conversion_value * (v_credit_pct / 100);
    position_in_path := v_position;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate LTV for a profile
CREATE OR REPLACE FUNCTION calculate_attr_v3_ltv(
  p_tenant_id UUID,
  p_profile_id UUID
)
RETURNS synthex_attr_v3_ltv AS $$
DECLARE
  v_ltv synthex_attr_v3_ltv;
  v_conversions RECORD;
  v_touchpoints RECORD;
BEGIN
  -- Aggregate conversions
  SELECT
    COALESCE(SUM(conversion_value), 0) as total_revenue,
    COUNT(*) as purchase_count,
    MIN(conversion_timestamp) as first_purchase,
    MAX(conversion_timestamp) as last_purchase,
    COALESCE(AVG(conversion_value), 0) as avg_order_value,
    COALESCE(SUM(CASE WHEN conversion_timestamp >= NOW() - INTERVAL '30 days' THEN conversion_value ELSE 0 END), 0) as ltv_30,
    COALESCE(SUM(CASE WHEN conversion_timestamp >= NOW() - INTERVAL '90 days' THEN conversion_value ELSE 0 END), 0) as ltv_90,
    COALESCE(SUM(CASE WHEN conversion_timestamp >= NOW() - INTERVAL '365 days' THEN conversion_value ELSE 0 END), 0) as ltv_365
  INTO v_conversions
  FROM synthex_attr_v3_conversions
  WHERE tenant_id = p_tenant_id
    AND unified_profile_id = p_profile_id
    AND conv_type = 'closed_won';

  -- Get acquisition info
  SELECT
    channel as acquisition_channel,
    COALESCE(cost, 0) as acquisition_cost
  INTO v_touchpoints
  FROM synthex_attr_v3_touchpoints
  WHERE tenant_id = p_tenant_id
    AND unified_profile_id = p_profile_id
  ORDER BY touchpoint_timestamp ASC
  LIMIT 1;

  -- Upsert LTV record
  INSERT INTO synthex_attr_v3_ltv (
    tenant_id,
    unified_profile_id,
    total_revenue,
    ltv_30_days,
    ltv_90_days,
    ltv_365_days,
    ltv_lifetime,
    first_purchase_date,
    last_purchase_date,
    purchase_count,
    avg_order_value,
    acquisition_channel,
    acquisition_cost,
    cac_ltv_ratio,
    cohort_month,
    calculated_at
  )
  VALUES (
    p_tenant_id,
    p_profile_id,
    v_conversions.total_revenue,
    v_conversions.ltv_30,
    v_conversions.ltv_90,
    v_conversions.ltv_365,
    v_conversions.total_revenue,
    v_conversions.first_purchase,
    v_conversions.last_purchase,
    v_conversions.purchase_count,
    v_conversions.avg_order_value,
    v_touchpoints.acquisition_channel,
    v_touchpoints.acquisition_cost,
    CASE WHEN v_touchpoints.acquisition_cost > 0 THEN v_conversions.total_revenue / v_touchpoints.acquisition_cost ELSE NULL END,
    TO_CHAR(v_conversions.first_purchase, 'YYYY-MM'),
    NOW()
  )
  ON CONFLICT (tenant_id, unified_profile_id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    ltv_30_days = EXCLUDED.ltv_30_days,
    ltv_90_days = EXCLUDED.ltv_90_days,
    ltv_365_days = EXCLUDED.ltv_365_days,
    ltv_lifetime = EXCLUDED.ltv_lifetime,
    last_purchase_date = EXCLUDED.last_purchase_date,
    purchase_count = EXCLUDED.purchase_count,
    avg_order_value = EXCLUDED.avg_order_value,
    cac_ltv_ratio = EXCLUDED.cac_ltv_ratio,
    calculated_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO v_ltv;

  RETURN v_ltv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_attr_v3_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attr_v3_tp_updated ON synthex_attr_v3_touchpoints;
CREATE TRIGGER trg_attr_v3_tp_updated
  BEFORE UPDATE ON synthex_attr_v3_touchpoints
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

DROP TRIGGER IF EXISTS trg_attr_v3_conv_updated ON synthex_attr_v3_conversions;
CREATE TRIGGER trg_attr_v3_conv_updated
  BEFORE UPDATE ON synthex_attr_v3_conversions
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

DROP TRIGGER IF EXISTS trg_attr_v3_path_updated ON synthex_attr_v3_paths;
CREATE TRIGGER trg_attr_v3_path_updated
  BEFORE UPDATE ON synthex_attr_v3_paths
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

DROP TRIGGER IF EXISTS trg_attr_v3_credit_updated ON synthex_attr_v3_credits;
CREATE TRIGGER trg_attr_v3_credit_updated
  BEFORE UPDATE ON synthex_attr_v3_credits
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

DROP TRIGGER IF EXISTS trg_attr_v3_model_updated ON synthex_attr_v3_models;
CREATE TRIGGER trg_attr_v3_model_updated
  BEFORE UPDATE ON synthex_attr_v3_models
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

DROP TRIGGER IF EXISTS trg_attr_v3_ltv_updated ON synthex_attr_v3_ltv;
CREATE TRIGGER trg_attr_v3_ltv_updated
  BEFORE UPDATE ON synthex_attr_v3_ltv
  FOR EACH ROW EXECUTE FUNCTION update_attr_v3_timestamp();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_touchpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_conversions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_paths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_credits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_ltv TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_channel_perf TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_attr_v3_reports TO authenticated;

GRANT EXECUTE ON FUNCTION get_attr_v3_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_attr_v3_credits TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_attr_v3_ltv TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
