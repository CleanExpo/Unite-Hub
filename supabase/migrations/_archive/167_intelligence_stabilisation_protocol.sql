-- Migration 167: Intelligence Stabilisation Protocol (ISP)
-- Phase 124: Monitors and corrects system instability

CREATE TABLE IF NOT EXISTS stabilisation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affected_engines JSONB NOT NULL,
  detected_pattern JSONB NOT NULL,
  corrective_actions JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL CHECK (status IN ('detected', 'correcting', 'resolved', 'escalated')) DEFAULT 'detected',
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stabilisation_status ON stabilisation_events(status);
CREATE INDEX IF NOT EXISTS idx_stabilisation_created ON stabilisation_events(created_at DESC);

ALTER TABLE stabilisation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view stabilisation" ON stabilisation_events;
CREATE POLICY "Authenticated users can view stabilisation" ON stabilisation_events FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE stabilisation_events IS 'Phase 124: Intelligence stabilisation events';
