-- Migration 186: Cross-Tenant Benchmark Engine (CTBE)
-- Phase 143: Percentile benchmark bands based on anonymised aggregates

-- Benchmark bands table
CREATE TABLE IF NOT EXISTS benchmark_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  percentile_10 NUMERIC,
  percentile_25 NUMERIC,
  percentile_50 NUMERIC,
  percentile_75 NUMERIC,
  percentile_90 NUMERIC,
  sample_size INTEGER NOT NULL,
  min_sample_required INTEGER NOT NULL DEFAULT 10,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant benchmark reports table
CREATE TABLE IF NOT EXISTS tenant_benchmark_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  tenant_value NUMERIC NOT NULL,
  percentile_position NUMERIC,
  cohort_id TEXT NOT NULL,
  comparison_notes TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_bands_metric ON benchmark_bands(metric_type);
CREATE INDEX IF NOT EXISTS idx_benchmark_bands_cohort ON benchmark_bands(cohort_id);
CREATE INDEX IF NOT EXISTS idx_tenant_benchmarks_tenant ON tenant_benchmark_reports(tenant_id);

-- RLS
ALTER TABLE benchmark_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_benchmark_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view benchmarks" ON benchmark_bands;
CREATE POLICY "Authenticated users can view benchmarks" ON benchmark_bands
  FOR SELECT USING (is_valid = true);

DROP POLICY IF EXISTS "Users can view their benchmark reports" ON tenant_benchmark_reports;
CREATE POLICY "Users can view their benchmark reports" ON tenant_benchmark_reports
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
