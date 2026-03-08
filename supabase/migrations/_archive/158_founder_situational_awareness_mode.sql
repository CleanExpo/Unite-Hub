-- Migration 158: Founder Situational Awareness Mode (FSAM)
-- Phase 115: Time-bound snapshot of critical items for founders

CREATE TABLE IF NOT EXISTS situational_awareness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  awareness_payload JSONB NOT NULL,
  time_window TEXT NOT NULL CHECK (time_window IN ('1h', '4h', '24h', '7d', '30d')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_situational_awareness_tenant ON situational_awareness_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_situational_awareness_created ON situational_awareness_snapshots(created_at DESC);

ALTER TABLE situational_awareness_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view awareness snapshots" ON situational_awareness_snapshots;
CREATE POLICY "Users can view awareness snapshots" ON situational_awareness_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE situational_awareness_snapshots IS 'Phase 115: Founder situational awareness snapshots';
