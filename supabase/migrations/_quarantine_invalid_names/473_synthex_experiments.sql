/**
 * Synthex Experiments Migration
 *
 * Phase: D44 - Experiment Lab OS (Growth Experiments & A/B Engine)
 *
 * Tables:
 * - synthex_exp_experiments: Experiment definitions
 * - synthex_exp_variants: A/B test variants
 * - synthex_exp_results: Variant performance results
 * - synthex_exp_assignments: User/entity assignments to variants
 * - synthex_exp_events: Tracking events for experiments
 *
 * Prefix: synthex_exp_*
 */

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Experiment status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_exp_status') THEN
    CREATE TYPE synthex_exp_status AS ENUM (
      'draft',
      'scheduled',
      'running',
      'paused',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- Experiment type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_exp_type') THEN
    CREATE TYPE synthex_exp_type AS ENUM (
      'ab_test',
      'multivariate',
      'feature_flag',
      'holdout',
      'rollout'
    );
  END IF;
END $$;

-- Metric type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_exp_metric_type') THEN
    CREATE TYPE synthex_exp_metric_type AS ENUM (
      'conversion',
      'revenue',
      'engagement',
      'retention',
      'click_rate',
      'bounce_rate',
      'time_on_page',
      'custom'
    );
  END IF;
END $$;

-- Statistical significance level
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_exp_significance') THEN
    CREATE TYPE synthex_exp_significance AS ENUM (
      'not_significant',
      'trending',
      'significant',
      'highly_significant'
    );
  END IF;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Experiments
CREATE TABLE IF NOT EXISTS synthex_exp_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  name text NOT NULL,
  description text,
  hypothesis text NOT NULL,

  experiment_type synthex_exp_type NOT NULL DEFAULT 'ab_test',
  status synthex_exp_status NOT NULL DEFAULT 'draft',

  -- Primary metric
  primary_metric text NOT NULL,
  metric_type synthex_exp_metric_type NOT NULL DEFAULT 'conversion',
  target_value numeric(14,4),
  minimum_detectable_effect numeric(6,4) DEFAULT 0.05, -- 5% MDE

  -- Secondary metrics
  secondary_metrics jsonb DEFAULT '[]',

  -- Targeting
  target_audience jsonb DEFAULT '{}',
  traffic_allocation numeric(5,2) DEFAULT 100.0, -- % of traffic to include

  -- Scheduling
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  started_at timestamptz,
  ended_at timestamptz,

  -- Configuration
  min_sample_size integer DEFAULT 1000,
  confidence_level numeric(5,4) DEFAULT 0.95,
  allow_early_stopping boolean DEFAULT true,

  -- Results
  winner_variant_id uuid,
  statistical_significance synthex_exp_significance DEFAULT 'not_significant',
  final_p_value numeric(8,6),
  final_lift_percent numeric(8,3),
  ai_conclusion jsonb,

  -- Ownership
  owner_user_id uuid,
  team_ids uuid[] DEFAULT '{}',

  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Experiment Variants
CREATE TABLE IF NOT EXISTS synthex_exp_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES synthex_exp_experiments(id) ON DELETE CASCADE,

  variant_key text NOT NULL, -- 'control', 'treatment_a', 'treatment_b', etc.
  label text NOT NULL,
  description text,

  is_control boolean DEFAULT false,
  allocation numeric(5,2) DEFAULT 50.0, -- % of experiment traffic

  -- Configuration specific to this variant
  config jsonb DEFAULT '{}',

  -- Results summary
  total_participants integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  conversion_rate numeric(8,6) DEFAULT 0,
  total_revenue numeric(14,2) DEFAULT 0,
  avg_revenue_per_user numeric(10,4) DEFAULT 0,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (experiment_id, variant_key)
);

-- Experiment Results (periodic snapshots)
CREATE TABLE IF NOT EXISTS synthex_exp_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES synthex_exp_experiments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES synthex_exp_variants(id) ON DELETE CASCADE,

  snapshot_date date NOT NULL,

  -- Metrics
  sample_size integer NOT NULL DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_rate numeric(8,6),
  revenue numeric(14,2) DEFAULT 0,
  avg_order_value numeric(10,4),

  -- Metric values (for custom metrics)
  metric_value numeric(16,6),
  metric_variance numeric(16,6),

  -- Statistical calculations
  p_value numeric(8,6),
  confidence_interval_low numeric(8,6),
  confidence_interval_high numeric(8,6),
  lift_percent numeric(8,3),
  lift_confidence numeric(8,6),

  is_winner boolean DEFAULT false,
  significance synthex_exp_significance DEFAULT 'not_significant',

  ai_commentary jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Experiment Assignments (which users are in which variant)
CREATE TABLE IF NOT EXISTS synthex_exp_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES synthex_exp_experiments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES synthex_exp_variants(id) ON DELETE CASCADE,

  -- Assignment entity (could be user, session, device, etc.)
  entity_type text NOT NULL DEFAULT 'user', -- 'user', 'session', 'device', 'contact'
  entity_id text NOT NULL,

  -- Assignment timing
  assigned_at timestamptz DEFAULT now(),
  first_exposure_at timestamptz,
  last_exposure_at timestamptz,

  -- Conversion tracking
  converted boolean DEFAULT false,
  converted_at timestamptz,
  conversion_value numeric(14,2),

  metadata jsonb DEFAULT '{}',

  UNIQUE (experiment_id, entity_type, entity_id)
);

-- Experiment Events (for tracking)
CREATE TABLE IF NOT EXISTS synthex_exp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES synthex_exp_experiments(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES synthex_exp_variants(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES synthex_exp_assignments(id) ON DELETE SET NULL,

  event_type text NOT NULL, -- 'exposure', 'click', 'conversion', 'revenue', 'custom'
  event_name text,
  event_value numeric(14,4),

  entity_type text NOT NULL DEFAULT 'user',
  entity_id text NOT NULL,

  page_url text,
  referrer_url text,
  user_agent text,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Experiment Templates
CREATE TABLE IF NOT EXISTS synthex_exp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- NULL for system templates

  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'pricing', 'messaging', 'ux', 'feature', 'marketing'

  experiment_type synthex_exp_type NOT NULL DEFAULT 'ab_test',
  default_hypothesis text,
  suggested_metrics jsonb DEFAULT '[]',
  suggested_variants jsonb DEFAULT '[]',

  is_public boolean DEFAULT false,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_exp_experiments_tenant_business
  ON synthex_exp_experiments (tenant_id, business_id);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_experiments_status
  ON synthex_exp_experiments (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_variants_experiment
  ON synthex_exp_variants (tenant_id, experiment_id);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_results_experiment_date
  ON synthex_exp_results (tenant_id, experiment_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_assignments_experiment_entity
  ON synthex_exp_assignments (experiment_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_events_experiment_created
  ON synthex_exp_events (tenant_id, experiment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_exp_templates_category
  ON synthex_exp_templates (category);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE synthex_exp_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_exp_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_exp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_exp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_exp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_exp_templates ENABLE ROW LEVEL SECURITY;

-- Experiments policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_experiments_tenant_isolation') THEN
    CREATE POLICY synthex_exp_experiments_tenant_isolation ON synthex_exp_experiments
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Variants policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_variants_tenant_isolation') THEN
    CREATE POLICY synthex_exp_variants_tenant_isolation ON synthex_exp_variants
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Results policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_results_tenant_isolation') THEN
    CREATE POLICY synthex_exp_results_tenant_isolation ON synthex_exp_results
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Assignments policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_assignments_tenant_isolation') THEN
    CREATE POLICY synthex_exp_assignments_tenant_isolation ON synthex_exp_assignments
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Events policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_events_tenant_isolation') THEN
    CREATE POLICY synthex_exp_events_tenant_isolation ON synthex_exp_events
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Templates policies (public or tenant-owned)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_exp_templates_access') THEN
    CREATE POLICY synthex_exp_templates_access ON synthex_exp_templates
      FOR SELECT USING (
        is_public = true OR
        tenant_id IS NULL OR
        tenant_id = current_setting('app.tenant_id', true)::uuid
      );
  END IF;
END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Calculate statistical significance (simplified z-test)
CREATE OR REPLACE FUNCTION synthex_exp_calculate_significance(
  p_control_conversions integer,
  p_control_sample integer,
  p_treatment_conversions integer,
  p_treatment_sample integer
) RETURNS TABLE(
  p_value numeric,
  significance synthex_exp_significance,
  lift_percent numeric
) AS $$
DECLARE
  p1 numeric;
  p2 numeric;
  pooled_p numeric;
  se numeric;
  z_score numeric;
  calc_p_value numeric;
  calc_lift numeric;
BEGIN
  -- Avoid division by zero
  IF p_control_sample = 0 OR p_treatment_sample = 0 THEN
    RETURN QUERY SELECT 1.0::numeric, 'not_significant'::synthex_exp_significance, 0.0::numeric;
    RETURN;
  END IF;

  p1 := p_control_conversions::numeric / p_control_sample;
  p2 := p_treatment_conversions::numeric / p_treatment_sample;

  -- Pooled proportion
  pooled_p := (p_control_conversions + p_treatment_conversions)::numeric /
              (p_control_sample + p_treatment_sample);

  -- Standard error
  IF pooled_p = 0 OR pooled_p = 1 THEN
    RETURN QUERY SELECT 1.0::numeric, 'not_significant'::synthex_exp_significance, 0.0::numeric;
    RETURN;
  END IF;

  se := sqrt(pooled_p * (1 - pooled_p) * (1.0 / p_control_sample + 1.0 / p_treatment_sample));

  IF se = 0 THEN
    RETURN QUERY SELECT 1.0::numeric, 'not_significant'::synthex_exp_significance, 0.0::numeric;
    RETURN;
  END IF;

  -- Z-score
  z_score := abs(p2 - p1) / se;

  -- Approximate p-value (two-tailed)
  calc_p_value := 2 * (1 - 0.5 * (1 + erf(z_score / sqrt(2))));

  -- Lift percentage
  calc_lift := CASE WHEN p1 > 0 THEN ((p2 - p1) / p1) * 100 ELSE 0 END;

  -- Determine significance level
  RETURN QUERY SELECT
    calc_p_value,
    CASE
      WHEN calc_p_value < 0.01 THEN 'highly_significant'::synthex_exp_significance
      WHEN calc_p_value < 0.05 THEN 'significant'::synthex_exp_significance
      WHEN calc_p_value < 0.10 THEN 'trending'::synthex_exp_significance
      ELSE 'not_significant'::synthex_exp_significance
    END,
    calc_lift;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update experiment updated_at
CREATE OR REPLACE FUNCTION synthex_exp_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_exp_experiments_updated_at ON synthex_exp_experiments;
CREATE TRIGGER trg_synthex_exp_experiments_updated_at
  BEFORE UPDATE ON synthex_exp_experiments
  FOR EACH ROW
  EXECUTE FUNCTION synthex_exp_experiments_updated_at();

-- Update variant stats on assignment changes
CREATE OR REPLACE FUNCTION synthex_exp_update_variant_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update variant statistics
  UPDATE synthex_exp_variants v
  SET
    total_participants = (
      SELECT COUNT(*) FROM synthex_exp_assignments a
      WHERE a.variant_id = v.id
    ),
    total_conversions = (
      SELECT COUNT(*) FROM synthex_exp_assignments a
      WHERE a.variant_id = v.id AND a.converted = true
    ),
    conversion_rate = (
      SELECT COALESCE(
        COUNT(*) FILTER (WHERE converted = true)::numeric /
        NULLIF(COUNT(*)::numeric, 0),
        0
      )
      FROM synthex_exp_assignments a
      WHERE a.variant_id = v.id
    ),
    total_revenue = (
      SELECT COALESCE(SUM(conversion_value), 0)
      FROM synthex_exp_assignments a
      WHERE a.variant_id = v.id AND a.converted = true
    ),
    updated_at = now()
  WHERE v.id = COALESCE(NEW.variant_id, OLD.variant_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_exp_assignments_update_stats ON synthex_exp_assignments;
CREATE TRIGGER trg_synthex_exp_assignments_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON synthex_exp_assignments
  FOR EACH ROW
  EXECUTE FUNCTION synthex_exp_update_variant_stats();

-- =============================================================================
-- SEED DATA - Default Templates
-- =============================================================================

INSERT INTO synthex_exp_templates (id, name, description, category, experiment_type, default_hypothesis, suggested_metrics, suggested_variants, is_public)
VALUES
  (
    gen_random_uuid(),
    'Pricing A/B Test',
    'Test different pricing strategies to optimize revenue',
    'pricing',
    'ab_test',
    'Changing the price from $X to $Y will increase overall revenue by Z%',
    '[{"name": "revenue_per_visitor", "type": "revenue"}, {"name": "conversion_rate", "type": "conversion"}]',
    '[{"key": "control", "label": "Current Price"}, {"key": "treatment", "label": "New Price"}]',
    true
  ),
  (
    gen_random_uuid(),
    'CTA Button Test',
    'Test different call-to-action button variations',
    'ux',
    'ab_test',
    'Changing the CTA from "X" to "Y" will improve click-through rate',
    '[{"name": "click_rate", "type": "click_rate"}, {"name": "conversion_rate", "type": "conversion"}]',
    '[{"key": "control", "label": "Original CTA"}, {"key": "treatment_a", "label": "Variant A"}, {"key": "treatment_b", "label": "Variant B"}]',
    true
  ),
  (
    gen_random_uuid(),
    'Email Subject Line Test',
    'Test email subject line variations for better open rates',
    'marketing',
    'ab_test',
    'Subject line variation will improve email open rates',
    '[{"name": "open_rate", "type": "engagement"}, {"name": "click_rate", "type": "click_rate"}]',
    '[{"key": "control", "label": "Original Subject"}, {"key": "treatment", "label": "New Subject"}]',
    true
  ),
  (
    gen_random_uuid(),
    'Feature Rollout',
    'Gradually roll out a new feature to users',
    'feature',
    'rollout',
    'The new feature will improve user engagement metrics',
    '[{"name": "feature_adoption", "type": "engagement"}, {"name": "retention", "type": "retention"}]',
    '[{"key": "control", "label": "Without Feature"}, {"key": "treatment", "label": "With Feature"}]',
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE synthex_exp_experiments IS 'Experiment definitions for A/B testing (D44)';
COMMENT ON TABLE synthex_exp_variants IS 'Variants within experiments (D44)';
COMMENT ON TABLE synthex_exp_results IS 'Periodic result snapshots (D44)';
COMMENT ON TABLE synthex_exp_assignments IS 'Entity assignments to variants (D44)';
COMMENT ON TABLE synthex_exp_events IS 'Event tracking for experiments (D44)';
COMMENT ON TABLE synthex_exp_templates IS 'Reusable experiment templates (D44)';
