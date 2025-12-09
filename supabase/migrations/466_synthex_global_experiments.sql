-- =====================================================
-- Migration: 466_synthex_global_experiments.sql
-- Phase: D37 - Global Experiment Orchestrator (GEO)
-- Description: Cross-tenant experiment coordination with segment rollouts
-- =====================================================

-- =====================================================
-- PRE-FLIGHT CHECKLIST VALIDATED:
-- [x] Dependencies: synthex_tenants IF NOT EXISTS
-- [x] ENUMs: DO blocks with pg_type checks, synthex_geo_* prefix
-- [x] Columns: geo_status, geo_scope to avoid type conflicts
-- [x] Constraints: No COALESCE in UNIQUE
-- [x] FKs: Only to tables in this migration
-- [x] Policies: DROP IF EXISTS before CREATE
-- [x] Indexes: IF NOT EXISTS
-- =====================================================

-- =====================================================
-- DEPENDENCY CHECK
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
-- ENUMS (safe creation with DO blocks)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_geo_scope') THEN
    CREATE TYPE synthex_geo_scope AS ENUM (
      'global',
      'tenant',
      'segment',
      'cohort',
      'channel',
      'region',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_geo_status') THEN
    CREATE TYPE synthex_geo_status AS ENUM (
      'draft',
      'active',
      'paused',
      'completed',
      'archived',
      'rollback'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_geo_rollout_strategy') THEN
    CREATE TYPE synthex_geo_rollout_strategy AS ENUM (
      'immediate',
      'gradual',
      'canary',
      'blue_green',
      'feature_flag',
      'time_based',
      'manual'
    );
  END IF;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Global experiments - cross-tenant experiment definitions
CREATE TABLE IF NOT EXISTS synthex_geo_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Experiment identity
  experiment_key TEXT NOT NULL,
  experiment_name TEXT NOT NULL,
  description TEXT,

  -- Scope and targeting
  exp_scope synthex_geo_scope NOT NULL DEFAULT 'tenant',
  scope_config JSONB DEFAULT '{}'::JSONB,

  -- Status
  exp_status synthex_geo_status DEFAULT 'draft',

  -- Configuration
  config JSONB DEFAULT '{}'::JSONB,
  variants JSONB DEFAULT '[]'::JSONB,
  default_variant TEXT DEFAULT 'control',

  -- Rollout
  rollout_strategy synthex_geo_rollout_strategy DEFAULT 'gradual',
  rollout_config JSONB DEFAULT '{}'::JSONB,
  rollout_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Goals
  primary_metric TEXT,
  success_criteria JSONB DEFAULT '{}'::JSONB,

  -- AI
  ai_analysis JSONB DEFAULT '{}'::JSONB,
  ai_recommendations JSONB DEFAULT '[]'::JSONB,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique experiment key per tenant
  CONSTRAINT unique_geo_experiment_key UNIQUE (tenant_id, experiment_key)
);

-- Experiment rollouts - segment-level allocations
CREATE TABLE IF NOT EXISTS synthex_geo_rollouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_geo_experiments(id) ON DELETE CASCADE,

  -- Segment targeting
  segment_key TEXT NOT NULL,
  segment_name TEXT,
  segment_filter JSONB DEFAULT '{}'::JSONB,

  -- Allocation
  allocation NUMERIC(5, 4) DEFAULT 0.5 CHECK (allocation >= 0 AND allocation <= 1),
  variant_allocations JSONB DEFAULT '{}'::JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Performance
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(7, 6) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique segment per experiment
  CONSTRAINT unique_geo_rollout_segment UNIQUE (experiment_id, segment_key)
);

-- Experiment metrics - aggregated performance data
CREATE TABLE IF NOT EXISTS synthex_geo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_geo_experiments(id) ON DELETE CASCADE,

  -- Metric identity
  metric_name TEXT NOT NULL,
  metric_type TEXT DEFAULT 'conversion',

  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT DEFAULT 'daily',

  -- Values by variant
  metric_values JSONB DEFAULT '{}'::JSONB,

  -- Statistical analysis
  sample_sizes JSONB DEFAULT '{}'::JSONB,
  confidence_intervals JSONB DEFAULT '{}'::JSONB,
  p_values JSONB DEFAULT '{}'::JSONB,
  statistical_significance BOOLEAN DEFAULT FALSE,

  -- AI analysis
  ai_summary JSONB DEFAULT '{}'::JSONB,
  ai_recommendations JSONB DEFAULT '[]'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiment events - individual evaluation events
CREATE TABLE IF NOT EXISTS synthex_geo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES synthex_geo_experiments(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  variant_assigned TEXT,

  -- Target
  profile_id UUID,
  anonymous_id TEXT,
  session_id TEXT,

  -- Context
  context JSONB DEFAULT '{}'::JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_geo_exp_tenant ON synthex_geo_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_exp_status ON synthex_geo_experiments(exp_status);
CREATE INDEX IF NOT EXISTS idx_geo_exp_key ON synthex_geo_experiments(experiment_key);
CREATE INDEX IF NOT EXISTS idx_geo_exp_scope ON synthex_geo_experiments(exp_scope);

CREATE INDEX IF NOT EXISTS idx_geo_rollout_tenant ON synthex_geo_rollouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_rollout_exp ON synthex_geo_rollouts(experiment_id);
CREATE INDEX IF NOT EXISTS idx_geo_rollout_segment ON synthex_geo_rollouts(segment_key);

CREATE INDEX IF NOT EXISTS idx_geo_metrics_tenant ON synthex_geo_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_metrics_exp ON synthex_geo_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_geo_metrics_period ON synthex_geo_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_geo_events_tenant ON synthex_geo_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_geo_events_exp ON synthex_geo_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_geo_events_created ON synthex_geo_events(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_geo_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_geo_rollouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_geo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_geo_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "geo_experiments_tenant_isolation" ON synthex_geo_experiments;
CREATE POLICY "geo_experiments_tenant_isolation" ON synthex_geo_experiments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "geo_rollouts_tenant_isolation" ON synthex_geo_rollouts;
CREATE POLICY "geo_rollouts_tenant_isolation" ON synthex_geo_rollouts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "geo_metrics_tenant_isolation" ON synthex_geo_metrics;
CREATE POLICY "geo_metrics_tenant_isolation" ON synthex_geo_metrics
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "geo_events_tenant_isolation" ON synthex_geo_events;
CREATE POLICY "geo_events_tenant_isolation" ON synthex_geo_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION synthex_geo_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS geo_experiments_updated_at ON synthex_geo_experiments;
CREATE TRIGGER geo_experiments_updated_at
  BEFORE UPDATE ON synthex_geo_experiments
  FOR EACH ROW EXECUTE FUNCTION synthex_geo_update_timestamp();

DROP TRIGGER IF EXISTS geo_rollouts_updated_at ON synthex_geo_rollouts;
CREATE TRIGGER geo_rollouts_updated_at
  BEFORE UPDATE ON synthex_geo_rollouts
  FOR EACH ROW EXECUTE FUNCTION synthex_geo_update_timestamp();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Evaluate experiment for a user
CREATE OR REPLACE FUNCTION synthex_geo_evaluate_experiment(
  p_tenant_id UUID,
  p_experiment_key TEXT,
  p_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_experiment RECORD;
  v_variant TEXT;
  v_result JSONB;
BEGIN
  -- Get experiment
  SELECT * INTO v_experiment
  FROM synthex_geo_experiments
  WHERE tenant_id = p_tenant_id
    AND experiment_key = p_experiment_key
    AND exp_status = 'active';

  IF v_experiment IS NULL THEN
    RETURN jsonb_build_object(
      'enrolled', false,
      'variant', NULL,
      'reason', 'experiment_not_found'
    );
  END IF;

  -- Simple random allocation based on rollout percentage
  IF random() * 100 <= v_experiment.rollout_percentage THEN
    -- Assign to treatment (simplified - real impl would use variant weights)
    v_variant := COALESCE(
      (v_experiment.variants->0->>'key'),
      'treatment'
    );
  ELSE
    v_variant := v_experiment.default_variant;
  END IF;

  v_result := jsonb_build_object(
    'enrolled', true,
    'experiment_id', v_experiment.id,
    'experiment_key', v_experiment.experiment_key,
    'variant', v_variant,
    'config', v_experiment.config
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get experiment stats
CREATE OR REPLACE FUNCTION synthex_geo_get_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_experiments', COUNT(*),
    'active_experiments', COUNT(*) FILTER (WHERE exp_status = 'active'),
    'draft_experiments', COUNT(*) FILTER (WHERE exp_status = 'draft'),
    'completed_experiments', COUNT(*) FILTER (WHERE exp_status = 'completed'),
    'experiments_by_scope', (
      SELECT jsonb_object_agg(exp_scope, cnt)
      FROM (
        SELECT exp_scope, COUNT(*) as cnt
        FROM synthex_geo_experiments
        WHERE tenant_id = p_tenant_id
        GROUP BY exp_scope
      ) s
    ),
    'total_rollouts', (
      SELECT COUNT(*)
      FROM synthex_geo_rollouts r
      JOIN synthex_geo_experiments e ON r.experiment_id = e.id
      WHERE e.tenant_id = p_tenant_id
    ),
    'total_events', (
      SELECT COUNT(*)
      FROM synthex_geo_events
      WHERE tenant_id = p_tenant_id
    )
  ) INTO result
  FROM synthex_geo_experiments
  WHERE tenant_id = p_tenant_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_geo_experiments IS 'Global experiment definitions with cross-tenant coordination';
COMMENT ON TABLE synthex_geo_rollouts IS 'Segment-level experiment rollout allocations';
COMMENT ON TABLE synthex_geo_metrics IS 'Aggregated experiment performance metrics';
COMMENT ON TABLE synthex_geo_events IS 'Individual experiment evaluation events';
