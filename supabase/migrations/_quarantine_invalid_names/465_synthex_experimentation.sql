-- =====================================================
-- Migration: 465_synthex_experimentation.sql
-- Phase: D36 - Autonomous Experimentation Framework (AXF v1)
-- Description: A/B tests, variants, traffic allocation, AI-powered analysis
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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_axf_experiment_type') THEN
    CREATE TYPE synthex_axf_experiment_type AS ENUM (
      'ab_test',
      'multivariate',
      'split_url',
      'bandit',
      'feature_flag',
      'personalization',
      'holdout',
      'sequential'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_axf_experiment_status') THEN
    CREATE TYPE synthex_axf_experiment_status AS ENUM (
      'draft',
      'scheduled',
      'running',
      'paused',
      'completed',
      'archived',
      'stopped_early'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_axf_variant_type') THEN
    CREATE TYPE synthex_axf_variant_type AS ENUM (
      'control',
      'treatment',
      'challenger',
      'champion'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_axf_significance') THEN
    CREATE TYPE synthex_axf_significance AS ENUM (
      'not_significant',
      'marginally_significant',
      'significant',
      'highly_significant'
    );
  END IF;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Experiments - main experiment definitions
CREATE TABLE IF NOT EXISTS synthex_axf_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Experiment details
  experiment_name TEXT NOT NULL,
  experiment_description TEXT,
  exp_type synthex_axf_experiment_type NOT NULL DEFAULT 'ab_test',
  hypothesis TEXT,

  -- Status
  exp_status synthex_axf_experiment_status DEFAULT 'draft',

  -- Timing
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Traffic allocation
  traffic_percentage NUMERIC(5, 2) DEFAULT 100 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),

  -- Targeting
  targeting_rules JSONB DEFAULT '[]'::JSONB,
  audience_segments TEXT[],
  exclusion_segments TEXT[],

  -- Goals
  primary_metric TEXT NOT NULL,
  secondary_metrics TEXT[] DEFAULT '{}',
  minimum_detectable_effect NUMERIC(7, 4),
  confidence_level NUMERIC(5, 4) DEFAULT 0.95,

  -- Sample size
  target_sample_size INTEGER,
  current_sample_size INTEGER DEFAULT 0,

  -- Statistical settings
  test_type TEXT DEFAULT 'two_sided',
  multiple_comparison_correction TEXT DEFAULT 'bonferroni',

  -- AI settings
  ai_auto_optimize BOOLEAN DEFAULT FALSE,
  ai_early_stopping BOOLEAN DEFAULT TRUE,
  ai_bandits_enabled BOOLEAN DEFAULT FALSE,

  -- Results
  winner_variant_id UUID,
  winning_probability NUMERIC(5, 4),
  estimated_lift NUMERIC(10, 4),
  statistical_significance synthex_axf_significance DEFAULT 'not_significant',

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Audit
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variants - experiment variations
CREATE TABLE IF NOT EXISTS synthex_axf_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_axf_experiments(id) ON DELETE CASCADE,

  -- Variant details
  variant_name TEXT NOT NULL,
  variant_description TEXT,
  var_type synthex_axf_variant_type NOT NULL DEFAULT 'treatment',
  variant_key TEXT NOT NULL,

  -- Is control flag
  is_control BOOLEAN DEFAULT FALSE,

  -- Traffic allocation
  traffic_weight NUMERIC(5, 2) DEFAULT 50 CHECK (traffic_weight >= 0 AND traffic_weight <= 100),
  current_traffic_weight NUMERIC(5, 2),

  -- Content/config changes
  changes JSONB DEFAULT '{}'::JSONB,
  feature_flags JSONB DEFAULT '{}'::JSONB,
  content_overrides JSONB DEFAULT '{}'::JSONB,

  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(7, 6) DEFAULT 0,
  revenue NUMERIC(14, 4) DEFAULT 0,
  avg_order_value NUMERIC(12, 4),

  -- Statistical results
  sample_size INTEGER DEFAULT 0,
  mean_value NUMERIC(14, 6),
  std_deviation NUMERIC(14, 6),
  confidence_interval_low NUMERIC(14, 6),
  confidence_interval_high NUMERIC(14, 6),

  -- Comparison to control
  lift_vs_control NUMERIC(10, 4),
  p_value NUMERIC(10, 8),
  is_winner BOOLEAN DEFAULT FALSE,

  -- AI scores
  ai_performance_score NUMERIC(5, 4),
  ai_predicted_lift NUMERIC(10, 4),

  -- Display order
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments - user/session assignments to variants
CREATE TABLE IF NOT EXISTS synthex_axf_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_axf_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES synthex_axf_variants(id) ON DELETE CASCADE,

  -- Assignment target
  profile_id UUID,
  anonymous_id TEXT,
  session_id TEXT,

  -- Assignment details
  assignment_timestamp TIMESTAMPTZ DEFAULT NOW(),
  assignment_method TEXT DEFAULT 'random',

  -- Context
  device_type TEXT,
  browser TEXT,
  country TEXT,
  segment TEXT,

  -- Tracking
  has_converted BOOLEAN DEFAULT FALSE,
  conversion_timestamp TIMESTAMPTZ,
  conversion_value NUMERIC(12, 4),

  -- Metadata
  attributes JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events - experiment-related events
CREATE TABLE IF NOT EXISTS synthex_axf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_axf_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES synthex_axf_variants(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES synthex_axf_assignments(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL,
  event_name TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Value
  event_value NUMERIC(14, 4) DEFAULT 0,
  event_currency TEXT DEFAULT 'AUD',

  -- Context
  page_url TEXT,
  element_id TEXT,
  session_id TEXT,

  -- Additional data
  event_properties JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results snapshots - periodic statistical snapshots
CREATE TABLE IF NOT EXISTS synthex_axf_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_axf_experiments(id) ON DELETE CASCADE,

  -- Snapshot time
  snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
  snapshot_type TEXT DEFAULT 'hourly',

  -- Overall metrics
  total_sample_size INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC(14, 4) DEFAULT 0,

  -- Statistical results per variant
  variant_results JSONB DEFAULT '[]'::JSONB,

  -- Winner determination
  current_winner_id UUID REFERENCES synthex_axf_variants(id) ON DELETE SET NULL,
  winner_probability NUMERIC(5, 4),
  significance_level synthex_axf_significance DEFAULT 'not_significant',

  -- Early stopping
  should_stop_early BOOLEAN DEFAULT FALSE,
  stop_reason TEXT,

  -- AI analysis
  ai_analysis JSONB DEFAULT '{}'::JSONB,
  ai_recommendations JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags - simple feature toggles
CREATE TABLE IF NOT EXISTS synthex_axf_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Flag details
  flag_key TEXT NOT NULL,
  flag_name TEXT NOT NULL,
  flag_description TEXT,

  -- State
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Targeting
  targeting_rules JSONB DEFAULT '[]'::JSONB,
  user_segments TEXT[],
  user_ids TEXT[],

  -- Default values
  default_value JSONB DEFAULT 'false'::JSONB,
  variant_values JSONB DEFAULT '{}'::JSONB,

  -- Scheduling
  scheduled_enable TIMESTAMPTZ,
  scheduled_disable TIMESTAMPTZ,

  -- Linked experiment
  experiment_id UUID REFERENCES synthex_axf_experiments(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID,
  last_modified_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, flag_key)
);

-- Experiment templates - reusable experiment configurations
CREATE TABLE IF NOT EXISTS synthex_axf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Template details
  template_name TEXT NOT NULL,
  template_description TEXT,
  exp_type synthex_axf_experiment_type NOT NULL,
  category TEXT,

  -- Default configuration
  default_traffic_percentage NUMERIC(5, 2) DEFAULT 100,
  default_confidence_level NUMERIC(5, 4) DEFAULT 0.95,
  default_test_type TEXT DEFAULT 'two_sided',
  default_variants JSONB DEFAULT '[]'::JSONB,
  default_targeting_rules JSONB DEFAULT '[]'::JSONB,
  default_metrics JSONB DEFAULT '{}'::JSONB,

  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,

  -- Audit
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experimentation audit log
CREATE TABLE IF NOT EXISTS synthex_axf_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES synthex_axf_experiments(id) ON DELETE SET NULL,

  -- Audit details
  action TEXT NOT NULL,
  action_timestamp TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID,

  -- Change details
  previous_state JSONB,
  new_state JSONB,
  change_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_axf_exp_tenant ON synthex_axf_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_exp_status ON synthex_axf_experiments(exp_status);
CREATE INDEX IF NOT EXISTS idx_axf_exp_type ON synthex_axf_experiments(exp_type);
CREATE INDEX IF NOT EXISTS idx_axf_exp_dates ON synthex_axf_experiments(scheduled_start, scheduled_end);

CREATE INDEX IF NOT EXISTS idx_axf_var_tenant ON synthex_axf_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_var_exp ON synthex_axf_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_axf_var_key ON synthex_axf_variants(variant_key);

CREATE INDEX IF NOT EXISTS idx_axf_assign_tenant ON synthex_axf_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_assign_exp ON synthex_axf_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_axf_assign_variant ON synthex_axf_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_axf_assign_profile ON synthex_axf_assignments(profile_id);
CREATE INDEX IF NOT EXISTS idx_axf_assign_anon ON synthex_axf_assignments(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_axf_assign_session ON synthex_axf_assignments(session_id);

CREATE INDEX IF NOT EXISTS idx_axf_events_tenant ON synthex_axf_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_events_exp ON synthex_axf_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_axf_events_variant ON synthex_axf_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_axf_events_type ON synthex_axf_events(event_type);
CREATE INDEX IF NOT EXISTS idx_axf_events_time ON synthex_axf_events(event_timestamp);

CREATE INDEX IF NOT EXISTS idx_axf_results_tenant ON synthex_axf_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_results_exp ON synthex_axf_results(experiment_id);
CREATE INDEX IF NOT EXISTS idx_axf_results_time ON synthex_axf_results(snapshot_timestamp);

CREATE INDEX IF NOT EXISTS idx_axf_ff_tenant ON synthex_axf_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_ff_key ON synthex_axf_feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_axf_ff_enabled ON synthex_axf_feature_flags(is_enabled);

CREATE INDEX IF NOT EXISTS idx_axf_templates_tenant ON synthex_axf_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_templates_type ON synthex_axf_templates(exp_type);

CREATE INDEX IF NOT EXISTS idx_axf_audit_tenant ON synthex_axf_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_axf_audit_exp ON synthex_axf_audit(experiment_id);
CREATE INDEX IF NOT EXISTS idx_axf_audit_time ON synthex_axf_audit(action_timestamp);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_axf_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_axf_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create
DROP POLICY IF EXISTS "axf_experiments_tenant_isolation" ON synthex_axf_experiments;
CREATE POLICY "axf_experiments_tenant_isolation" ON synthex_axf_experiments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_variants_tenant_isolation" ON synthex_axf_variants;
CREATE POLICY "axf_variants_tenant_isolation" ON synthex_axf_variants
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_assignments_tenant_isolation" ON synthex_axf_assignments;
CREATE POLICY "axf_assignments_tenant_isolation" ON synthex_axf_assignments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_events_tenant_isolation" ON synthex_axf_events;
CREATE POLICY "axf_events_tenant_isolation" ON synthex_axf_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_results_tenant_isolation" ON synthex_axf_results;
CREATE POLICY "axf_results_tenant_isolation" ON synthex_axf_results
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_feature_flags_tenant_isolation" ON synthex_axf_feature_flags;
CREATE POLICY "axf_feature_flags_tenant_isolation" ON synthex_axf_feature_flags
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_templates_tenant_isolation" ON synthex_axf_templates;
CREATE POLICY "axf_templates_tenant_isolation" ON synthex_axf_templates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "axf_audit_tenant_isolation" ON synthex_axf_audit;
CREATE POLICY "axf_audit_tenant_isolation" ON synthex_axf_audit
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get experimentation stats
CREATE OR REPLACE FUNCTION get_axf_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_experiments', (SELECT COUNT(*) FROM synthex_axf_experiments WHERE tenant_id = p_tenant_id),
    'active_experiments', (SELECT COUNT(*) FROM synthex_axf_experiments WHERE tenant_id = p_tenant_id AND exp_status = 'running'),
    'draft_experiments', (SELECT COUNT(*) FROM synthex_axf_experiments WHERE tenant_id = p_tenant_id AND exp_status = 'draft'),
    'completed_experiments', (SELECT COUNT(*) FROM synthex_axf_experiments WHERE tenant_id = p_tenant_id AND exp_status = 'completed'),
    'total_variants', (SELECT COUNT(*) FROM synthex_axf_variants WHERE tenant_id = p_tenant_id),
    'total_assignments', (SELECT COUNT(*) FROM synthex_axf_assignments WHERE tenant_id = p_tenant_id),
    'total_conversions', (SELECT COUNT(*) FROM synthex_axf_assignments WHERE tenant_id = p_tenant_id AND has_converted = TRUE),
    'avg_conversion_rate', (SELECT COALESCE(AVG(conversion_rate), 0) FROM synthex_axf_variants WHERE tenant_id = p_tenant_id),
    'total_feature_flags', (SELECT COUNT(*) FROM synthex_axf_feature_flags WHERE tenant_id = p_tenant_id),
    'enabled_feature_flags', (SELECT COUNT(*) FROM synthex_axf_feature_flags WHERE tenant_id = p_tenant_id AND is_enabled = TRUE)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign user to experiment variant
CREATE OR REPLACE FUNCTION assign_to_axf_experiment(
  p_tenant_id UUID,
  p_experiment_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_experiment RECORD;
  v_existing_assignment UUID;
  v_variant_id UUID;
  v_random_value NUMERIC;
  v_assignment_id UUID;
BEGIN
  -- Check experiment is running
  SELECT * INTO v_experiment
  FROM synthex_axf_experiments
  WHERE id = p_experiment_id
    AND tenant_id = p_tenant_id
    AND exp_status = 'running';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check for existing assignment
  SELECT id INTO v_existing_assignment
  FROM synthex_axf_assignments
  WHERE experiment_id = p_experiment_id
    AND (
      (profile_id IS NOT NULL AND profile_id = p_profile_id) OR
      (anonymous_id IS NOT NULL AND anonymous_id = p_anonymous_id) OR
      (session_id IS NOT NULL AND session_id = p_session_id)
    )
  LIMIT 1;

  IF v_existing_assignment IS NOT NULL THEN
    RETURN v_existing_assignment;
  END IF;

  -- Random variant selection based on weights
  v_random_value := random() * 100;

  SELECT id INTO v_variant_id
  FROM (
    SELECT
      id,
      SUM(COALESCE(current_traffic_weight, traffic_weight)) OVER (ORDER BY display_order) as cumulative_weight
    FROM synthex_axf_variants
    WHERE experiment_id = p_experiment_id
      AND tenant_id = p_tenant_id
  ) weighted
  WHERE cumulative_weight >= v_random_value
  ORDER BY cumulative_weight
  LIMIT 1;

  -- Fallback to first variant
  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id
    FROM synthex_axf_variants
    WHERE experiment_id = p_experiment_id
      AND tenant_id = p_tenant_id
    ORDER BY display_order
    LIMIT 1;
  END IF;

  IF v_variant_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create assignment
  INSERT INTO synthex_axf_assignments (
    tenant_id,
    experiment_id,
    variant_id,
    profile_id,
    anonymous_id,
    session_id,
    assignment_method
  )
  VALUES (
    p_tenant_id,
    p_experiment_id,
    v_variant_id,
    p_profile_id,
    p_anonymous_id,
    p_session_id,
    'random'
  )
  RETURNING id INTO v_assignment_id;

  -- Increment variant impressions
  UPDATE synthex_axf_variants
  SET impressions = impressions + 1,
      sample_size = sample_size + 1
  WHERE id = v_variant_id;

  -- Increment experiment sample size
  UPDATE synthex_axf_experiments
  SET current_sample_size = current_sample_size + 1
  WHERE id = p_experiment_id;

  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record experiment conversion
CREATE OR REPLACE FUNCTION record_axf_conversion(
  p_assignment_id UUID,
  p_conversion_value NUMERIC DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Get assignment
  SELECT * INTO v_assignment
  FROM synthex_axf_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND OR v_assignment.has_converted THEN
    RETURN FALSE;
  END IF;

  -- Update assignment
  UPDATE synthex_axf_assignments
  SET has_converted = TRUE,
      conversion_timestamp = NOW(),
      conversion_value = p_conversion_value
  WHERE id = p_assignment_id;

  -- Update variant stats
  UPDATE synthex_axf_variants
  SET conversions = conversions + 1,
      revenue = revenue + p_conversion_value,
      conversion_rate = (conversions + 1)::NUMERIC / NULLIF(sample_size, 0)
  WHERE id = v_assignment.variant_id;

  -- Record event
  INSERT INTO synthex_axf_events (
    tenant_id,
    experiment_id,
    variant_id,
    assignment_id,
    event_type,
    event_name,
    event_value
  )
  VALUES (
    v_assignment.tenant_id,
    v_assignment.experiment_id,
    v_assignment.variant_id,
    p_assignment_id,
    'conversion',
    'experiment_conversion',
    p_conversion_value
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate experiment statistics
CREATE OR REPLACE FUNCTION calculate_axf_stats(p_experiment_id UUID)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  sample_size INTEGER,
  conversions INTEGER,
  conversion_rate NUMERIC,
  mean_value NUMERIC,
  std_deviation NUMERIC,
  lift_vs_control NUMERIC,
  p_value NUMERIC
) AS $$
DECLARE
  v_control_rate NUMERIC;
  v_control_mean NUMERIC;
  v_control_std NUMERIC;
  v_control_n INTEGER;
BEGIN
  -- Get control variant stats
  SELECT
    COALESCE(v.conversion_rate, 0),
    COALESCE(v.mean_value, 0),
    COALESCE(v.std_deviation, 1),
    COALESCE(v.sample_size, 0)
  INTO v_control_rate, v_control_mean, v_control_std, v_control_n
  FROM synthex_axf_variants v
  WHERE v.experiment_id = p_experiment_id
    AND v.is_control = TRUE
  LIMIT 1;

  RETURN QUERY
  SELECT
    v.id as variant_id,
    v.variant_name,
    v.sample_size,
    v.conversions,
    v.conversion_rate,
    v.mean_value,
    v.std_deviation,
    CASE
      WHEN v_control_rate > 0 THEN
        ((v.conversion_rate - v_control_rate) / v_control_rate) * 100
      ELSE 0
    END as lift_vs_control,
    CASE
      WHEN v.sample_size > 0 AND v_control_n > 0 AND v.std_deviation > 0 AND v_control_std > 0 THEN
        1 - (ABS(v.conversion_rate - v_control_rate) /
             SQRT((v.std_deviation^2 / v.sample_size) + (v_control_std^2 / v_control_n)))
      ELSE 1
    END as p_value
  FROM synthex_axf_variants v
  WHERE v.experiment_id = p_experiment_id
  ORDER BY v.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_axf_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_axf_experiments_updated ON synthex_axf_experiments;
CREATE TRIGGER trg_axf_experiments_updated
  BEFORE UPDATE ON synthex_axf_experiments
  FOR EACH ROW EXECUTE FUNCTION update_axf_timestamp();

DROP TRIGGER IF EXISTS trg_axf_variants_updated ON synthex_axf_variants;
CREATE TRIGGER trg_axf_variants_updated
  BEFORE UPDATE ON synthex_axf_variants
  FOR EACH ROW EXECUTE FUNCTION update_axf_timestamp();

DROP TRIGGER IF EXISTS trg_axf_assignments_updated ON synthex_axf_assignments;
CREATE TRIGGER trg_axf_assignments_updated
  BEFORE UPDATE ON synthex_axf_assignments
  FOR EACH ROW EXECUTE FUNCTION update_axf_timestamp();

DROP TRIGGER IF EXISTS trg_axf_feature_flags_updated ON synthex_axf_feature_flags;
CREATE TRIGGER trg_axf_feature_flags_updated
  BEFORE UPDATE ON synthex_axf_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_axf_timestamp();

DROP TRIGGER IF EXISTS trg_axf_templates_updated ON synthex_axf_templates;
CREATE TRIGGER trg_axf_templates_updated
  BEFORE UPDATE ON synthex_axf_templates
  FOR EACH ROW EXECUTE FUNCTION update_axf_timestamp();

-- Audit trigger for experiments
CREATE OR REPLACE FUNCTION audit_axf_experiment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO synthex_axf_audit (
      tenant_id, experiment_id, action, new_state, performed_by
    )
    VALUES (
      NEW.tenant_id, NEW.id, 'created', to_jsonb(NEW), NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.exp_status IS DISTINCT FROM NEW.exp_status THEN
      INSERT INTO synthex_axf_audit (
        tenant_id, experiment_id, action, previous_state, new_state
      )
      VALUES (
        NEW.tenant_id, NEW.id,
        CASE NEW.exp_status
          WHEN 'running' THEN 'started'
          WHEN 'paused' THEN 'paused'
          WHEN 'completed' THEN 'completed'
          WHEN 'stopped_early' THEN 'stopped'
          ELSE 'status_changed'
        END,
        jsonb_build_object('status', OLD.exp_status),
        jsonb_build_object('status', NEW.exp_status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_axf_experiment_audit ON synthex_axf_experiments;
CREATE TRIGGER trg_axf_experiment_audit
  AFTER INSERT OR UPDATE ON synthex_axf_experiments
  FOR EACH ROW EXECUTE FUNCTION audit_axf_experiment_changes();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_experiments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_axf_audit TO authenticated;

GRANT EXECUTE ON FUNCTION get_axf_stats TO authenticated;
GRANT EXECUTE ON FUNCTION assign_to_axf_experiment TO authenticated;
GRANT EXECUTE ON FUNCTION record_axf_conversion TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_axf_stats TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
