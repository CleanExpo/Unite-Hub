-- Migration 155: Region Transfer Safety Layer (RTSL)
-- Phase 112: Validates cross-region pattern transfers

CREATE TABLE IF NOT EXISTS region_transfer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  target_region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  pattern_ref JSONB NOT NULL,
  risk_assessment JSONB NOT NULL,
  transferability_score NUMERIC NOT NULL CHECK (transferability_score >= 0 AND transferability_score <= 1),
  cultural_distance NUMERIC CHECK (cultural_distance >= 0 AND cultural_distance <= 1),
  compliance_compatible BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_source ON region_transfer_assessments(source_region_id);
CREATE INDEX IF NOT EXISTS idx_transfer_target ON region_transfer_assessments(target_region_id);
CREATE INDEX IF NOT EXISTS idx_transfer_created ON region_transfer_assessments(created_at DESC);

ALTER TABLE region_transfer_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transfer assessments" ON region_transfer_assessments;
CREATE POLICY "Users can view transfer assessments" ON region_transfer_assessments FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE region_transfer_assessments IS 'Phase 112: Region transfer safety assessments';
