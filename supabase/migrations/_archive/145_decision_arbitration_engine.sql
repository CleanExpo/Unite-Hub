-- Migration 145: Autonomous Decision Arbitration Engine (ADAE)
-- Phase 102: Truth-layer governed conflict resolution

CREATE TABLE IF NOT EXISTS arbitration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  conflict_sources JSONB NOT NULL,
  analysis JSONB NOT NULL,
  resolution JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'escalated', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arbitration_tenant ON arbitration_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_arbitration_status ON arbitration_events(status);
CREATE INDEX IF NOT EXISTS idx_arbitration_created ON arbitration_events(created_at DESC);

ALTER TABLE arbitration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view arbitration events" ON arbitration_events FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE arbitration_events IS 'Phase 102: Advisory-only conflict arbitration events';
