-- =====================================================================
-- Phase D50: Extend Existing A/B Testing & Experimentation Engine
-- =====================================================================
-- Extends migration 444 (synthex_experiments) with business_id support
-- and additional helpers for D50 requirements
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. Add business_id column if it doesn't exist
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'synthex_experiments'
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE synthex_experiments
    ADD COLUMN business_id uuid;

    COMMENT ON COLUMN synthex_experiments.business_id IS 'Optional: specific business context for experiment';
  END IF;
END $$;

-- =====================================================================
-- 2. Add business_id index
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_experiments_business
  ON synthex_experiments(tenant_id, business_id, status);

-- =====================================================================
-- 3. Add helper function for D50-style summary (CTR, conversion rate, revenue)
-- =====================================================================

/**
 * Get D50-style experiment summary with CTR, conversions, and revenue
 * Extends the existing get_experiment_summary function
 */
CREATE OR REPLACE FUNCTION synthex_get_d50_experiment_summary(
  p_experiment_id uuid
) RETURNS TABLE(
  variant_id uuid,
  variant_key text,
  variant_name text,
  is_control boolean,
  total_impressions bigint,
  total_clicks bigint,
  total_conversions bigint,
  total_revenue numeric,
  ctr numeric,
  conversion_rate numeric,
  revenue_per_impression numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS variant_id,
    v.id::text AS variant_key, -- Use ID as key for compatibility
    v.name AS variant_name,
    v.is_control,
    COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0)::bigint AS total_impressions,
    COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 0)::bigint AS total_clicks,
    COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::bigint AS total_conversions,
    COALESCE(SUM(m.value_sum) FILTER (WHERE m.event_type = 'conversion'), 0)::numeric AS total_revenue,
    CASE
      WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
      THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 0)::numeric /
            COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1)::numeric) * 100
      ELSE 0
    END AS ctr,
    CASE
      WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 0) > 0
      THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::numeric /
            COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 1)::numeric) * 100
      ELSE 0
    END AS conversion_rate,
    CASE
      WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
      THEN COALESCE(SUM(m.value_sum) FILTER (WHERE m.event_type = 'conversion'), 0)::numeric /
           COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1)::numeric
      ELSE 0
    END AS revenue_per_impression
  FROM synthex_experiment_variants v
  LEFT JOIN synthex_experiment_metrics m ON m.variant_id = v.id
  WHERE v.experiment_id = p_experiment_id
  GROUP BY v.id, v.name, v.is_control
  ORDER BY v.is_control DESC, total_impressions DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION synthex_get_d50_experiment_summary IS 'D50-compatible experiment summary with CTR, conversion rate, and revenue metrics';
