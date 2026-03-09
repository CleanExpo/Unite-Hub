-- Migration 115: Global Benchmark & Reputation Engine
-- Required by Phase 63 - Global Benchmark & Reputation Engine (GBRE)
-- Anonymised cross-tenant benchmarking and reputation scoring

-- Benchmark dimensions table
CREATE TABLE IF NOT EXISTS benchmark_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dimension_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  higher_is_better BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_dimensions_key ON benchmark_dimensions(dimension_key);
CREATE INDEX IF NOT EXISTS idx_benchmark_dimensions_created ON benchmark_dimensions(created_at DESC);

-- Enable RLS
ALTER TABLE benchmark_dimensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read, admin write)
CREATE POLICY benchmark_dimensions_select ON benchmark_dimensions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY benchmark_dimensions_insert ON benchmark_dimensions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE benchmark_dimensions IS 'Benchmark metric definitions (Phase 63)';

-- Benchmarks table
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  dimension_id UUID NOT NULL,
  value NUMERIC NOT NULL,
  period TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT benchmarks_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT benchmarks_dimension_fk
    FOREIGN KEY (dimension_id) REFERENCES benchmark_dimensions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_org ON benchmarks(org_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_dimension ON benchmarks(dimension_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_period ON benchmarks(period);
CREATE INDEX IF NOT EXISTS idx_benchmarks_industry ON benchmarks(industry);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created ON benchmarks(created_at DESC);

-- Enable RLS
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY benchmarks_select ON benchmarks
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY benchmarks_insert ON benchmarks
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE benchmarks IS 'Anonymised benchmark data points (Phase 63)';
