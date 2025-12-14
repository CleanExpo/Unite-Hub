-- =====================================================================
-- Phase D64: Unified Usage & Cost Telemetry Engine
-- =====================================================================
-- Tables: unite_usage_dimensions, unite_usage_events, unite_cost_buckets, unite_usage_cost_daily
-- Enables cross-product usage tracking, cost attribution, and spend analytics
--
-- Migration: 492

DROP TABLE IF EXISTS unite_usage_cost_daily CASCADE;
DROP TABLE IF EXISTS unite_cost_buckets CASCADE;
DROP TABLE IF EXISTS unite_usage_events CASCADE;
DROP TABLE IF EXISTS unite_usage_dimensions CASCADE;

-- Usage Dimensions - catalog of trackable metrics
CREATE TABLE unite_usage_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  unit text NOT NULL,
  aggregation text NOT NULL DEFAULT 'sum',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usage Events - raw telemetry ingestion
CREATE TABLE unite_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  source text NOT NULL,
  dimension_key text NOT NULL,
  value numeric(18,4) NOT NULL,
  unit text NOT NULL,
  meta jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  ingested_at timestamptz NOT NULL DEFAULT now(),
  trace_id text,
  external_id text
);

-- Cost Buckets - provider pricing models
CREATE TABLE unite_cost_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  provider text NOT NULL,
  description text,
  currency text NOT NULL DEFAULT 'AUD',
  pricing_model text NOT NULL DEFAULT 'per_unit',
  unit text NOT NULL,
  rate_per_unit numeric(18,6),
  tiered_pricing jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily Usage/Cost Rollup - pre-aggregated for fast queries
CREATE TABLE unite_usage_cost_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  dimension_key text NOT NULL,
  cost_bucket_key text,
  usage_value numeric(18,4),
  usage_unit text,
  cost_amount numeric(18,6),
  currency text NOT NULL DEFAULT 'AUD',
  metadata jsonb,
  computed_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_unite_usage_dimensions_key ON unite_usage_dimensions(key);
CREATE UNIQUE INDEX idx_unite_cost_buckets_key ON unite_cost_buckets(key);
CREATE INDEX idx_unite_usage_events_tenant_time ON unite_usage_events(tenant_id, occurred_at DESC);
CREATE INDEX idx_unite_usage_events_tenant_dimension ON unite_usage_events(tenant_id, dimension_key);
CREATE INDEX idx_unite_usage_cost_daily_tenant_date ON unite_usage_cost_daily(tenant_id, date DESC);
CREATE INDEX idx_unite_usage_cost_daily_tenant_dimension_date ON unite_usage_cost_daily(tenant_id, dimension_key, date DESC);

-- RLS Policies
ALTER TABLE unite_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_usage_cost_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_usage_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_usage_cost_daily
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Helper Functions
CREATE OR REPLACE FUNCTION unite_get_usage_summary(p_tenant_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_usage_events', (
      SELECT COUNT(*)
      FROM unite_usage_events
      WHERE tenant_id = p_tenant_id
        AND occurred_at >= NOW() - (p_days || ' days')::interval
    ),
    'total_cost', (
      SELECT COALESCE(SUM(cost_amount), 0)
      FROM unite_usage_cost_daily
      WHERE tenant_id = p_tenant_id
        AND date >= CURRENT_DATE - p_days
    ),
    'daily_avg_cost', (
      SELECT COALESCE(AVG(cost_amount), 0)
      FROM unite_usage_cost_daily
      WHERE tenant_id = p_tenant_id
        AND date >= CURRENT_DATE - p_days
    ),
    'top_dimension', (
      SELECT dimension_key
      FROM unite_usage_cost_daily
      WHERE tenant_id = p_tenant_id
        AND date >= CURRENT_DATE - p_days
      GROUP BY dimension_key
      ORDER BY SUM(cost_amount) DESC
      LIMIT 1
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;
