-- Migration 191: Global Multi-Tenant Learning Loop (GMTLL)
-- Phase 148: Daily/weekly loop integrating TIBE, FPEH, CTBE, TCIE

-- Learning loop runs table
CREATE TABLE IF NOT EXISTS learning_loop_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL CHECK (run_type IN ('daily', 'weekly', 'manual')),
  patterns_collected INTEGER NOT NULL DEFAULT 0,
  benchmarks_updated INTEGER NOT NULL DEFAULT 0,
  cohorts_processed INTEGER NOT NULL DEFAULT 0,
  insights_distributed INTEGER NOT NULL DEFAULT 0,
  tibe_validations_passed INTEGER NOT NULL DEFAULT 0,
  tibe_validations_failed INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Global learning snapshots table
CREATE TABLE IF NOT EXISTS global_learning_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES learning_loop_runs(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  pattern_count INTEGER NOT NULL,
  benchmark_count INTEGER NOT NULL,
  cohort_count INTEGER NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant insight update packets table
CREATE TABLE IF NOT EXISTS tenant_insight_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  run_id UUID REFERENCES learning_loop_runs(id) ON DELETE CASCADE,
  insights JSONB NOT NULL DEFAULT '[]',
  pattern_suggestions JSONB DEFAULT '[]',
  benchmark_updates JSONB DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  was_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_runs_status ON learning_loop_runs(status);
CREATE INDEX IF NOT EXISTS idx_learning_snapshots_run ON global_learning_snapshots(run_id);
CREATE INDEX IF NOT EXISTS idx_insight_packets_tenant ON tenant_insight_packets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insight_packets_run ON tenant_insight_packets(run_id);

-- RLS
ALTER TABLE learning_loop_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_learning_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_insight_packets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view learning runs" ON learning_loop_runs;
CREATE POLICY "Authenticated users can view learning runs" ON learning_loop_runs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their insight packets" ON tenant_insight_packets;
CREATE POLICY "Users can view their insight packets" ON tenant_insight_packets
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
