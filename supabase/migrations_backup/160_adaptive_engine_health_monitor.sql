-- Migration 160: Adaptive Engine Health Monitor (AEHM)
-- Phase 117: Monitors health of all major engines

CREATE TABLE IF NOT EXISTS engine_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name TEXT NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'critical', 'unknown')),
  metrics JSONB NOT NULL,
  anomaly_flags JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_health_name ON engine_health_snapshots(engine_name);
CREATE INDEX IF NOT EXISTS idx_engine_health_status ON engine_health_snapshots(health_status);
CREATE INDEX IF NOT EXISTS idx_engine_health_created ON engine_health_snapshots(created_at DESC);

ALTER TABLE engine_health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view engine health" ON engine_health_snapshots;
CREATE POLICY "Authenticated users can view engine health" ON engine_health_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE engine_health_snapshots IS 'Phase 117: Engine health monitoring snapshots';
