-- =====================================================================
-- Phase D61: Unified Business Health & KPI Engine
-- =====================================================================
-- Tables: unite_kpi_definitions, unite_kpi_snapshots, unite_kpi_alerts
--
-- Purpose:
-- - Centralized KPI tracking across all business metrics
-- - Time-series snapshots for trend analysis
-- - Automated alerting on threshold breaches
-- - AI-powered insights and recommendations
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 489

-- =====================================================================
-- 1. Tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  source text NOT NULL,
  config jsonb NOT NULL,
  unit text,
  direction text DEFAULT 'higher_is_better',
  thresholds jsonb,
  ai_profile jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  kpi_id uuid NOT NULL REFERENCES unite_kpi_definitions(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  value numeric(18,4),
  delta numeric(18,4),
  direction text,
  source_meta jsonb,
  ai_summary jsonb,
  computed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_kpi_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  kpi_id uuid NOT NULL REFERENCES unite_kpi_definitions(id) ON DELETE CASCADE,
  severity text NOT NULL,
  title text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'open',
  metadata jsonb,
  ai_recommendation jsonb,
  opened_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_kpi_definitions_tenant_slug ON unite_kpi_definitions(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_unite_kpi_definitions_category ON unite_kpi_definitions(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_unite_kpi_snapshots_kpi_period ON unite_kpi_snapshots(tenant_id, kpi_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_unite_kpi_alerts_status ON unite_kpi_alerts(tenant_id, status, severity);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_kpi_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON unite_kpi_definitions;
CREATE POLICY "tenant_isolation" ON unite_kpi_definitions
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "tenant_isolation" ON unite_kpi_snapshots;
CREATE POLICY "tenant_isolation" ON unite_kpi_snapshots
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "tenant_isolation" ON unite_kpi_alerts;
CREATE POLICY "tenant_isolation" ON unite_kpi_alerts
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

CREATE OR REPLACE FUNCTION unite_get_kpi_summary(
  p_tenant_id uuid
) RETURNS TABLE(
  total_kpis bigint,
  active_kpis bigint,
  open_alerts bigint,
  critical_alerts bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(DISTINCT k.id) AS total_kpis,
    count(DISTINCT k.id) FILTER (WHERE k.is_active = true) AS active_kpis,
    count(DISTINCT a.id) FILTER (WHERE a.status = 'open') AS open_alerts,
    count(DISTINCT a.id) FILTER (WHERE a.status = 'open' AND a.severity = 'critical') AS critical_alerts
  FROM unite_kpi_definitions k
  LEFT JOIN unite_kpi_alerts a ON k.id = a.kpi_id
  WHERE k.tenant_id = p_tenant_id OR k.tenant_id IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_kpi_summary IS 'Get KPI health summary statistics';
