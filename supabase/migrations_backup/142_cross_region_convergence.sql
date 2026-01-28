-- Migration 142: Cross-Region Knowledge Convergence Engine (CRKCE)
-- Phase 99: Safe transfer of learnings across regions

-- Regional learning packets table
CREATE TABLE IF NOT EXISTS regional_learning_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  target_region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  pattern_summary JSONB NOT NULL,
  adjustment_notes TEXT,
  transferability_score NUMERIC NOT NULL CHECK (transferability_score >= 0 AND transferability_score <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  cultural_distance NUMERIC NOT NULL DEFAULT 0.5,
  compliance_compatible BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_packets_source ON regional_learning_packets(source_region_id);
CREATE INDEX IF NOT EXISTS idx_learning_packets_target ON regional_learning_packets(target_region_id);
CREATE INDEX IF NOT EXISTS idx_learning_packets_status ON regional_learning_packets(status);
CREATE INDEX IF NOT EXISTS idx_learning_packets_score ON regional_learning_packets(transferability_score DESC);
CREATE INDEX IF NOT EXISTS idx_learning_packets_created ON regional_learning_packets(created_at DESC);

-- RLS
ALTER TABLE regional_learning_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning packets" ON regional_learning_packets FOR SELECT USING (true);
CREATE POLICY "Users can insert learning packets" ON regional_learning_packets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update learning packets" ON regional_learning_packets FOR UPDATE USING (true);

-- Function to calculate cultural distance
CREATE OR REPLACE FUNCTION calculate_cultural_distance(source_region UUID, target_region UUID)
RETURNS NUMERIC AS $$
DECLARE
  src_code TEXT;
  tgt_code TEXT;
BEGIN
  SELECT region_code INTO src_code FROM regions WHERE id = source_region;
  SELECT region_code INTO tgt_code FROM regions WHERE id = target_region;

  -- Same region family has low distance
  IF src_code = tgt_code THEN RETURN 0.0; END IF;

  -- AU/NZ are culturally close
  IF (src_code IN ('AU', 'NZ') AND tgt_code IN ('AU', 'NZ')) THEN RETURN 0.1; END IF;

  -- UK/AU/NZ are Commonwealth
  IF (src_code IN ('AU', 'NZ', 'UK', 'GB') AND tgt_code IN ('AU', 'NZ', 'UK', 'GB')) THEN RETURN 0.2; END IF;

  -- US/CA are North American
  IF (src_code IN ('US', 'CA') AND tgt_code IN ('US', 'CA')) THEN RETURN 0.15; END IF;

  -- English-speaking but different regions
  IF (src_code IN ('US', 'CA', 'UK', 'GB', 'AU', 'NZ') AND tgt_code IN ('US', 'CA', 'UK', 'GB', 'AU', 'NZ')) THEN
    RETURN 0.35;
  END IF;

  -- Default high distance
  RETURN 0.6;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE regional_learning_packets IS 'Phase 99: Cross-region knowledge transfer with cultural adjustment';
COMMENT ON COLUMN regional_learning_packets.transferability_score IS 'How applicable this pattern is to target region';
COMMENT ON COLUMN regional_learning_packets.cultural_distance IS 'Cultural difference between regions 0.0-1.0';
