/**
 * Phase 6 Week 2 - ML Pattern & Anomaly Schema Migration
 * Creates tables for pattern detection and anomaly detection results
 */

-- ============================================================================
-- TABLE: convex_alert_patterns
-- PURPOSE: Store detected patterns from K-means clustering analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_alert_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern Info
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pattern_name VARCHAR(255) NOT NULL,

  -- Clustering Data
  centroid DECIMAL(10, 4) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  occurrence_count INTEGER NOT NULL DEFAULT 0,

  -- Severity & Trend
  average_severity VARCHAR(50),
  trend VARCHAR(50) CHECK (trend IN ('increasing', 'decreasing', 'stable')),

  -- Analysis
  description TEXT,
  data_points JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_centroid CHECK (centroid >= 0)
);

CREATE INDEX IF NOT EXISTS idx_patterns_workspace
  ON convex_alert_patterns(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence
  ON convex_alert_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_centroid
  ON convex_alert_patterns(centroid);

-- ============================================================================
-- TABLE: alert_anomalies
-- PURPOSE: Store detected anomalies using statistical and contextual methods
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Anomaly Info
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  value DECIMAL(10, 4) NOT NULL,
  type VARCHAR(100),

  -- Scoring
  statistical_score DECIMAL(3, 2) NOT NULL DEFAULT 0,
  contextual_score DECIMAL(3, 2) NOT NULL DEFAULT 0,
  composite_score DECIMAL(3, 2) NOT NULL DEFAULT 0,
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0,

  -- Classification
  anomaly_type VARCHAR(50) NOT NULL CHECK (
    anomaly_type IN ('outlier', 'sudden_change', 'pattern_break', 'contextual', 'combined')
  ),
  severity VARCHAR(50) NOT NULL CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Analysis
  explanation TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_scores CHECK (
    statistical_score >= 0 AND statistical_score <= 1 AND
    contextual_score >= 0 AND contextual_score <= 1 AND
    composite_score >= 0 AND composite_score <= 1 AND
    confidence >= 0 AND confidence <= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_anomalies_workspace
  ON alert_anomalies(workspace_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity
  ON alert_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_type
  ON alert_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomalies_confidence
  ON alert_anomalies(confidence DESC);

-- ============================================================================
-- TABLE: ml_model_metrics
-- PURPOSE: Track ML model performance and accuracy metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model Info
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  model_type VARCHAR(100) NOT NULL CHECK (
    model_type IN ('pattern_detection', 'anomaly_detection')
  ),
  model_version VARCHAR(50),

  -- Performance Metrics
  precision DECIMAL(3, 2),
  recall DECIMAL(3, 2),
  f1_score DECIMAL(3, 2),
  accuracy DECIMAL(3, 2),

  -- Processing Stats
  total_samples INTEGER DEFAULT 0,
  total_patterns_found INTEGER DEFAULT 0,
  total_anomalies_found INTEGER DEFAULT 0,

  -- Timing
  average_latency_ms INTEGER,
  max_latency_ms INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_metrics CHECK (
    (precision IS NULL OR (precision >= 0 AND precision <= 1)) AND
    (recall IS NULL OR (recall >= 0 AND recall <= 1)) AND
    (f1_score IS NULL OR (f1_score >= 0 AND f1_score <= 1)) AND
    (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 1))
  )
);

CREATE INDEX IF NOT EXISTS idx_ml_metrics_workspace
  ON ml_model_metrics(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_metrics_type
  ON ml_model_metrics(model_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE convex_alert_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- convex_alert_patterns policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'convex_alert_patterns' AND policyname = 'select_patterns'
  ) THEN
    CREATE POLICY select_patterns ON convex_alert_patterns
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'convex_alert_patterns' AND policyname = 'insert_patterns'
  ) THEN
    CREATE POLICY insert_patterns ON convex_alert_patterns
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- alert_anomalies policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alert_anomalies' AND policyname = 'select_anomalies'
  ) THEN
    CREATE POLICY select_anomalies ON alert_anomalies
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alert_anomalies' AND policyname = 'insert_anomalies'
  ) THEN
    CREATE POLICY insert_anomalies ON alert_anomalies
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- ml_model_metrics policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ml_model_metrics' AND policyname = 'select_metrics'
  ) THEN
    CREATE POLICY select_metrics ON ml_model_metrics
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ml_model_metrics' AND policyname = 'insert_metrics'
  ) THEN
    CREATE POLICY insert_metrics ON ml_model_metrics
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT ON convex_alert_patterns TO authenticated;
GRANT SELECT, INSERT ON alert_anomalies TO authenticated;
GRANT SELECT, INSERT ON ml_model_metrics TO authenticated;

COMMENT ON TABLE convex_alert_patterns
  IS 'Phase 6 Week 2 - Detected patterns from K-means clustering analysis';
COMMENT ON TABLE alert_anomalies
  IS 'Phase 6 Week 2 - Detected anomalies using statistical and contextual methods';
COMMENT ON TABLE ml_model_metrics
  IS 'Phase 6 Week 2 - ML model performance and accuracy tracking';
