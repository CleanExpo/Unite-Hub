-- =====================================================================
-- Phase D55: Global Experimentation & A/B Testing Engine
-- =====================================================================
-- Tables: unite_experiments, unite_experiment_variants,
--         unite_experiment_assignments, unite_experiment_metrics
--
-- Purpose:
-- - Multi-tenant experimentation framework
-- - Variant assignment and tracking
-- - Metrics collection and analysis
-- - AI-powered experiment suggestions and insights
--
-- Key Concepts:
-- - Experiments define test parameters and variants
-- - Assignments track which subjects see which variants
-- - Metrics aggregate performance data by variant
-- - AI profiles enable intelligent experiment design
-- - Uses RLS for tenant isolation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 483

-- =====================================================================
-- 1. Tables
-- =====================================================================

-- Experiments table
CREATE TABLE IF NOT EXISTS unite_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Experiment identification
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  scope text NOT NULL, -- 'email', 'landing_page', 'workflow', 'pricing', etc.

  -- Status and lifecycle
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'archived'
  hypothesis text,

  -- Metrics configuration
  primary_metric text, -- 'conversion_rate', 'revenue', 'engagement', etc.
  secondary_metrics text[],

  -- Timing
  start_at timestamptz,
  end_at timestamptz,

  -- Configuration
  traffic_allocation jsonb, -- { "enabled": true, "percentage": 50, "rules": [...] }
  ai_profile jsonb, -- AI-generated insights and recommendations

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Experiment variants table
CREATE TABLE IF NOT EXISTS unite_experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES unite_experiments(id) ON DELETE CASCADE,

  -- Variant identification
  key text NOT NULL, -- 'control', 'variant_a', 'variant_b', etc.
  name text NOT NULL,
  description text,

  -- Traffic allocation
  allocation numeric(5,2) DEFAULT 0.0, -- Percentage (0.00-100.00)

  -- Variant configuration
  config jsonb, -- Variant-specific settings (subject line, CTA text, layout, etc.)

  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Subject assignments table
CREATE TABLE IF NOT EXISTS unite_experiment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES unite_experiments(id) ON DELETE CASCADE,

  -- Subject details
  subject_type text NOT NULL, -- 'contact', 'session', 'campaign_enrollment', etc.
  subject_id uuid NOT NULL,
  variant_key text NOT NULL,

  -- Assignment tracking
  assigned_at timestamptz DEFAULT now(),
  metadata jsonb -- Context at assignment time
);

-- Metrics table (aggregated by variant + date)
CREATE TABLE IF NOT EXISTS unite_experiment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  experiment_id uuid NOT NULL REFERENCES unite_experiments(id) ON DELETE CASCADE,

  -- Metric details
  variant_key text NOT NULL,
  metric text NOT NULL, -- 'opens', 'clicks', 'conversions', 'revenue', etc.
  bucket_date date NOT NULL, -- For daily aggregation

  -- Metric values
  value numeric(18,4) NOT NULL, -- Sum of metric values
  count bigint NOT NULL DEFAULT 1, -- Number of events

  -- Additional context
  metadata jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

-- Experiments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_experiments_tenant_slug
  ON unite_experiments(tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_unite_experiments_tenant_status
  ON unite_experiments(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_unite_experiments_dates
  ON unite_experiments(start_at, end_at);

-- Variants
CREATE INDEX IF NOT EXISTS idx_unite_experiment_variants_experiment
  ON unite_experiment_variants(experiment_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_experiment_variants_experiment_key
  ON unite_experiment_variants(experiment_id, key);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_unite_experiment_assignments_tenant_experiment
  ON unite_experiment_assignments(tenant_id, experiment_id);

CREATE INDEX IF NOT EXISTS idx_unite_experiment_assignments_subject
  ON unite_experiment_assignments(tenant_id, experiment_id, subject_type, subject_id);

-- Metrics
CREATE INDEX IF NOT EXISTS idx_unite_experiment_metrics_tenant_experiment
  ON unite_experiment_metrics(tenant_id, experiment_id);

CREATE INDEX IF NOT EXISTS idx_unite_experiment_metrics_variant_date
  ON unite_experiment_metrics(tenant_id, experiment_id, variant_key, metric, bucket_date);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_experiment_metrics ENABLE ROW LEVEL SECURITY;

-- Experiments
DROP POLICY IF EXISTS "tenant_isolation" ON unite_experiments;
CREATE POLICY "tenant_isolation" ON unite_experiments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assignments
DROP POLICY IF EXISTS "tenant_isolation" ON unite_experiment_assignments;
CREATE POLICY "tenant_isolation" ON unite_experiment_assignments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Metrics
DROP POLICY IF EXISTS "tenant_isolation" ON unite_experiment_metrics;
CREATE POLICY "tenant_isolation" ON unite_experiment_metrics
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

/**
 * Get experiment summary statistics
 */
CREATE OR REPLACE FUNCTION unite_get_experiment_summary(
  p_tenant_id uuid,
  p_experiment_id uuid
) RETURNS TABLE(
  total_assignments bigint,
  assignments_by_variant jsonb,
  metrics_summary jsonb,
  confidence_level numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH assignment_counts AS (
    SELECT
      variant_key,
      COUNT(*)::bigint AS count
    FROM unite_experiment_assignments
    WHERE tenant_id = p_tenant_id
      AND experiment_id = p_experiment_id
    GROUP BY variant_key
  ),
  metric_aggregates AS (
    SELECT
      variant_key,
      metric,
      SUM(value) AS total_value,
      SUM(count) AS total_count,
      AVG(value / NULLIF(count, 0)) AS avg_value
    FROM unite_experiment_metrics
    WHERE tenant_id = p_tenant_id
      AND experiment_id = p_experiment_id
    GROUP BY variant_key, metric
  )
  SELECT
    COALESCE(SUM(ac.count), 0) AS total_assignments,
    COALESCE(jsonb_object_agg(ac.variant_key, ac.count), '{}'::jsonb) AS assignments_by_variant,
    COALESCE(
      jsonb_object_agg(
        ma.variant_key,
        jsonb_build_object(
          'metrics', jsonb_object_agg(
            ma.metric,
            jsonb_build_object(
              'total', ma.total_value,
              'count', ma.total_count,
              'average', ma.avg_value
            )
          )
        )
      ),
      '{}'::jsonb
    ) AS metrics_summary,
    -- Simple confidence calculation (can be enhanced)
    CASE
      WHEN COALESCE(SUM(ac.count), 0) >= 100 THEN 0.95
      WHEN COALESCE(SUM(ac.count), 0) >= 50 THEN 0.80
      WHEN COALESCE(SUM(ac.count), 0) >= 20 THEN 0.60
      ELSE 0.30
    END AS confidence_level
  FROM assignment_counts ac
  CROSS JOIN metric_aggregates ma;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Assign variant to subject (deterministic based on subject_id hash)
 */
CREATE OR REPLACE FUNCTION unite_assign_experiment_variant(
  p_tenant_id uuid,
  p_experiment_id uuid,
  p_subject_type text,
  p_subject_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE(
  variant_key text,
  variant_name text,
  assignment_id uuid
) AS $$
DECLARE
  v_existing_assignment record;
  v_variant record;
  v_hash_value bigint;
  v_allocation numeric;
  v_cumulative numeric := 0;
  v_assignment_id uuid;
BEGIN
  -- Check for existing assignment
  SELECT variant_key INTO v_existing_assignment
  FROM unite_experiment_assignments
  WHERE tenant_id = p_tenant_id
    AND experiment_id = p_experiment_id
    AND subject_type = p_subject_type
    AND subject_id = p_subject_id
  LIMIT 1;

  IF FOUND THEN
    -- Return existing assignment
    SELECT v.key, v.name, a.id INTO variant_key, variant_name, assignment_id
    FROM unite_experiment_assignments a
    JOIN unite_experiment_variants v ON v.experiment_id = a.experiment_id AND v.key = a.variant_key
    WHERE a.tenant_id = p_tenant_id
      AND a.experiment_id = p_experiment_id
      AND a.subject_type = p_subject_type
      AND a.subject_id = p_subject_id
    LIMIT 1;

    RETURN NEXT;
    RETURN;
  END IF;

  -- Generate deterministic hash from subject_id
  v_hash_value := ('x' || substring(p_subject_id::text from 1 for 8))::bit(32)::bigint;
  v_allocation := (v_hash_value % 10000) / 100.0; -- 0.00 to 99.99

  -- Find variant based on allocation
  FOR v_variant IN
    SELECT key, name, allocation
    FROM unite_experiment_variants
    WHERE experiment_id = p_experiment_id
    ORDER BY allocation DESC
  LOOP
    v_cumulative := v_cumulative + v_variant.allocation;

    IF v_allocation < v_cumulative THEN
      -- Create assignment
      INSERT INTO unite_experiment_assignments (
        tenant_id,
        experiment_id,
        subject_type,
        subject_id,
        variant_key,
        metadata
      ) VALUES (
        p_tenant_id,
        p_experiment_id,
        p_subject_type,
        p_subject_id,
        v_variant.key,
        p_metadata
      ) RETURNING id INTO v_assignment_id;

      variant_key := v_variant.key;
      variant_name := v_variant.name;
      assignment_id := v_assignment_id;

      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  -- Fallback to first variant if no match (shouldn't happen with proper allocation)
  SELECT key, name INTO v_variant
  FROM unite_experiment_variants
  WHERE experiment_id = p_experiment_id
  ORDER BY created_at
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO unite_experiment_assignments (
      tenant_id,
      experiment_id,
      subject_type,
      subject_id,
      variant_key,
      metadata
    ) VALUES (
      p_tenant_id,
      p_experiment_id,
      p_subject_type,
      p_subject_id,
      v_variant.key,
      p_metadata
    ) RETURNING id INTO v_assignment_id;

    variant_key := v_variant.key;
    variant_name := v_variant.name;
    assignment_id := v_assignment_id;

    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION unite_get_experiment_summary IS 'Get summary statistics for an experiment';
COMMENT ON FUNCTION unite_assign_experiment_variant IS 'Assign a variant to a subject (deterministic and idempotent)';
