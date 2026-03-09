-- Migration 147: Strategic Alignment Engine (SAE)
-- Phase 104: Global alignment measurement

CREATE TABLE IF NOT EXISTS alignment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  alignment_vector JSONB NOT NULL,
  misalignment_flags JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  overall_alignment NUMERIC NOT NULL CHECK (overall_alignment >= 0 AND overall_alignment <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alignment_tenant ON alignment_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alignment_created ON alignment_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alignment_score ON alignment_snapshots(overall_alignment);

ALTER TABLE alignment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alignment snapshots" ON alignment_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can insert alignment snapshots" ON alignment_snapshots FOR INSERT
  WITH CHECK (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE alignment_snapshots IS 'Phase 104: Strategic alignment measurement snapshots';
