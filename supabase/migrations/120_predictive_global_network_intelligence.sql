-- Migration 120: Predictive Global Network Intelligence
-- Required by Phase 68 - Predictive Global Network Intelligence (PGNI)
-- Cross-tenant anonymised predictions

-- Network predictions table
CREATE TABLE IF NOT EXISTS network_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dimension TEXT NOT NULL,
  prediction JSONB NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 50,
  evidence JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT network_predictions_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_network_predictions_dimension ON network_predictions(dimension);
CREATE INDEX IF NOT EXISTS idx_network_predictions_confidence ON network_predictions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_network_predictions_generated ON network_predictions(generated_at DESC);

-- Enable RLS
ALTER TABLE network_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read for authenticated users)
CREATE POLICY network_predictions_select ON network_predictions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY network_predictions_insert ON network_predictions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE network_predictions IS 'Global anonymised predictions (Phase 68)';
